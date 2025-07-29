-- ==================================================
-- ULTRAMARKET OPTIMIZED DATABASE SCHEMA
-- Production-ready schema with performance optimizations
-- ==================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==================================================
-- USERS & AUTHENTICATION
-- ==================================================

-- Users table with optimized indexes
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('customer', 'vendor', 'admin', 'super_admin')),
    CONSTRAINT users_phone_format CHECK (phone_number IS NULL OR phone_number ~ '^\+?[1-9]\d{1,14}$')
);

-- Optimized indexes for users table
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_role_active ON users(role, is_active);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_email_verified ON users(is_email_verified, email_verified_at);
CREATE INDEX CONCURRENTLY idx_users_phone_verified ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_full_name_gin ON users USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- User sessions table for JWT tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Partition user_sessions by month for better performance
CREATE TABLE user_sessions_template (LIKE user_sessions INCLUDING ALL);

-- Indexes for sessions
CREATE INDEX CONCURRENTLY idx_user_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY idx_user_sessions_token ON user_sessions(token_jti);
CREATE INDEX CONCURRENTLY idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- ==================================================
-- PRODUCTS & CATALOG
-- ==================================================

-- Categories with nested set model for better performance
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    lft INTEGER NOT NULL,
    rgt INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure nested set integrity
    CONSTRAINT categories_lft_rgt_check CHECK (lft < rgt),
    CONSTRAINT categories_level_check CHECK (level >= 0)
);

-- Indexes for categories (optimized for nested set queries)
CREATE INDEX CONCURRENTLY idx_categories_nested_set ON categories(lft, rgt, level);
CREATE INDEX CONCURRENTLY idx_categories_parent ON categories(parent_id);
CREATE INDEX CONCURRENTLY idx_categories_slug_active ON categories(slug) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_categories_name_gin ON categories USING gin(name gin_trgm_ops);

-- Products table with partitioning support
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(1000),
    category_id UUID NOT NULL REFERENCES categories(id),
    vendor_id UUID REFERENCES users(id),
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    weight DECIMAL(8,3),
    dimensions JSONB, -- {length, width, height, unit}
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_digital BOOLEAN NOT NULL DEFAULT false,
    requires_shipping BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    allow_backorder BOOLEAN NOT NULL DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 5,
    search_vector TSVECTOR,
    seo_title VARCHAR(255),
    seo_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT products_price_positive CHECK (price > 0),
    CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    CONSTRAINT products_currency_check CHECK (currency IN ('USD', 'EUR', 'GBP', 'UZS'))
);

-- Comprehensive indexes for products
CREATE INDEX CONCURRENTLY idx_products_active_published ON products(is_active, published_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_products_category_active ON products(category_id, is_active, price);
CREATE INDEX CONCURRENTLY idx_products_vendor_active ON products(vendor_id, is_active) WHERE vendor_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_products_featured ON products(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX CONCURRENTLY idx_products_price_range ON products(price, currency) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_products_stock ON products(stock_quantity, track_inventory) WHERE track_inventory = true;
CREATE INDEX CONCURRENTLY idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX CONCURRENTLY idx_products_name_gin ON products USING gin(name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_products_sku_gin ON products USING gin(sku gin_trgm_ops);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Product variants for complex products
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    weight DECIMAL(8,3),
    option_values JSONB, -- Array of option value IDs
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY idx_product_variants_product ON product_variants(product_id, is_active);
CREATE INDEX CONCURRENTLY idx_product_variants_sku ON product_variants(sku);
CREATE INDEX CONCURRENTLY idx_product_variants_price ON product_variants(price);

-- ==================================================
-- ORDERS & TRANSACTIONS
-- ==================================================

-- Orders table with partitioning by date
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    guest_email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'unfulfilled',
    billing_address JSONB NOT NULL,
    shipping_address JSONB,
    notes TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    CONSTRAINT orders_amounts_check CHECK (total_amount >= 0 AND subtotal >= 0),
    CONSTRAINT orders_user_or_guest CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL))
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for orders (example for 2024)
CREATE TABLE orders_2024_01 PARTITION OF orders FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... Add more partitions as needed

-- Indexes for orders
CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_payment_status ON orders(payment_status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_number ON orders(order_number);
CREATE INDEX CONCURRENTLY idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB NOT NULL, -- Store product details at time of order
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_prices_positive CHECK (unit_price > 0 AND total_price > 0),
    CONSTRAINT order_items_product_or_variant CHECK ((product_id IS NOT NULL) OR (variant_id IS NOT NULL))
);

CREATE INDEX CONCURRENTLY idx_order_items_order ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_order_items_product ON order_items(product_id) WHERE product_id IS NOT NULL;

-- ==================================================
-- SHOPPING CART
-- ==================================================

-- Shopping cart with expiration
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    custom_attributes JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT cart_items_user_or_session CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL)),
    CONSTRAINT cart_items_product_or_variant CHECK ((product_id IS NOT NULL) OR (variant_id IS NOT NULL)),
    CONSTRAINT cart_items_unique_user_product UNIQUE (user_id, product_id, variant_id),
    CONSTRAINT cart_items_unique_session_product UNIQUE (session_id, product_id, variant_id)
);

-- Indexes for cart items
CREATE INDEX CONCURRENTLY idx_cart_items_user ON cart_items(user_id, updated_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_cart_items_session ON cart_items(session_id, updated_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_cart_items_expires ON cart_items(expires_at);

-- ==================================================
-- INVENTORY MANAGEMENT
-- ==================================================

-- Inventory tracking with audit trail
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'adjustment', 'return', etc.
    reference_id UUID,
    reason TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_transaction_type_check CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return', 'damage', 'theft')),
    CONSTRAINT inventory_product_or_variant CHECK ((product_id IS NOT NULL) OR (variant_id IS NOT NULL))
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for inventory transactions
CREATE TABLE inventory_transactions_2024_01 PARTITION OF inventory_transactions FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for inventory transactions
CREATE INDEX CONCURRENTLY idx_inventory_product_created ON inventory_transactions(product_id, created_at DESC) WHERE product_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_inventory_variant_created ON inventory_transactions(variant_id, created_at DESC) WHERE variant_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_inventory_reference ON inventory_transactions(reference_type, reference_id);

-- ==================================================
-- ANALYTICS & REPORTING
-- ==================================================

-- Daily product views for analytics
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate views within a short timeframe
    UNIQUE(product_id, user_id, session_id, date_trunc('hour', viewed_at))
) PARTITION BY RANGE (viewed_at);

-- Create monthly partitions for product views
CREATE TABLE product_views_2024_01 PARTITION OF product_views FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for product views
CREATE INDEX CONCURRENTLY idx_product_views_product_date ON product_views(product_id, viewed_at DESC);
CREATE INDEX CONCURRENTLY idx_product_views_user_date ON product_views(user_id, viewed_at DESC) WHERE user_id IS NOT NULL;

-- ==================================================
-- PERFORMANCE MONITORING
-- ==================================================

-- Query performance tracking
CREATE TABLE query_performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_type VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for query performance
CREATE TABLE query_performance_log_2024_01 PARTITION OF query_performance_log FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ==================================================
-- TRIGGERS & FUNCTIONS
-- ==================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cart items
CREATE OR REPLACE FUNCTION clean_expired_cart_items()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cart_items WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_variant_id UUID,
    p_quantity_change INTEGER,
    p_transaction_type VARCHAR(50),
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Lock the row to prevent race conditions
    IF p_variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO current_stock
        FROM product_variants
        WHERE id = p_variant_id
        FOR UPDATE;
        
        new_stock := current_stock + p_quantity_change;
        
        UPDATE product_variants
        SET stock_quantity = new_stock
        WHERE id = p_variant_id;
    ELSE
        SELECT stock_quantity INTO current_stock
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;
        
        new_stock := current_stock + p_quantity_change;
        
        UPDATE products
        SET stock_quantity = new_stock
        WHERE id = p_product_id;
    END IF;
    
    -- Record the inventory transaction
    INSERT INTO inventory_transactions (
        product_id, variant_id, transaction_type, quantity_change,
        previous_quantity, new_quantity, reference_type, reference_id,
        user_id, reason
    ) VALUES (
        p_product_id, p_variant_id, p_transaction_type, p_quantity_change,
        current_stock, new_stock, p_reference_type, p_reference_id,
        p_user_id, p_reason
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ==================================================

-- Popular products view (refresh hourly)
CREATE MATERIALIZED VIEW popular_products AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.currency,
    COUNT(pv.id) as view_count,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as total_sold,
    AVG(oi.unit_price) as avg_selling_price
FROM products p
LEFT JOIN product_views pv ON p.id = pv.product_id 
    AND pv.viewed_at >= NOW() - INTERVAL '30 days'
LEFT JOIN order_items oi ON p.id = oi.product_id
    AND oi.created_at >= NOW() - INTERVAL '30 days'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.price, p.currency
ORDER BY view_count DESC, total_sold DESC;

CREATE UNIQUE INDEX ON popular_products (id);

-- Sales summary by day
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
    date_trunc('day', created_at) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
    AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX ON daily_sales_summary (sale_date);

-- ==================================================
-- INDEXES FOR COMPLEX QUERIES
-- ==================================================

-- Multi-column indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_products_category_price_stock ON products(category_id, price, stock_quantity) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_orders_user_status_date ON orders(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_order_items_product_date ON order_items(product_id, created_at DESC);

-- Partial indexes for specific conditions
CREATE INDEX CONCURRENTLY idx_products_low_stock ON products(stock_quantity, name) WHERE track_inventory = true AND stock_quantity <= low_stock_threshold;
CREATE INDEX CONCURRENTLY idx_orders_pending_payment ON orders(created_at DESC) WHERE payment_status = 'pending';
CREATE INDEX CONCURRENTLY idx_users_unverified_email ON users(created_at) WHERE is_email_verified = false;

-- ==================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ==================================================

-- Get product with stock info
CREATE OR REPLACE FUNCTION get_product_with_stock(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    price DECIMAL,
    stock_quantity INTEGER,
    is_in_stock BOOLEAN,
    variants_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.stock_quantity,
        (p.stock_quantity > 0 OR NOT p.track_inventory) as is_in_stock,
        COALESCE(v.variant_count, 0) as variants_count
    FROM products p
    LEFT JOIN (
        SELECT product_id, COUNT(*) as variant_count
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON p.id = v.product_id
    WHERE p.id = p_product_id AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- VACUUM & MAINTENANCE
-- ==================================================

-- Auto-vacuum settings for high-traffic tables
ALTER TABLE products SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE product_views SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- ==================================================
-- COMMENTS FOR DOCUMENTATION
-- ==================================================

COMMENT ON TABLE users IS 'Core users table with authentication and profile information';
COMMENT ON TABLE products IS 'Products catalog with full-text search and inventory tracking';
COMMENT ON TABLE orders IS 'Customer orders with comprehensive tracking and partitioning';
COMMENT ON TABLE cart_items IS 'Shopping cart items with automatic expiration';
COMMENT ON TABLE inventory_transactions IS 'Audit trail for all inventory changes';

-- ==================================================
-- GRANTS AND PERMISSIONS
-- ==================================================

-- Create application user roles
CREATE ROLE ultramarket_app;
CREATE ROLE ultramarket_readonly;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE ultramarket TO ultramarket_app;
GRANT USAGE ON SCHEMA public TO ultramarket_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ultramarket_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ultramarket_app;

-- Readonly access for analytics
GRANT CONNECT ON DATABASE ultramarket TO ultramarket_readonly;
GRANT USAGE ON SCHEMA public TO ultramarket_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ultramarket_readonly; 