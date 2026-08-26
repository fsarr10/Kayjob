-- Secure preview sessions for image/video streaming.
-- The raw preview token must only exist in the client response; store its hash here.

ALTER TABLE delivery_files
  ADD COLUMN IF NOT EXISTS preview_token_hash VARCHAR(128),
  ADD COLUMN IF NOT EXISTS streaming_only BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dynamic_watermark_text VARCHAR(240);

CREATE UNIQUE INDEX IF NOT EXISTS delivery_files_preview_token_hash_unique
  ON delivery_files(preview_token_hash)
  WHERE preview_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS preview_sessions (
  id BIGSERIAL PRIMARY KEY,
  delivery_file_id BIGINT NOT NULL REFERENCES delivery_files(id) ON DELETE CASCADE,
  viewer_id BIGINT NOT NULL REFERENCES users(id),
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  last_chunk_at TIMESTAMP,
  chunks_served INTEGER NOT NULL DEFAULT 0 CHECK (chunks_served >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS preview_sessions_active_idx
  ON preview_sessions(token_hash, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS preview_security_events (
  id BIGSERIAL PRIMARY KEY,
  preview_session_id BIGINT REFERENCES preview_sessions(id) ON DELETE SET NULL,
  delivery_file_id BIGINT REFERENCES delivery_files(id) ON DELETE SET NULL,
  viewer_id BIGINT REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('screenshot', 'screen_recording', 'copy_attempt', 'expired_token', 'revoked_token', 'rate_limited')),
  platform VARCHAR(20),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS preview_security_events_viewer_idx
  ON preview_security_events(viewer_id, created_at DESC);

INSERT INTO platform_settings (key, value)
VALUES
  ('preview_security', '{"token_ttl_seconds":900,"chunk_size_bytes":524288,"max_concurrent_sessions":2,"dynamic_watermark":true}'::jsonb),
  ('review_window', '{"hours":72}'::jsonb),
  ('milestone_threshold', '{"amount_xof":50000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE preview_sessions IS 'Short-lived access sessions for chunked preview streaming; raw tokens are never persisted.';
COMMENT ON TABLE preview_security_events IS 'Capture and preview abuse telemetry. These events are deterrence signals, not absolute prevention.';
