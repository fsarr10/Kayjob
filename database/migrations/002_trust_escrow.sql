-- KayJob trust, escrow and anti-fraud foundation.
-- Run after database/schema.sql. Amounts are integer XOF, never floating point.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preview_delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'final_delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'client_review';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed_released';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'dispute_opened';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'dispute_resolved_client';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'dispute_resolved_provider';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(40),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(180),
  ADD COLUMN IF NOT EXISTS amount_total INTEGER,
  ADD COLUMN IF NOT EXISTS commission_amount INTEGER,
  ADD COLUMN IF NOT EXISTS amount_net_provider INTEGER,
  ADD COLUMN IF NOT EXISTS held_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS review_deadline_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

UPDATE orders
SET amount_total = COALESCE(amount_total, gross_amount),
    amount_net_provider = COALESCE(amount_net_provider, net_amount)
WHERE amount_total IS NULL OR amount_net_provider IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_amounts_non_negative'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_amounts_non_negative CHECK (
      gross_amount >= 0 AND commission_amount >= 0 AND net_amount >= 0
      AND (amount_total IS NULL OR amount_total >= 0)
      AND (amount_net_provider IS NULL OR amount_net_provider >= 0)
    );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_reference_unique
  ON orders(payment_provider, payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  provider_event_id VARCHAR(180) NOT NULL,
  provider_reference VARCHAR(180),
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  milestone_id BIGINT,
  user_id BIGINT REFERENCES users(id),
  kind VARCHAR(40) NOT NULL CHECK (kind IN ('collection', 'hold', 'release', 'commission', 'payout', 'refund', 'adjustment')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount_xof INTEGER NOT NULL CHECK (amount_xof > 0),
  provider VARCHAR(40),
  provider_reference VARCHAR(180),
  idempotency_key VARCHAR(180) NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS transactions_order_created_idx ON transactions(order_id, created_at);
CREATE INDEX IF NOT EXISTS transactions_user_created_idx ON transactions(user_id, created_at);

CREATE OR REPLACE FUNCTION kayjob_transactions_are_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'transactions_are_append_only';
END;
$$;

DROP TRIGGER IF EXISTS transactions_append_only ON transactions;
CREATE TRIGGER transactions_append_only
BEFORE UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION kayjob_transactions_are_immutable();

CREATE TABLE IF NOT EXISTS milestones (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  label VARCHAR(180) NOT NULL,
  amount_xof INTEGER NOT NULL CHECK (amount_xof > 0),
  status order_status NOT NULL DEFAULT 'awaiting_payment',
  held_at TIMESTAMP,
  delivered_at TIMESTAMP,
  review_deadline_at TIMESTAMP,
  released_at TIMESTAMP,
  UNIQUE(order_id, sequence)
);
CREATE INDEX IF NOT EXISTS milestones_order_status_idx ON milestones(order_id, status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_milestone_fk'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_milestone_fk FOREIGN KEY (milestone_id) REFERENCES milestones(id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS delivery_files (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  milestone_id BIGINT REFERENCES milestones(id),
  uploader_id BIGINT NOT NULL REFERENCES users(id),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('preview', 'final')),
  original_storage_key TEXT NOT NULL,
  preview_storage_key TEXT,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  is_watermarked BOOLEAN NOT NULL DEFAULT false,
  excerpt_ratio NUMERIC(5,4),
  signed_url_expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS delivery_files_order_kind_idx ON delivery_files(order_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS risk_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  order_id BIGINT REFERENCES orders(id),
  event_type VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  redacted_value TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS risk_events_user_created_idx ON risk_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS account_security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  event_type VARCHAR(60) NOT NULL,
  device_fingerprint_hash VARCHAR(128),
  ip_hash VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION kayjob_reject_unreleased_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE id = NEW.order_id AND status = 'completed_released'
  ) THEN
    RAISE EXCEPTION 'reviews_require_completed_released_order';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_require_released_order ON reviews;
CREATE TRIGGER reviews_require_released_order
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION kayjob_reject_unreleased_review();

CREATE OR REPLACE FUNCTION kayjob_reject_unprotected_final()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE current_status order_status;
BEGIN
  IF NEW.kind = 'final' THEN
    SELECT status INTO current_status FROM orders WHERE id = NEW.order_id FOR UPDATE;
    IF current_status NOT IN ('escrowed', 'in_progress', 'preview_delivered', 'final_delivered', 'client_review', 'completed_released') THEN
      RAISE EXCEPTION 'final_delivery_requires_verified_payment';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivery_files_require_held_order ON delivery_files;
CREATE TRIGGER delivery_files_require_held_order
BEFORE INSERT ON delivery_files
FOR EACH ROW EXECUTE FUNCTION kayjob_reject_unprotected_final();

COMMENT ON TABLE transactions IS 'Append-only financial ledger. Never update or delete rows.';
COMMENT ON TABLE payment_events IS 'Provider webhook inbox with idempotency and signature audit.';
COMMENT ON TABLE delivery_files IS 'Original files remain private; only short-lived signed URLs are exposed.';
