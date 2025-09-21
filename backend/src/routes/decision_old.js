const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/v1/decision/evaluate:
 *   post:
 *     summary: Evaluate return decision pathway
 *     tags: [Decision Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               itemId:
 *                 type: string
 *               returnReason:
 *                 type: string
 *               customerLocation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Decision pathway determined
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { orderId, itemId, returnReason, customerLocation } = req.body;
    
    console.log('Decision evaluation request:', { orderId, itemId, returnReason });

    // Get item details by order_id
    const itemQuery = `
      SELECT o.*, p.original_price, p.category, p.brand, p.title, p.product_id
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.order_id = $1
    `;
    
    const itemResult = await pool.query(itemQuery, [orderId]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order or item not found' });
    }

    const item = itemResult.rows[0];
    const itemValue = parseFloat(item.original_price);

    // Decision Engine Logic
    let decision = {
      pathway: null,
      creditAmount: 0,
      estimatedSavings: 0,
      processingTime: null,
      options: []
    };

    if (itemValue <= 500) {
      // CareConnect Pathway
      decision.pathway = 'CARECONNECT';
      decision.creditAmount = Math.round(itemValue * 0.25); // 25% instant credit
      decision.estimatedSavings = 150; // Average reverse logistics cost saved
      decision.processingTime = '2-3 days';
      
      // Find nearby NGOs
      const ngoQuery = `
        SELECT * FROM ngos 
        WHERE verification_status = 'verified' 
        ORDER BY (
          (latitude - $1) * (latitude - $1) + 
          (longitude - $2) * (longitude - $2)
        ) ASC
        LIMIT 3
      `;
      
      const ngoResult = await pool.query(ngoQuery, [
        customerLocation?.latitude || 12.9716,
        customerLocation?.longitude || 77.5946
      ]);

      decision.options = [{
        type: 'donation',
        title: 'Donate to Local NGO',
        description: `Get ₹${decision.creditAmount} instant credit & make social impact`,
        benefits: [
          `₹${decision.creditAmount} instant wallet credit`,
          'Help local communities',
          'Zero waiting time',
          'Environmental impact'
        ],
        ngos: ngoResult.rows.slice(0, 2),
        recommended: true
      }];

    } else {
      // Re-commerce Pathway
      decision.pathway = 'RECOMMERCE';
      decision.creditAmount = 0; // No instant credit for re-commerce
      decision.estimatedSavings = Math.round(itemValue * 0.3); // Potential resale value
      decision.processingTime = '7-10 days';
      
      decision.options = [{
        type: 'traditional_return',
        title: 'Standard Return Process',
        description: 'Full refund after quality inspection',
        benefits: [
          'Full refund amount',
          'Quality inspection included',
          'Item may be resold as Renewed'
        ],
        estimatedRefund: itemValue,
        recommended: true
      }];
    }

    // Log decision for analytics
    const logQuery = `
      INSERT INTO return_decisions (order_id, item_id, decision_path, item_value, credit_offered, customer_location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    await pool.query(logQuery, [
      item.id, // Use the UUID id from orders table instead of string order_id
      item.product_id, // Use the actual product_id from the order, not the itemId
      decision.pathway, 
      itemValue, 
      decision.creditAmount,
      JSON.stringify(customerLocation || { lat: 12.9716, lng: 77.5946 })
    ]);

    res.json({
      success: true,
      decision,
      item: {
        title: item.title,
        brand: item.brand,
        category: item.category,
        originalPrice: itemValue,
        orderDate: item.created_at
      }
    });

  } catch (error) {
    console.error('Decision evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate return decision' });
  }
});

/**
 * @swagger
 * /api/v1/decision/analytics:
 *   get:
 *     summary: Get decision engine analytics
 *     tags: [Decision Engine]
 */
router.get('/analytics', async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT 
        decision_path,
        COUNT(*) as total_decisions,
        AVG(item_value) as avg_item_value,
        SUM(credit_offered) as total_credits_offered
      FROM return_decisions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY decision_path
    `;
    
    const result = await pool.query(analyticsQuery);
    
    res.json({
      success: true,
      analytics: result.rows
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;