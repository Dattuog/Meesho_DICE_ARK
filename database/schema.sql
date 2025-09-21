-- Project Phoenix Database Schema
-- PostgreSQL Database Setup

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

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

-- NGOs table
CREATE TABLE ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cause_areas TEXT[],
    contact_info JSONB,
    address TEXT,
    location GEOMETRY(POINT, 4326),
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    capacity_per_day INTEGER DEFAULT 10,
    total_donations_received INTEGER DEFAULT 0,
    impact_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    item_id UUID REFERENCES products(id),
    ngo_id UUID REFERENCES ngos(id),
    credit_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing', -- processing, picked_up, delivered, completed
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    impact_report JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Renewed Inventory table
CREATE TABLE renewed_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_order_id UUID REFERENCES orders(id),
    original_product_id UUID REFERENCES products(id),
    grade VARCHAR(20), -- A, B, C (Like-New, Good, Fair)
    condition_notes TEXT,
    acquisition_cost DECIMAL(10,2),
    refurbishment_cost DECIMAL(10,2),
    current_price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'processing', -- processing, available, sold, removed
    quality_assessment JSONB,
    listed_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
    processing_center_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return Decisions table
CREATE TABLE return_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    item_id UUID REFERENCES products(id),
    decision_path VARCHAR(20), -- CARECONNECT, RECOMMERCE, TRADITIONAL
    item_value DECIMAL(10,2),
    credit_offered DECIMAL(10,2),
    customer_location JSONB,
    decision_factors JSONB,
    customer_choice VARCHAR(20), -- accepted, rejected, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logistics Requests table
CREATE TABLE logistics_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID REFERENCES donations(id),
    pickup_address TEXT,
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, picked_up, in_transit, delivered
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    driver_info JSONB,
    tracking_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing Centers table
CREATE TABLE processing_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    location GEOMETRY(POINT, 4326),
    capacity_per_day INTEGER DEFAULT 50,
    specializations TEXT[],
    contact_info JSONB,
    operational_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(original_price);
CREATE INDEX idx_ngos_location ON ngos USING GIST(location);
CREATE INDEX idx_ngos_verification ON ngos(verification_status);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_renewed_inventory_status ON renewed_inventory(status);
CREATE INDEX idx_renewed_inventory_grade ON renewed_inventory(grade);
CREATE INDEX idx_return_decisions_path ON return_decisions(decision_path);
CREATE INDEX idx_return_decisions_created_at ON return_decisions(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ngos_updated_at BEFORE UPDATE ON ngos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_renewed_inventory_updated_at BEFORE UPDATE ON renewed_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();