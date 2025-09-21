const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/v1/renewed/products:
 *   get:
 *     summary: Get renewed products catalog
 *     tags: [Renewed]
 */
router.get('/products', async (req, res) => {
  try {
    const { category, grade, minPrice, maxPrice, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        ri.id, ri.grade, ri.condition_notes, ri.current_price, ri.listed_at,
        p.title, p.brand, p.category, p.original_price, p.description, p.image_urls,
        ROUND(((p.original_price - ri.current_price) / p.original_price * 100), 0) as discount_percentage,
        'renewed' as product_type
      FROM renewed_inventory ri
      JOIN products p ON ri.original_product_id = p.id
      WHERE ri.status = 'available'
    `;
    
    let queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (grade) {
      paramCount++;
      query += ` AND ri.grade = $${paramCount}`;
      queryParams.push(grade);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND ri.current_price >= $${paramCount}`;
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND ri.current_price <= $${paramCount}`;
      queryParams.push(parseFloat(maxPrice));
    }

    query += ` ORDER BY ri.listed_at DESC LIMIT $${paramCount + 1}`;
    queryParams.push(parseInt(limit));
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      products: result.rows.map(product => ({
        ...product,
        gradeLabel: {
          'A': 'Like New',
          'B': 'Good',
          'C': 'Fair'
        }[product.grade] || product.grade,
        savings: Math.round(product.original_price - product.current_price),
        qualityBadge: product.grade === 'A' ? 'Premium' : product.grade === 'B' ? 'Good Value' : 'Budget Friendly'
      }))
    });

  } catch (error) {
    console.error('Renewed products error:', error);
    res.status(500).json({ error: 'Failed to fetch renewed products' });
  }
});

/**
 * @swagger
 * /api/v1/renewed/categories:
 *   get:
 *     summary: Get available categories in renewed section
 *     tags: [Renewed]
 */
router.get('/categories', async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        p.category,
        COUNT(*) as product_count,
        MIN(ri.current_price) as min_price,
        MAX(ri.current_price) as max_price,
        AVG(ri.current_price) as avg_price
      FROM renewed_inventory ri
      JOIN products p ON ri.original_product_id = p.id
      WHERE ri.status = 'available'
      GROUP BY p.category
      ORDER BY product_count DESC
    `;
    
    const result = await pool.query(categoriesQuery);
    
    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/v1/renewed/analytics:
 *   get:
 *     summary: Get renewed marketplace analytics
 *     tags: [Renewed]
 */
router.get('/analytics', async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_products,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
        AVG(current_price) as avg_price,
        AVG(CASE WHEN acquisition_cost > 0 THEN 
          (current_price - acquisition_cost) / acquisition_cost * 100 
        END) as avg_margin_percentage
      FROM renewed_inventory
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    
    const result = await pool.query(analyticsQuery);
    
    const gradeDistributionQuery = `
      SELECT grade, COUNT(*) as count
      FROM renewed_inventory
      WHERE status = 'available'
      GROUP BY grade
      ORDER BY grade
    `;
    
    const gradeResult = await pool.query(gradeDistributionQuery);
    
    res.json({
      success: true,
      analytics: {
        ...result.rows[0],
        gradeDistribution: gradeResult.rows
      }
    });

  } catch (error) {
    console.error('Renewed analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @swagger
 * /api/v1/renewed/flash-sale:
 *   post:
 *     summary: Start a flash sale for a returned item
 *     tags: [Renewed]
 */
router.post('/flash-sale', async (req, res) => {
  try {
    const { orderId, itemId, discountedPrice, location } = req.body;
    
    console.log('Flash sale initiated:', { orderId, itemId, discountedPrice });
    
    // In a real implementation, this would:
    // 1. Create a flash sale listing
    // 2. Notify nearby users
    // 3. Set up time-limited availability
    
    // For demo purposes, simulate successful flash sale creation
    const flashSaleId = `FS${Date.now()}`;
    
    res.json({
      success: true,
      flashSaleId,
      discountedPrice,
      status: 'active',
      expectedSaleTime: '2-3 hours',
      nearbyUsers: Math.floor(Math.random() * 50) + 10,
      message: 'Flash sale created successfully! Nearby users have been notified.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Flash sale creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create flash sale',
      message: error.message 
    });
  }
});

module.exports = router;