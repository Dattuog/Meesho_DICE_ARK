-- Project Phoenix Database Schema (Simplified)
-- PostgreSQL Database Setup without PostGIS

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    total_donations INTEGER DEFAULT 0,
    total_purchases DECIMAL(10,2) DEFAULT 0.00,
    user_type VARCHAR(20) DEFAULT 'customer', -- customer, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    original_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_urls TEXT[],
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'delivered', -- delivered, returned, donated
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NGOs table (simplified without PostGIS)
CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngo_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- education, healthcare, environment, etc.
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    verification_status VARCHAR(20) DEFAULT 'verified',
    rating DECIMAL(3,2) DEFAULT 4.5,
    total_donations_received INTEGER DEFAULT 0,
    total_families_helped INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    ngo_id UUID REFERENCES ngos(id),
    product_id UUID REFERENCES products(id),
    donation_value DECIMAL(10,2) NOT NULL,
    credit_given DECIMAL(10,2) NOT NULL,
    donation_type VARCHAR(50) DEFAULT 'product', -- product, monetary
    status VARCHAR(50) DEFAULT 'completed',
    impact_metrics JSONB,
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Renewed inventory table
CREATE TABLE renewed_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id VARCHAR(50) UNIQUE NOT NULL,
    original_order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    original_price DECIMAL(10,2) NOT NULL,
    renewed_price DECIMAL(10,2) NOT NULL,
    quality_grade VARCHAR(20), -- A, B, C
    condition_notes TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'available', -- available, sold, quality_check
    images TEXT[],
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return decisions table
CREATE TABLE return_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    decision_type VARCHAR(50) NOT NULL, -- donate, return, renewed
    decision_reason TEXT,
    estimated_value DECIMAL(10,2),
    credit_offered DECIMAL(10,2),
    processing_cost DECIMAL(10,2),
    logistics_cost DECIMAL(10,2),
    decision_factors JSONB,
    ai_confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_ngos_ngo_id ON ngos(ngo_id);
CREATE INDEX idx_ngos_city ON ngos(city);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_renewed_inventory_status ON renewed_inventory(status);
CREATE INDEX idx_renewed_inventory_city ON renewed_inventory(city);
CREATE INDEX idx_return_decisions_user_id ON return_decisions(user_id);
CREATE INDEX idx_return_decisions_decision_type ON return_decisions(decision_type);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_renewed_inventory_updated_at BEFORE UPDATE ON renewed_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();