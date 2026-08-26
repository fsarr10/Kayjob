CREATE TYPE delivery_mode AS ENUM ('remote', 'onsite', 'both');
CREATE TYPE order_status AS ENUM ('draft', 'awaiting_payment', 'escrowed', 'in_progress', 'delivered', 'validated', 'disputed', 'paid_out', 'cancelled');

CREATE TABLE regions (id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE);
CREATE TABLE cities (id BIGSERIAL PRIMARY KEY, region_id BIGINT REFERENCES regions(id), name VARCHAR(120) NOT NULL);
CREATE UNIQUE INDEX cities_region_name_unique ON cities(region_id, name);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  pseudo VARCHAR(80) UNIQUE,
  email VARCHAR(180) UNIQUE,
  phone VARCHAR(40) UNIQUE,
  city_id BIGINT REFERENCES cities(id),
  can_sell BOOLEAN NOT NULL DEFAULT false,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, is_active BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE skills (id BIGSERIAL PRIMARY KEY, category_id BIGINT REFERENCES categories(id), name VARCHAR(120) NOT NULL, default_delivery_mode delivery_mode NOT NULL DEFAULT 'remote');
CREATE UNIQUE INDEX skills_category_name_unique ON skills(category_id, name);

CREATE TABLE student_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id),
  headline VARCHAR(180) NOT NULL,
  bio TEXT NOT NULL,
  availability VARCHAR(120),
  sama_score INTEGER NOT NULL DEFAULT 50 CHECK (sama_score BETWEEN 0 AND 100)
);
CREATE INDEX student_profiles_sama_score_idx ON student_profiles(sama_score DESC);

CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES student_profiles(id),
  category_id BIGINT REFERENCES categories(id),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  delivery_mode delivery_mode NOT NULL,
  starting_price INTEGER NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX services_category_mode_price_idx ON services(category_id, delivery_mode, starting_price);
CREATE INDEX services_active_idx ON services(is_active);

CREATE TABLE portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES student_profiles(id),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  media_url TEXT,
  external_url TEXT,
  item_type VARCHAR(30) NOT NULL DEFAULT 'image',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX portfolio_items_profile_idx ON portfolio_items(profile_id, created_at DESC);

CREATE TABLE missions (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES users(id),
  category_id BIGINT REFERENCES categories(id),
  city_id BIGINT REFERENCES cities(id),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  delivery_mode delivery_mode NOT NULL,
  budget_max INTEGER NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX missions_open_mode_city_idx ON missions(is_open, delivery_mode, city_id);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES users(id),
  profile_id BIGINT REFERENCES student_profiles(id),
  service_id BIGINT REFERENCES services(id),
  mission_id BIGINT REFERENCES missions(id),
  status order_status NOT NULL DEFAULT 'draft',
  gross_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  escrow_reference VARCHAR(160)
);
CREATE INDEX orders_client_status_idx ON orders(client_id, status);
CREATE INDEX orders_profile_status_idx ON orders(profile_id, status);

CREATE TABLE conversations (id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES orders(id), mission_id BIGINT REFERENCES missions(id));
CREATE TABLE messages (id BIGSERIAL PRIMARY KEY, conversation_id BIGINT REFERENCES conversations(id), sender_id BIGINT REFERENCES users(id), body TEXT NOT NULL, attachment_url TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX messages_conversation_created_idx ON messages(conversation_id, created_at);

CREATE TABLE reviews (id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES orders(id), reviewer_id BIGINT REFERENCES users(id), reviewee_id BIGINT REFERENCES users(id), rating SMALLINT CHECK (rating BETWEEN 1 AND 5), comment TEXT);
CREATE TABLE disputes (id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES orders(id), opened_by BIGINT REFERENCES users(id), status VARCHAR(40) NOT NULL DEFAULT 'open', reason TEXT NOT NULL);
CREATE TABLE platform_settings (key VARCHAR(120) PRIMARY KEY, value JSONB NOT NULL);

INSERT INTO platform_settings VALUES ('commission', '{"type":"percentage","rate":0.10,"minimum_xof":250}');
