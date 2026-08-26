-- Withdrawal 2FA challenges and auditable payout confirmation.
CREATE TABLE IF NOT EXISTS withdrawal_2fa_challenges (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  withdrawal_id BIGINT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  code_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS withdrawal_2fa_active_idx ON withdrawal_2fa_challenges(withdrawal_id, expires_at) WHERE consumed_at IS NULL;
