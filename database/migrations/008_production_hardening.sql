-- Production hardening for the API contracts used by web and mobile.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_order_unique_idx
  ON conversations(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS services_active_profile_idx
  ON services(is_active, profile_id);

CREATE INDEX IF NOT EXISTS disputes_status_created_idx
  ON disputes(status, id);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON messages(conversation_id, created_at);
