DO $$
BEGIN
    IF to_regclass('public.users') IS NULL AND to_regclass('public.customers') IS NOT NULL THEN
        ALTER TABLE customers RENAME TO users;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
    email TEXT NOT NULL UNIQUE,
    google_id TEXT,
    profile_picture TEXT,
    password_hash TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'password'
        CHECK (auth_provider IN ('password', 'google', 'password+google')),
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_auth_provider_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_provider_check
            CHECK (auth_provider IN ('password', 'google', 'password+google'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
    image_url TEXT NOT NULL DEFAULT '',
    vegetarian BOOLEAN NOT NULL DEFAULT true,
    available BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count SMALLINT NOT NULL CHECK (guest_count BETWEEN 1 AND 20),
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_slot_idx
    ON reservations (reservation_date, reservation_time)
    WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS reservations_customer_idx ON reservations (customer_id);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'payment_pending'
        CHECK (status IN ('payment_pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'payment_failed')),
    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_provider TEXT NOT NULL DEFAULT 'razorpay',
    payment_order_id TEXT UNIQUE,
    payment_id TEXT UNIQUE,
    subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
    tax_paise INTEGER NOT NULL CHECK (tax_paise >= 0),
    delivery_paise INTEGER NOT NULL CHECK (delivery_paise >= 0),
    total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity SMALLINT NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0)
);

CREATE TABLE IF NOT EXISTS payment_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO menu_items (name, description, category, price_paise, vegetarian, featured)
SELECT seed.name, seed.description, seed.category, seed.price_paise, seed.vegetarian, seed.featured
FROM (VALUES
    ('Paneer Tikka', 'Char-grilled paneer with a fragrant house spice marinade.', 'Indian Starters', 32900, true, true),
    ('Tandoori Chicken', 'Smoky tandoor-roasted chicken with mint chutney.', 'Tandoori Specials', 44900, false, true),
    ('Dal Midnight', 'Slow-simmered black lentils finished with cream and butter.', 'North Indian Main Course', 36900, true, true),
    ('Hyderabadi Dum Biryani', 'Layered basmati rice, aromatic spices and slow-cooked flavour.', 'Biryani and Rice', 42900, false, true),
    ('Butter Naan', 'Soft tandoor-baked flatbread finished with butter.', 'Indian Breads', 7900, true, false),
    ('Gulab Jamun', 'Warm milk dumplings soaked in cardamom-scented syrup.', 'Desserts', 14900, true, false),
    ('Masala Chai', 'Freshly brewed tea with warming Indian spices.', 'Beverages', 9900, true, false),
    ('Masala Dosa', 'Crisp rice crepe with spiced potato, sambar and chutney.', 'South Indian Specialties', 24900, true, false)
) AS seed(name, description, category, price_paise, vegetarian, featured)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
