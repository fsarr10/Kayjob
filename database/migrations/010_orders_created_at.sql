-- Add a stable creation timestamp for orders without blocking existing databases.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
