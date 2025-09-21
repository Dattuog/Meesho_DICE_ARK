const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/v1/careconnect/donate:
 *   post:
 *     summary: Process donation request
 *     tags: [CareConnect]
 */
router.post('/donate', async (req, res) => {
  try {
    const { orderId, itemId, ngoId, creditAmount } = req.body;

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create donation record
      const donationQuery = `
        INSERT INTO donations (order_id, item_id, ngo_id, credit_amount, status)
        VALUES ($1, $2, $3, $4, 'processing')
        RETURNING id
      `;
      
      const donationResult = await client.query(donationQuery, [
        orderId, itemId, ngoId, creditAmount
      ]);

      // Update user wallet (mock implementation)
      const walletQuery = `
        UPDATE users SET wallet_balance = wallet_balance + $1
        WHERE id = (SELECT user_id FROM orders WHERE id = $2)
      `;
      
      await client.query(walletQuery, [creditAmount, orderId]);

      // Schedule pickup logistics (mock)
      const logisticsQuery = `
        INSERT INTO logistics_requests (donation_id, pickup_address, delivery_address, status)
        VALUES ($1, $2, $3, 'scheduled')
      `;
      
      await client.query(logisticsQuery, [
        donationResult.rows[0].id,
        'Customer address from order',
        'NGO address from database'
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        donationId: donationResult.rows[0].id,
        creditAmount,
        message: 'Donation processed successfully! Credits added to your wallet.',
        estimatedPickup: '24-48 hours'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to process donation' });
  }
});

/**
 * @swagger
 * /api/v1/careconnect/ngos/nearby:
 *   get:
 *     summary: Find nearby verified NGOs
 *     tags: [CareConnect]
 */
router.get('/ngos/nearby', async (req, res) => {
  try {
    const { lat, lng, category } = req.query;

    let ngoQuery = `
      SELECT 
        id, name, description, cause_areas, contact_info,
        address, impact_metrics
      FROM ngos 
      WHERE verification_status = 'verified'
    `;
    
    let queryParams = [];

    if (lat && lng) {
      ngoQuery += ` AND ST_DWithin(location, ST_MakePoint($1, $2), 15000)`;
      queryParams.push(lng, lat);
    }

    if (category) {
      ngoQuery += ` AND cause_areas @> $${queryParams.length + 1}`;
      queryParams.push(`["${category}"]`);
    }

    ngoQuery += ' ORDER BY created_at DESC LIMIT 5';
    
    const result = await pool.query(ngoQuery, queryParams);
    
    res.json({
      success: true,
      ngos: result.rows.map(ngo => ({
        ...ngo,
        estimatedImpact: `${Math.floor(Math.random() * 50) + 10} families helped`,
        pickupTime: '24-48 hours'
      }))
    });

  } catch (error) {
    console.error('NGO search error:', error);
    res.status(500).json({ error: 'Failed to find nearby NGOs' });
  }
});

/**
 * @swagger
 * /api/v1/careconnect/impact/{userId}:
 *   get:
 *     summary: Get user's donation impact
 *     tags: [CareConnect]
 */
router.get('/impact/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const impactQuery = `
      SELECT 
        COUNT(*) as total_donations,
        SUM(d.credit_amount) as total_credits_earned,
        ARRAY_AGG(DISTINCT n.name) as supported_ngos,
        SUM(COALESCE(n.impact_metrics->>'families_helped', '0')::int) as estimated_families_helped
      FROM donations d
      JOIN orders o ON d.order_id = o.id
      JOIN ngos n ON d.ngo_id = n.id
      WHERE o.user_id = $1 AND d.status = 'completed'
    `;
    
    const result = await pool.query(impactQuery, [userId]);
    const impact = result.rows[0];

    res.json({
      success: true,
      impact: {
        totalDonations: parseInt(impact.total_donations) || 0,
        totalCreditsEarned: parseInt(impact.total_credits_earned) || 0,
        supportedNGOs: impact.supported_ngos || [],
        estimatedFamiliesHelped: parseInt(impact.estimated_families_helped) || 0,
        environmentalImpact: {
          co2Saved: Math.round((parseInt(impact.total_donations) || 0) * 2.5),
          wasteReduced: Math.round((parseInt(impact.total_donations) || 0) * 0.8)
        }
      }
    });

  } catch (error) {
    console.error('Impact tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch impact data' });
  }
});

module.exports = router;