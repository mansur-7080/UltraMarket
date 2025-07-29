-- ========================================
-- ULTRAMARKET DATABASE PROFESSIONAL INDEXING
-- Performance Optimization & Query Enhancement
-- ========================================

-- Drop existing indexes if they exist (for clean setup)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_products_category_status;
DROP INDEX IF EXISTS idx_products_name_search;
DROP INDEX IF EXISTS idx_products_price_range;
DROP INDEX IF EXISTS idx_products_stock_availability;
DROP INDEX IF EXISTS idx_orders_user_status;
DROP INDEX IF EXISTS idx_orders_created_date;
DROP INDEX IF EXISTS idx_order_items_product_order;
DROP INDEX IF EXISTS idx_payments_order_status;
DROP INDEX IF EXISTS idx_payments_created_at;
DROP INDEX IF EXISTS idx_reviews_product_rating;
DROP INDEX IF EXISTS idx_cart_items_user_active;
DROP INDEX IF EXISTS idx_inventory_product_location;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_sessions_user_active;

-- ========================================
-- USER MANAGEMENT INDEXES
-- ========================================

-- Primary user lookup indexes
CREATE INDEX CONCURRENTLY idx_users_email 
ON users USING btree (email) 
WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_users_phone 
ON users USING btree (phone) 
WHERE phone IS NOT NULL;

-- User activity tracking
CREATE INDEX CONCURRENTLY idx_users_created_at 
ON users USING btree (created_at DESC);

-- User status and role filtering
CREATE INDEX CONCURRENTLY idx_users_status_role 
ON users USING btree (status, role) 
WHERE status = 'active';

-- Full-text search for user names
CREATE INDEX CONCURRENTLY idx_users_fulltext_search 
ON users USING gin(to_tsvector('uzbek', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- ========================================
-- PRODUCT CATALOG INDEXES
-- ========================================

-- Category and status filtering (most common query)
CREATE INDEX CONCURRENTLY idx_products_category_status 
ON products USING btree (category_id, status) 
WHERE status = 'active';

-- Product name search optimization
CREATE INDEX CONCURRENTLY idx_products_name_search 
ON products USING gin(to_tsvector('uzbek', name));

-- Price range filtering
CREATE INDEX CONCURRENTLY idx_products_price_range 
ON products USING btree (price) 
WHERE status = 'active';

-- Stock availability check
CREATE INDEX CONCURRENTLY idx_products_stock_availability 
ON products USING btree (stock_quantity) 
WHERE status = 'active' AND stock_quantity > 0;

-- SKU lookup (unique constraint already creates index)
-- But we ensure it exists for fast lookups
CREATE UNIQUE INDEX CONCURRENTLY idx_products_sku_unique 
ON products USING btree (sku) 
WHERE sku IS NOT NULL;

-- Product sorting by popularity/rating
CREATE INDEX CONCURRENTLY idx_products_rating_popularity 
ON products USING btree (average_rating DESC, total_reviews DESC, created_at DESC) 
WHERE status = 'active';

-- Multi-column index for complex product filtering
CREATE INDEX CONCURRENTLY idx_products_complex_filter 
ON products USING btree (category_id, price, status, stock_quantity) 
WHERE status = 'active';

-- ========================================
-- ORDER MANAGEMENT INDEXES
-- ========================================

-- User orders lookup (most frequent query)
CREATE INDEX CONCURRENTLY idx_orders_user_status 
ON orders USING btree (user_id, status, created_at DESC);

-- Order date range filtering
CREATE INDEX CONCURRENTLY idx_orders_created_date 
ON orders USING btree (created_at DESC);

-- Order status tracking
CREATE INDEX CONCURRENTLY idx_orders_status_updated 
ON orders USING btree (status, updated_at DESC) 
WHERE status IN ('pending', 'processing', 'shipped');

-- Order total amount filtering
CREATE INDEX CONCURRENTLY idx_orders_amount_range 
ON orders USING btree (total_amount) 
WHERE status != 'cancelled';

-- ========================================
-- ORDER ITEMS OPTIMIZATION
-- ========================================

-- Order items lookup
CREATE INDEX CONCURRENTLY idx_order_items_product_order 
ON order_items USING btree (product_id, order_id);

-- Product sales analytics
CREATE INDEX CONCURRENTLY idx_order_items_product_quantity 
ON order_items USING btree (product_id, quantity, created_at DESC);

-- ========================================
-- PAYMENT SYSTEM INDEXES
-- ========================================

-- Payment status and order relationship
CREATE INDEX CONCURRENTLY idx_payments_order_status 
ON payments USING btree (order_id, status, created_at DESC);

-- Payment method analytics
CREATE INDEX CONCURRENTLY idx_payments_method_date 
ON payments USING btree (payment_method, created_at DESC) 
WHERE status = 'completed';

-- Payment transaction lookup
CREATE INDEX CONCURRENTLY idx_payments_transaction_id 
ON payments USING btree (transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Payme specific transaction lookup
CREATE INDEX CONCURRENTLY idx_payme_transactions_order 
ON payme_transactions USING btree (order_id, state, created_at DESC);

-- ========================================
-- REVIEW SYSTEM INDEXES
-- ========================================

-- Product reviews lookup
CREATE INDEX CONCURRENTLY idx_reviews_product_rating 
ON reviews USING btree (product_id, rating DESC, created_at DESC) 
WHERE status = 'approved';

-- User reviews history
CREATE INDEX CONCURRENTLY idx_reviews_user_date 
ON reviews USING btree (user_id, created_at DESC);

-- Review moderation
CREATE INDEX CONCURRENTLY idx_reviews_status_created 
ON reviews USING btree (status, created_at ASC) 
WHERE status = 'pending';

-- ========================================
-- SHOPPING CART OPTIMIZATION
-- ========================================

-- Active cart items per user
CREATE INDEX CONCURRENTLY idx_cart_items_user_active 
ON cart_items USING btree (user_id, created_at DESC) 
WHERE is_active = true;

-- Cart product lookup
CREATE INDEX CONCURRENTLY idx_cart_items_product_user 
ON cart_items USING btree (product_id, user_id) 
WHERE is_active = true;

-- ========================================
-- INVENTORY MANAGEMENT
-- ========================================

-- Inventory tracking by product and location
CREATE INDEX CONCURRENTLY idx_inventory_product_location 
ON inventory USING btree (product_id, warehouse_location, updated_at DESC);

-- Low stock alerts
CREATE INDEX CONCURRENTLY idx_inventory_low_stock 
ON inventory USING btree (quantity) 
WHERE quantity <= 10;

-- ========================================
-- AUDIT AND LOGGING INDEXES
-- ========================================

-- Audit log timestamp for cleanup and analysis
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp 
ON audit_logs USING btree (created_at DESC);

-- Audit log user activity
CREATE INDEX CONCURRENTLY idx_audit_logs_user_action 
ON audit_logs USING btree (user_id, action, created_at DESC);

-- ========================================
-- SESSION MANAGEMENT
-- ========================================

-- Active user sessions
CREATE INDEX CONCURRENTLY idx_sessions_user_active 
ON user_sessions USING btree (user_id, expires_at DESC) 
WHERE is_active = true;

-- Session cleanup
CREATE INDEX CONCURRENTLY idx_sessions_cleanup 
ON user_sessions USING btree (expires_at ASC) 
WHERE is_active = false;

-- ========================================
-- NOTIFICATION SYSTEM INDEXES
-- ========================================

-- User notifications lookup
CREATE INDEX CONCURRENTLY idx_notifications_user_status 
ON notifications USING btree (user_id, status, created_at DESC);

-- Unread notifications count
CREATE INDEX CONCURRENTLY idx_notifications_unread 
ON notifications USING btree (user_id, created_at DESC) 
WHERE status = 'unread';

-- ========================================
-- SEARCH AND ANALYTICS INDEXES
-- ========================================

-- Search queries analytics
CREATE INDEX CONCURRENTLY idx_search_queries_term_date 
ON search_queries USING btree (query_term, created_at DESC);

-- Popular searches
CREATE INDEX CONCURRENTLY idx_search_queries_frequency 
ON search_queries USING btree (frequency DESC, created_at DESC);

-- ========================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ========================================

-- Active products only (90% of queries)
CREATE INDEX CONCURRENTLY idx_active_products_comprehensive 
ON products USING btree (category_id, price, average_rating DESC) 
WHERE status = 'active' AND stock_quantity > 0;

-- Recent orders for dashboard
CREATE INDEX CONCURRENTLY idx_recent_orders_dashboard 
ON orders USING btree (created_at DESC, status) 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Pending payments for processing
CREATE INDEX CONCURRENTLY idx_pending_payments 
ON payments USING btree (created_at ASC, payment_method) 
WHERE status = 'pending';

-- ========================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ========================================

-- Product search with filters (e-commerce specific)
CREATE INDEX CONCURRENTLY idx_product_search_composite 
ON products USING btree (category_id, price, average_rating DESC, stock_quantity) 
WHERE status = 'active';

-- User order history with pagination
CREATE INDEX CONCURRENTLY idx_user_order_history 
ON orders USING btree (user_id, created_at DESC, id) 
WHERE status != 'draft';

-- Analytics: sales by product and date
CREATE INDEX CONCURRENTLY idx_sales_analytics 
ON order_items USING btree (product_id, DATE(created_at), quantity);

-- ========================================
-- UZBEKISTAN-SPECIFIC INDEXES
-- ========================================

-- Phone number lookup (Uzbekistan format)
CREATE INDEX CONCURRENTLY idx_uzbek_phone_format 
ON users USING btree (phone) 
WHERE phone ~ '^\+998\d{9}$';

-- Regional delivery optimization
CREATE INDEX CONCURRENTLY idx_delivery_region 
ON orders USING btree (shipping_region, status, created_at DESC) 
WHERE shipping_region IS NOT NULL;

-- ========================================
-- PERFORMANCE MONITORING INDEXES
-- ========================================

-- Database performance monitoring
CREATE INDEX CONCURRENTLY idx_performance_logs 
ON performance_logs USING btree (created_at DESC, query_duration DESC);

-- Error tracking
CREATE INDEX CONCURRENTLY idx_error_logs_severity 
ON error_logs USING btree (severity, created_at DESC, resolved) 
WHERE resolved = false;

-- ========================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ========================================

-- Popular products materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_products AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.category_id,
    COUNT(oi.id) as total_sales,
    SUM(oi.quantity) as total_quantity_sold,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.price, p.category_id;

CREATE UNIQUE INDEX idx_popular_products_id ON popular_products (id);
CREATE INDEX idx_popular_products_sales ON popular_products (total_sales DESC);

-- Sales analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_analytics AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.user_id) as unique_customers
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX idx_daily_sales_date ON daily_sales_analytics (sale_date);

-- ========================================
-- INDEX MAINTENANCE COMMANDS
-- ========================================

-- Refresh materialized views (run daily)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_analytics;

-- ========================================
-- OPTIMIZATION QUERIES
-- ========================================

-- Update table statistics
ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
ANALYZE reviews;
ANALYZE cart_items;
ANALYZE inventory;

-- ========================================
-- PERFORMANCE MONITORING QUERIES
-- ========================================

-- Query to check index usage
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read / NULLIF(idx_tup_fetch, 0) as ratio
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
*/

-- Query to find unused indexes
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0
ORDER BY schemaname, tablename;
*/

-- ========================================
-- MAINTENANCE RECOMMENDATIONS
-- ========================================

/*
MAINTENANCE SCHEDULE:

Daily:
- REFRESH MATERIALIZED VIEW popular_products;
- REFRESH MATERIALIZED VIEW daily_sales_analytics;
- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
- DELETE FROM user_sessions WHERE expires_at < NOW();

Weekly:
- VACUUM ANALYZE users;
- VACUUM ANALYZE products;
- VACUUM ANALYZE orders;
- REINDEX INDEX CONCURRENTLY idx_products_name_search;

Monthly:
- Full database VACUUM and ANALYZE
- Review and optimize slow queries
- Check index usage statistics
- Clean up old logs and temporary data
*/

-- Performance tuning parameters (add to postgresql.conf)
/*
shared_buffers = 25% of RAM
effective_cache_size = 75% of RAM
work_mem = 4MB
maintenance_work_mem = 64MB
random_page_cost = 1.1
effective_io_concurrency = 200
max_worker_processes = CPU cores
max_parallel_workers_per_gather = 2
*/ 