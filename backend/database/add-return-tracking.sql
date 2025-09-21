-- Add return tracking table for order status management
CREATE TABLE IF NOT EXISTS return_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id VARCHAR(100) NOT NULL,
    return_type VARCHAR(50) NOT NULL DEFAULT 'ngo_donation',
    user_id VARCHAR(100) NOT NULL,
    return_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'PROCESSED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(order_item_id, return_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_tracking_order_item ON return_tracking(order_item_id);
CREATE INDEX IF NOT EXISTS idx_return_tracking_user ON return_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_return_tracking_date ON return_tracking(return_date);