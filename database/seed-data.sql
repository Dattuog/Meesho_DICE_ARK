-- Sample data for Project Phoenix Demo
-- Run this after creating the schema

-- Insert demo users
INSERT INTO users (user_id, email, phone, full_name, wallet_balance) VALUES
('demo_user_1', 'demo@meesho.com', '+91-9876543210', 'Demo Customer', 150.00),
('admin_user_1', 'admin@meesho.com', '+91-9876543211', 'Phoenix Admin', 0.00);

-- Insert sample products with image URLs
INSERT INTO products (product_id, title, brand, category, subcategory, original_price, description, images) VALUES
('PROD_001', 'Cotton Kurti - Blue Floral', 'StyleCo', 'Fashion', 'Women Ethnic', 299.00, 'Beautiful cotton kurti with floral print', 
 '["https://images.meesho.com/images/products/31158644/ymmto_512.webp", "https://images.meesho.com/images/products/31158644/abc123_512.webp"]'),
('PROD_002', 'Wireless Bluetooth Headphones', 'TechSound', 'Electronics', 'Audio', 899.00, 'High-quality wireless headphones with noise cancellation',
 '["https://images.meesho.com/images/products/45789123/headphones_512.webp", "https://images.meesho.com/images/products/45789123/headphones2_512.webp"]'),
('PROD_003', 'Kitchen Storage Container Set', 'HomeEssentials', 'Home & Kitchen', 'Storage', 199.00, 'Set of 3 airtight storage containers',
 '["https://images.meesho.com/images/products/67891234/containers_512.webp", "https://images.meesho.com/images/products/67891234/containers2_512.webp"]'),
('PROD_004', 'Mens Casual T-Shirt', 'Trendy Wear', 'Fashion', 'Men Clothing', 399.00, 'Premium cotton casual t-shirt',
 '["https://images.meesho.com/images/products/12345678/tshirt_512.webp", "https://images.meesho.com/images/products/12345678/tshirt2_512.webp"]'),
('PROD_005', 'Smartphone Case - iPhone', 'PhoneGuard', 'Electronics', 'Mobile Accessories', 149.00, 'Protective case for iPhone with clear back',
 '["https://images.meesho.com/images/products/87654321/phonecase_512.webp", "https://images.meesho.com/images/products/87654321/phonecase2_512.webp"]'),
('PROD_006', 'Artificial Jewellery Set', 'GlamourCraft', 'Fashion', 'Jewellery', 599.00, 'Elegant necklace and earring set',
 '["https://images.meesho.com/images/products/98765432/jewellery_512.webp", "https://images.meesho.com/images/products/98765432/jewellery2_512.webp"]'),
('PROD_007', 'Yoga Mat - Premium', 'FitLife', 'Sports & Fitness', 'Yoga', 799.00, 'Non-slip premium yoga mat',
 '["https://images.meesho.com/images/products/11111111/yogamat_512.webp", "https://images.meesho.com/images/products/11111111/yogamat2_512.webp"]'),
('PROD_008', 'Hair Straightener', 'BeautyTech', 'Beauty & Health', 'Hair Care', 1299.00, 'Ceramic hair straightener with temperature control',
 '["https://images.meesho.com/images/products/22222222/straightener_512.webp", "https://images.meesho.com/images/products/22222222/straightener2_512.webp"]');

-- Insert sample orders (recent deliveries ready for return)
INSERT INTO orders (order_id, user_id, product_id, quantity, price, status, order_date, delivery_date, delivery_address) VALUES
('ORD_001', 
 (SELECT id FROM users WHERE user_id = 'demo_user_1'), 
 (SELECT id FROM products WHERE product_id = 'PROD_001'), 
 1, 299.00, 'delivered', 
 NOW() - INTERVAL '5 days', 
 NOW() - INTERVAL '2 days',
 '{"address": "123 MG Road, Bangalore", "pincode": "560001", "city": "Bangalore", "state": "Karnataka"}'
),
('ORD_002', 
 (SELECT id FROM users WHERE user_id = 'demo_user_1'), 
 (SELECT id FROM products WHERE product_id = 'PROD_002'), 
 1, 899.00, 'delivered', 
 NOW() - INTERVAL '7 days', 
 NOW() - INTERVAL '3 days',
 '{"address": "123 MG Road, Bangalore", "pincode": "560001", "city": "Bangalore", "state": "Karnataka"}'
),
('ORD_003', 
 (SELECT id FROM users WHERE user_id = 'demo_user_1'), 
 (SELECT id FROM products WHERE product_id = 'PROD_003'), 
 1, 199.00, 'delivered', 
 NOW() - INTERVAL '4 days', 
 NOW() - INTERVAL '1 day',
 '{"address": "123 MG Road, Bangalore", "pincode": "560001", "city": "Bangalore", "state": "Karnataka"}'
),
('ORD_004', 
 (SELECT id FROM users WHERE user_id = 'demo_user_1'), 
 (SELECT id FROM products WHERE product_id = 'PROD_008'), 
 1, 1299.00, 'delivered', 
 NOW() - INTERVAL '6 days', 
 NOW() - INTERVAL '2 days',
 '{"address": "123 MG Road, Bangalore", "pincode": "560001", "city": "Bangalore", "state": "Karnataka"}'
);

-- Insert verified NGOs in Bangalore area
INSERT INTO ngos (name, description, cause_areas, contact_info, address, location, verification_status, impact_metrics) VALUES
('Akshaya Patra Foundation', 
 'Providing meals to underprivileged children and communities',
 ARRAY['Education', 'Food Security', 'Child Welfare'],
 '{"phone": "+91-80-30143900", "email": "info@akshayapatra.org", "website": "akshayapatra.org"}',
 'Akshaya Patra Bhawan, Rajajinagar, Bangalore',
 ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326),
 'verified',
 '{"families_helped": 1500, "meals_served": 50000, "children_benefited": 3000}'
),
('Goonj', 
 'Clothing and material support for rural communities',
 ARRAY['Rural Development', 'Clothing', 'Disaster Relief'],
 '{"phone": "+91-11-26972351", "email": "goonj@goonj.org", "website": "goonj.org"}',
 'HSR Layout, Bangalore',
 ST_SetSRID(ST_MakePoint(77.6389, 12.9172), 4326),
 'verified',
 '{"families_helped": 800, "clothing_distributed": 10000, "villages_reached": 25}'
),
('Samarthanam Trust', 
 'Supporting visually impaired and underprivileged communities',
 ARRAY['Disability Support', 'Education', 'Skill Development'],
 '{"phone": "+91-80-25473557", "email": "info@samarthanam.org", "website": "samarthanam.org"}',
 'JP Nagar, Bangalore',
 ST_SetSRID(ST_MakePoint(77.5946, 12.9108), 4326),
 'verified',
 '{"families_helped": 600, "students_educated": 1200, "jobs_provided": 150}'
),
('Parikrma Humanity Foundation', 
 'Education and holistic development for street children',
 ARRAY['Education', 'Child Welfare', 'Skill Development'],
 '{"phone": "+91-80-25520820", "email": "info@parikrmafoundation.org", "website": "parikrmafoundation.org"}',
 'Koramangala, Bangalore',
 ST_SetSRID(ST_MakePoint(77.6117, 12.9279), 4326),
 'verified',
 '{"families_helped": 400, "children_educated": 800, "centers_operational": 4}'
),
('Robin Hood Army', 
 'Fighting hunger and food waste through community volunteering',
 ARRAY['Food Security', 'Community Service', 'Hunger Relief'],
 '{"phone": "+91-70420-70420", "email": "bangalore@robinhoodarmy.com", "website": "robinhoodarmy.com"}',
 'Indiranagar, Bangalore',
 ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326),
 'verified',
 '{"families_helped": 2000, "meals_distributed": 75000, "volunteers": 300}'
);

-- Insert processing centers
INSERT INTO processing_centers (name, address, location, capacity_per_day, specializations, contact_info) VALUES
('Phoenix Processing Center - Bangalore', 
 'Electronic City, Bangalore, Karnataka',
 ST_SetSRID(ST_MakePoint(77.6648, 12.8456), 4326),
 100,
 ARRAY['Electronics', 'Fashion', 'Home & Kitchen'],
 '{"phone": "+91-80-12345678", "email": "bangalore@phoenix.meesho.com"}'
);

-- Insert some sample renewed inventory
INSERT INTO renewed_inventory (original_order_id, original_product_id, grade, condition_notes, acquisition_cost, current_price, status, listed_at) VALUES
((SELECT id FROM orders WHERE order_id = 'ORD_002'), 
 (SELECT id FROM products WHERE product_id = 'PROD_002'),
 'A', 'Like new condition, minimal usage', 449.50, 649.00, 'available', NOW() - INTERVAL '2 days'),
((SELECT id FROM orders WHERE order_id = 'ORD_008' LIMIT 1), 
 (SELECT id FROM products WHERE product_id = 'PROD_008'),
 'B', 'Good condition, works perfectly', 649.50, 899.00, 'available', NOW() - INTERVAL '1 day');

-- Add some sample return decisions
INSERT INTO return_decisions (order_id, item_id, decision_path, item_value, credit_offered, customer_location) VALUES
((SELECT id FROM orders WHERE order_id = 'ORD_001'), 
 (SELECT id FROM products WHERE product_id = 'PROD_001'),
 'CARECONNECT', 299.00, 74.75,
 '{"latitude": 12.9716, "longitude": 77.5946}'
),
((SELECT id FROM orders WHERE order_id = 'ORD_003'), 
 (SELECT id FROM products WHERE product_id = 'PROD_003'),
 'CARECONNECT', 199.00, 49.75,
 '{"latitude": 12.9716, "longitude": 77.5946}'
);

-- Add more sample products for renewed catalog
INSERT INTO products (product_id, title, brand, category, subcategory, original_price, description) VALUES
('PROD_REN_001', 'Samsung Galaxy Earbuds - Renewed', 'Samsung', 'Electronics', 'Audio', 4999.00, 'Renewed Samsung Galaxy Earbuds in excellent condition'),
('PROD_REN_002', 'Levi\'s Jeans - Renewed', 'Levi\'s', 'Fashion', 'Men Clothing', 2999.00, 'Renewed Levi\'s jeans, barely used'),
('PROD_REN_003', 'Kitchen Aid Blender - Renewed', 'KitchenAid', 'Home & Kitchen', 'Appliances', 8999.00, 'Renewed premium blender, works like new');

-- Create corresponding renewed inventory
INSERT INTO renewed_inventory (original_product_id, grade, condition_notes, acquisition_cost, current_price, status, listed_at) VALUES
((SELECT id FROM products WHERE product_id = 'PROD_REN_001'),
 'A', 'Excellent condition, original packaging', 2499.50, 3499.00, 'available', NOW() - INTERVAL '3 days'),
((SELECT id FROM products WHERE product_id = 'PROD_REN_002'),
 'B', 'Good condition, minor wear', 1499.50, 2099.00, 'available', NOW() - INTERVAL '1 day'),
((SELECT id FROM products WHERE product_id = 'PROD_REN_003'),
 'A', 'Like new, tested and verified', 4499.50, 6299.00, 'available', NOW() - INTERVAL '2 days');

-- Update statistics
UPDATE users SET 
    total_donations = 2,
    wallet_balance = wallet_balance + 124.50
WHERE user_id = 'demo_user_1';

-- Add sample donation records
INSERT INTO donations (order_id, item_id, ngo_id, credit_amount, status, delivered_at, impact_report) VALUES
((SELECT id FROM orders WHERE order_id = 'ORD_001'), 
 (SELECT id FROM products WHERE product_id = 'PROD_001'),
 (SELECT id FROM ngos WHERE name = 'Akshaya Patra Foundation'),
 74.75, 'completed', NOW() - INTERVAL '1 day',
 '{"families_benefited": 3, "impact_score": 85, "community_feedback": "Very helpful donation"}'
);

COMMIT;