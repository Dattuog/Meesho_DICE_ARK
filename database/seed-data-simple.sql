-- Project Phoenix Sample Data (Simplified)
-- Seed data for demo scenarios

-- Insert sample users
INSERT INTO users (user_id, email, phone, full_name, wallet_balance, total_donations, total_purchases) VALUES
('USER_001', 'priya.sharma@gmail.com', '+919876543210', 'Priya Sharma', 150.00, 2, 2500.00),
('USER_002', 'admin@meesho.com', '+919876543211', 'Admin User', 0.00, 0, 0.00);

-- Insert sample products
INSERT INTO products (product_id, title, brand, category, subcategory, original_price, description, image_urls) VALUES
('PROD_001', 'Cotton Kurti - Blue Floral', 'Meesho', 'Fashion', 'Women Kurtas', 299.00, 'Beautiful blue floral cotton kurti perfect for daily wear', ARRAY['https://images.meesho.com/kurti1.jpg']),
('PROD_002', 'Hair Straightener', 'Philips', 'Beauty', 'Hair Care', 1299.00, 'Professional hair straightener with ceramic plates', ARRAY['https://images.meesho.com/straightener1.jpg']),
('PROD_003', 'Wooden Kitchen Set', 'HomeEssentials', 'Home', 'Kitchen', 799.00, 'Complete wooden kitchen utensil set', ARRAY['https://images.meesho.com/kitchen1.jpg']),
('PROD_004', 'Kids Study Table', 'StudyBuddy', 'Home', 'Furniture', 2499.00, 'Ergonomic study table for children', ARRAY['https://images.meesho.com/table1.jpg']),
('PROD_005', 'Cotton Bedsheet Set', 'ComfortHome', 'Home', 'Bedding', 899.00, 'Double bed cotton bedsheet with pillow covers', ARRAY['https://images.meesho.com/bedsheet1.jpg']),
('PROD_006', 'Smartphone Back Cover', 'TechGuard', 'Electronics', 'Mobile Accessories', 199.00, 'Durable silicone back cover for smartphones', ARRAY['https://images.meesho.com/cover1.jpg']),
('PROD_007', 'Ethnic Earrings', 'JewelCraft', 'Fashion', 'Jewelry', 149.00, 'Traditional ethnic earrings for festive occasions', ARRAY['https://images.meesho.com/earrings1.jpg']),
('PROD_008', 'Yoga Mat', 'FitLife', 'Sports', 'Fitness', 599.00, 'Anti-slip yoga mat for home workouts', ARRAY['https://images.meesho.com/yoga1.jpg']);

-- Insert sample orders
INSERT INTO orders (order_id, user_id, product_id, quantity, price, status, order_date, delivery_date, delivery_address) VALUES
('ORD_001', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM products WHERE product_id = 'PROD_001'), 1, 299.00, 'delivered', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', '{"address": "123 MG Road, Bangalore, Karnataka", "pincode": "560001"}'),
('ORD_002', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM products WHERE product_id = 'PROD_002'), 1, 1299.00, 'delivered', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', '{"address": "123 MG Road, Bangalore, Karnataka", "pincode": "560001"}'),
('ORD_003', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM products WHERE product_id = 'PROD_003'), 1, 799.00, 'delivered', NOW() - INTERVAL '20 days', NOW() - INTERVAL '12 days', '{"address": "123 MG Road, Bangalore, Karnataka", "pincode": "560001"}'),
('ORD_004', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM products WHERE product_id = 'PROD_004'), 1, 2499.00, 'delivered', NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days', '{"address": "123 MG Road, Bangalore, Karnataka", "pincode": "560001"}');

-- Insert sample NGOs
INSERT INTO ngos (ngo_id, name, description, category, city, state, latitude, longitude, contact_person, contact_phone, contact_email, total_donations_received, total_families_helped) VALUES
('NGO_001', 'Helping Hands Foundation', 'Supporting underprivileged families with basic necessities and education', 'Education', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 'Rajesh Kumar', '+919876543212', 'contact@helpinghands.org', 500, 1200),
('NGO_002', 'Care for All', 'Healthcare and wellness programs for rural communities', 'Healthcare', 'Bangalore', 'Karnataka', 12.9352, 77.6245, 'Sunita Devi', '+919876543213', 'info@careforall.org', 300, 800);

-- Insert sample donations
INSERT INTO donations (donation_id, user_id, order_id, ngo_id, product_id, donation_value, credit_given, status, impact_metrics, donation_date) VALUES
('DON_001', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM orders WHERE order_id = 'ORD_001'), (SELECT id FROM ngos WHERE ngo_id = 'NGO_001'), (SELECT id FROM products WHERE product_id = 'PROD_001'), 299.00, 75.00, 'completed', '{"families_helped": 2, "impact_score": 8.5}', NOW() - INTERVAL '3 days'),
('DON_002', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM orders WHERE order_id = 'ORD_003'), (SELECT id FROM ngos WHERE ngo_id = 'NGO_002'), (SELECT id FROM products WHERE product_id = 'PROD_003'), 799.00, 150.00, 'completed', '{"families_helped": 3, "impact_score": 9.2}', NOW() - INTERVAL '1 day');

-- Insert sample renewed inventory
INSERT INTO renewed_inventory (inventory_id, original_order_id, product_id, original_price, renewed_price, quality_grade, condition_notes, city, state, latitude, longitude, status) VALUES
('REN_001', (SELECT id FROM orders WHERE order_id = 'ORD_002'), (SELECT id FROM products WHERE product_id = 'PROD_002'), 1299.00, 899.00, 'A', 'Excellent condition, minimal usage, all accessories included', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 'available'),
('REN_002', (SELECT id FROM orders WHERE order_id = 'ORD_004'), (SELECT id FROM products WHERE product_id = 'PROD_004'), 2499.00, 1799.00, 'B', 'Good condition, minor scratches, fully functional', 'Bangalore', 'Karnataka', 12.9352, 77.6245, 'available');

-- Insert sample return decisions
INSERT INTO return_decisions (decision_id, user_id, order_id, product_id, decision_type, decision_reason, estimated_value, credit_offered, processing_cost, logistics_cost, decision_factors, ai_confidence) VALUES
('DEC_001', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM orders WHERE order_id = 'ORD_001'), (SELECT id FROM products WHERE product_id = 'PROD_001'), 'donate', 'Low value item, high donation impact potential', 299.00, 75.00, 50.00, 45.00, '{"product_condition": "good", "donation_demand": "high", "processing_complexity": "low"}', 0.92),
('DEC_002', (SELECT id FROM users WHERE user_id = 'USER_001'), (SELECT id FROM orders WHERE order_id = 'ORD_002'), (SELECT id FROM products WHERE product_id = 'PROD_002'), 'renewed', 'High value item, good resale potential', 1299.00, 200.00, 100.00, 80.00, '{"product_condition": "excellent", "market_demand": "high", "resale_value": "good"}', 0.89);

-- Update user wallet balance based on donations
UPDATE users SET wallet_balance = wallet_balance + (SELECT COALESCE(SUM(credit_given), 0) FROM donations WHERE user_id = users.id) WHERE user_id = 'USER_001';

-- Update NGO statistics
UPDATE ngos SET 
    total_donations_received = total_donations_received + (SELECT COUNT(*) FROM donations WHERE ngo_id = ngos.id),
    total_families_helped = total_families_helped + (SELECT COALESCE(SUM((impact_metrics->>'families_helped')::integer), 0) FROM donations WHERE ngo_id = ngos.id);

-- Display success message
SELECT 'Database setup completed successfully!' as status;
SELECT 'Sample data inserted for demo scenarios' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_ngos FROM ngos;
SELECT COUNT(*) as total_donations FROM donations;