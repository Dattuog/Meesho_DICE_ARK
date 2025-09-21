-- Project Phoenix Database Schema
-- Based on Technical Architecture Document
-- PostgreSQL Schema for Core Transactional Data

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS return_decisions CASCADE;
DROP TABLE IF EXISTS quality_assessments CASCADE;
DROP TABLE IF EXISTS renewed_inventory CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS processing_centers CASCADE;
DROP TABLE IF EXISTS ngos CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    address JSONB,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    loyalty_tier VARCHAR(20) DEFAULT 'BRONZE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    original_price DECIMAL(10,2) NOT NULL,
    images JSONB,
    specifications JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    delivery_address JSONB,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items Table (Junction table for orders and products)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ORDERED',
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NGOs Table for CareConnect
CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngo_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB NOT NULL,
    location POINT,
    registration_number VARCHAR(100) UNIQUE,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    accepted_categories TEXT[],
    capacity_limit INTEGER DEFAULT 100,
    current_capacity INTEGER DEFAULT 0,
    impact_metrics JSONB,
    contact_person VARCHAR(255),
    bank_details JSONB,
    documents JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Processing Centers for Re-commerce
CREATE TABLE processing_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location POINT NOT NULL,
    address JSONB NOT NULL,
    capacity INTEGER DEFAULT 1000,
    current_load INTEGER DEFAULT 0,
    specializations TEXT[],
    equipment JSONB,
    staff_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Donations Table for CareConnect Path
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id VARCHAR(100) UNIQUE NOT NULL,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    original_item_value DECIMAL(10,2) NOT NULL,
    credit_given DECIMAL(10,2) NOT NULL,
    pickup_scheduled_at TIMESTAMP,
    pickup_completed_at TIMESTAMP,
    delivered_to_ngo_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'INITIATED',
    impact_report JSONB,
    tax_benefit_amount DECIMAL(10,2),
    logistics_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Renewed Inventory for Re-commerce Path
CREATE TABLE renewed_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id VARCHAR(100) UNIQUE NOT NULL,
    original_order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    processing_center_id UUID REFERENCES processing_centers(id) ON DELETE SET NULL,
    grade VARCHAR(20) NOT NULL CHECK (grade IN ('LIKE_NEW', 'GOOD', 'FAIR')),
    condition_notes TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    acquisition_cost DECIMAL(10,2) NOT NULL,
    processing_cost DECIMAL(10,2) DEFAULT 0,
    listed_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    profit_margin DECIMAL(10,2),
    refurbishment_details JSONB,
    new_images JSONB,
    status VARCHAR(50) DEFAULT 'RECEIVED',
    received_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    listed_at TIMESTAMP,
    sold_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality Assessments for Re-commerce Items
CREATE TABLE quality_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(100) UNIQUE NOT NULL,
    inventory_id UUID REFERENCES renewed_inventory(id) ON DELETE CASCADE,
    assessor_id VARCHAR(100),
    visual_condition_score INTEGER CHECK (visual_condition_score BETWEEN 0 AND 100),
    functional_score INTEGER CHECK (functional_score BETWEEN 0 AND 100),
    packaging_score INTEGER CHECK (packaging_score BETWEEN 0 AND 100),
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    defects_found JSONB,
    photos JSONB,
    assessment_method VARCHAR(50) DEFAULT 'MANUAL',
    ai_confidence_score DECIMAL(5,2),
    recommended_grade VARCHAR(20),
    recommended_price DECIMAL(10,2),
    assessment_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Return Decisions Table for Decision Engine
CREATE TABLE return_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    return_reason VARCHAR(255),
    item_condition VARCHAR(100),
    item_value DECIMAL(10,2) NOT NULL,
    decision_path VARCHAR(50) NOT NULL CHECK (decision_path IN ('CARECONNECT', 'RECOMMERCE', 'TRADITIONAL')),
    decision_score DECIMAL(5,2),
    decision_factors JSONB,
    estimated_credit DECIMAL(10,2),
    estimated_resale_value DECIMAL(10,2),
    processing_cost_estimate DECIMAL(10,2),
    user_choice VARCHAR(50),
    final_outcome VARCHAR(50),
    revenue_impact DECIMAL(10,2),
    cost_savings DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Performance Indexes
-- Users
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Products
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(original_price);

-- Orders
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- NGOs
CREATE INDEX idx_ngos_ngo_id ON ngos(ngo_id);
CREATE INDEX idx_ngos_location ON ngos USING GIST(location);
CREATE INDEX idx_ngos_verification ON ngos(verification_status);
CREATE INDEX idx_ngos_categories ON ngos USING GIN(accepted_categories);

-- Processing Centers
CREATE INDEX idx_processing_centers_center_id ON processing_centers(center_id);
CREATE INDEX idx_processing_centers_location ON processing_centers USING GIST(location);

-- Donations
CREATE INDEX idx_donations_donation_id ON donations(donation_id);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Renewed Inventory
CREATE INDEX idx_renewed_inventory_inventory_id ON renewed_inventory(inventory_id);
CREATE INDEX idx_renewed_inventory_order_item ON renewed_inventory(original_order_item_id);
CREATE INDEX idx_renewed_inventory_status ON renewed_inventory(status);
CREATE INDEX idx_renewed_inventory_grade ON renewed_inventory(grade);
CREATE INDEX idx_renewed_inventory_listed_price ON renewed_inventory(listed_price);

-- Quality Assessments
CREATE INDEX idx_quality_assessments_inventory ON quality_assessments(inventory_id);
CREATE INDEX idx_quality_assessments_overall_score ON quality_assessments(overall_score);
CREATE INDEX idx_quality_assessments_created_at ON quality_assessments(created_at);

-- Return Decisions
CREATE INDEX idx_return_decisions_decision_id ON return_decisions(decision_id);
CREATE INDEX idx_return_decisions_user_id ON return_decisions(user_id);
CREATE INDEX idx_return_decisions_product_id ON return_decisions(product_id);
CREATE INDEX idx_return_decisions_path ON return_decisions(decision_path);
CREATE INDEX idx_return_decisions_created_at ON return_decisions(created_at);

-- Insert Sample Data for Testing

-- Sample Users
INSERT INTO users (user_id, email, phone, name, address, wallet_balance, loyalty_tier) VALUES
('USER001', 'john.doe@example.com', '+91-9876543210', 'John Doe', '{"street": "123 Main St", "city": "Bangalore", "state": "Karnataka", "pincode": "560001", "country": "India"}', 1500.00, 'GOLD'),
('USER002', 'jane.smith@example.com', '+91-9876543211', 'Jane Smith', '{"street": "456 Park Ave", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India"}', 750.00, 'SILVER'),
('USER003', 'mike.wilson@example.com', '+91-9876543212', 'Mike Wilson', '{"street": "789 Oak Rd", "city": "Delhi", "state": "Delhi", "pincode": "110001", "country": "India"}', 2250.00, 'PLATINUM');

-- Sample Products
INSERT INTO products (product_id, name, category, subcategory, brand, original_price, images, specifications, tags) VALUES
('PROD001', 'Cotton Casual Shirt - Blue', 'Fashion', 'Men''s Clothing', 'FashionBrand', 899.00, 
 '["https://example.com/shirt1_1.jpg", "https://example.com/shirt1_2.jpg"]',
 '{"material": "100% Cotton", "size": "M", "color": "Blue", "care": "Machine Wash"}',
 ARRAY['casual', 'cotton', 'blue', 'shirt']),
('PROD002', 'Wireless Bluetooth Headphones', 'Electronics', 'Audio', 'TechBrand', 2499.00,
 '["https://example.com/headphones1_1.jpg", "https://example.com/headphones1_2.jpg"]',
 '{"type": "Over-ear", "battery": "30 hours", "connectivity": "Bluetooth 5.0", "weight": "250g"}',
 ARRAY['wireless', 'bluetooth', 'headphones', 'audio']),
('PROD003', 'Kitchen Knife Set', 'Home & Kitchen', 'Cookware', 'KitchenPro', 1299.00,
 '["https://example.com/knives1_1.jpg", "https://example.com/knives1_2.jpg"]',
 '{"material": "Stainless Steel", "pieces": "5", "handle": "Ergonomic", "dishwasher_safe": true}',
 ARRAY['kitchen', 'knives', 'cookware', 'steel']),
('PROD004', 'Running Shoes - Black', 'Fashion', 'Footwear', 'SportsBrand', 3499.00,
 '["https://example.com/shoes1_1.jpg", "https://example.com/shoes1_2.jpg"]',
 '{"size": "9", "color": "Black", "type": "Running", "sole": "Rubber", "upper": "Mesh"}',
 ARRAY['running', 'shoes', 'black', 'sports']),
('PROD005', 'Decorative Wall Clock', 'Home & Kitchen', 'Decor', 'HomeBrand', 450.00,
 '["https://example.com/clock1_1.jpg", "https://example.com/clock1_2.jpg"]',
 '{"material": "Wood", "size": "12 inch", "type": "Analog", "power": "Battery"}',
 ARRAY['clock', 'wall', 'decorative', 'wood']);

-- Sample Orders
INSERT INTO orders (order_id, user_id, order_date, total_amount, status, delivery_address, payment_status) VALUES
('ORD001', (SELECT id FROM users WHERE user_id = 'USER001'), NOW() - INTERVAL '15 days', 1798.00, 'DELIVERED', 
 '{"street": "123 Main St", "city": "Bangalore", "state": "Karnataka", "pincode": "560001", "country": "India"}', 'COMPLETED'),
('ORD002', (SELECT id FROM users WHERE user_id = 'USER002'), NOW() - INTERVAL '10 days', 2499.00, 'DELIVERED',
 '{"street": "456 Park Ave", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India"}', 'COMPLETED'),
('ORD003', (SELECT id FROM users WHERE user_id = 'USER003'), NOW() - INTERVAL '7 days', 1749.00, 'DELIVERED',
 '{"street": "789 Oak Rd", "city": "Delhi", "state": "Delhi", "pincode": "110001", "country": "India"}', 'COMPLETED');

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, status, delivered_at) VALUES
((SELECT id FROM orders WHERE order_id = 'ORD001'), (SELECT id FROM products WHERE product_id = 'PROD001'), 1, 899.00, 899.00, 'DELIVERED', NOW() - INTERVAL '12 days'),
((SELECT id FROM orders WHERE order_id = 'ORD001'), (SELECT id FROM products WHERE product_id = 'PROD003'), 1, 1299.00, 1299.00, 'DELIVERED', NOW() - INTERVAL '12 days'),
((SELECT id FROM orders WHERE order_id = 'ORD002'), (SELECT id FROM products WHERE product_id = 'PROD002'), 1, 2499.00, 2499.00, 'DELIVERED', NOW() - INTERVAL '8 days'),
((SELECT id FROM orders WHERE order_id = 'ORD003'), (SELECT id FROM products WHERE product_id = 'PROD004'), 1, 3499.00, 3499.00, 'DELIVERED', NOW() - INTERVAL '5 days'),
((SELECT id FROM orders WHERE order_id = 'ORD003'), (SELECT id FROM products WHERE product_id = 'PROD005'), 1, 450.00, 450.00, 'DELIVERED', NOW() - INTERVAL '5 days');

-- Sample NGOs
INSERT INTO ngos (ngo_id, name, email, phone, address, location, registration_number, verification_status, accepted_categories, capacity_limit, current_capacity, contact_person) VALUES
('NGO001', 'Hope Foundation', 'contact@hopefoundation.org', '+91-9876543220', 
 '{"street": "12 Charity Lane", "city": "Bangalore", "state": "Karnataka", "pincode": "560002", "country": "India"}',
 POINT(77.5946, 12.9716), 'REG001NGO', 'VERIFIED', 
 ARRAY['Fashion', 'Home & Kitchen'], 500, 50, 'Raj Kumar'),
('NGO002', 'Care Connect Mumbai', 'info@careconnectmumbai.org', '+91-9876543221',
 '{"street": "45 Service Road", "city": "Mumbai", "state": "Maharashtra", "pincode": "400002", "country": "India"}',
 POINT(72.8777, 19.0760), 'REG002NGO', 'VERIFIED',
 ARRAY['Fashion', 'Electronics', 'Home & Kitchen'], 300, 25, 'Priya Sharma'),
('NGO003', 'Delhi Relief Society', 'help@delhireliefsociety.org', '+91-9876543222',
 '{"street": "78 Community Center", "city": "Delhi", "state": "Delhi", "pincode": "110002", "country": "India"}',
 POINT(77.2090, 28.6139), 'REG003NGO', 'VERIFIED',
 ARRAY['Fashion', 'Home & Kitchen'], 400, 30, 'Amit Singh');

-- Sample Processing Centers
INSERT INTO processing_centers (center_id, name, location, address, capacity, current_load, specializations) VALUES
('PC001', 'Phoenix Bangalore Processing Center', POINT(77.5946, 12.9716),
 '{"street": "Industrial Area Phase 1", "city": "Bangalore", "state": "Karnataka", "pincode": "560058", "country": "India"}',
 1000, 150, ARRAY['Electronics', 'Fashion', 'Home & Kitchen']),
('PC002', 'Phoenix Mumbai Processing Center', POINT(72.8777, 19.0760),
 '{"street": "MIDC Industrial Estate", "city": "Mumbai", "state": "Maharashtra", "pincode": "400076", "country": "India"}',
 800, 120, ARRAY['Electronics', 'Fashion']),
('PC003', 'Phoenix Delhi Processing Center', POINT(77.2090, 28.6139),
 '{"street": "Industrial Complex", "city": "Delhi", "state": "Delhi", "pincode": "110033", "country": "India"}',
 1200, 200, ARRAY['Electronics', 'Fashion', 'Home & Kitchen']);

-- Views for Common Queries
CREATE OR REPLACE VIEW return_eligible_items AS
SELECT 
    oi.id as order_item_id,
    oi.order_id,
    o.order_id as order_number,
    oi.product_id,
    p.product_id as product_number,
    p.name as product_name,
    p.category,
    p.brand,
    oi.unit_price,
    oi.status,
    oi.delivered_at,
    u.user_id,
    u.name as customer_name,
    CASE 
        WHEN oi.delivered_at IS NOT NULL AND oi.delivered_at > NOW() - INTERVAL '30 days' 
        THEN TRUE 
        ELSE FALSE 
    END as is_return_eligible,
    DATE_PART('day', NOW() - oi.delivered_at) as days_since_delivery
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN users u ON o.user_id = u.id
WHERE oi.status = 'DELIVERED';

-- Function to calculate donation credit
CREATE OR REPLACE FUNCTION calculate_donation_credit(item_value DECIMAL, user_tier VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
    base_percentage DECIMAL := 0.25; -- 25% base credit
    tier_bonus DECIMAL := 0;
BEGIN
    -- Tier-based bonus
    CASE user_tier
        WHEN 'PLATINUM' THEN tier_bonus := 0.05;
        WHEN 'GOLD' THEN tier_bonus := 0.03;
        WHEN 'SILVER' THEN tier_bonus := 0.02;
        ELSE tier_bonus := 0;
    END CASE;
    
    RETURN ROUND(item_value * (base_percentage + tier_bonus), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to evaluate return path
CREATE OR REPLACE FUNCTION evaluate_return_path(item_value DECIMAL, category VARCHAR, brand VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Value-based routing
    IF item_value <= 500 THEN
        RETURN 'CARECONNECT';
    ELSIF item_value > 500 AND category IN ('Electronics', 'Fashion') THEN
        RETURN 'RECOMMERCE';
    ELSE
        RETURN 'TRADITIONAL';
    END IF;
END;
$$ LANGUAGE plpgsql;