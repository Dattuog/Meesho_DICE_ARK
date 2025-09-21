const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics
 *     tags: [Admin]
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get key metrics for the last 30 days
    const metricsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM return_decisions WHERE created_at >= NOW() - INTERVAL '30 days') as total_returns,
        (SELECT COUNT(*) FROM return_decisions WHERE decision_path = 'CARECONNECT' AND created_at >= NOW() - INTERVAL '30 days') as careconnect_returns,
        (SELECT COUNT(*) FROM return_decisions WHERE decision_path = 'RECOMMERCE' AND created_at >= NOW() - INTERVAL '30 days') as recommerce_returns,
        (SELECT COUNT(*) FROM donations WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') as completed_donations,
        (SELECT SUM(credit_amount) FROM donations WHERE created_at >= NOW() - INTERVAL '30 days') as total_credits_given,
        (SELECT COUNT(*) FROM renewed_inventory WHERE status = 'available') as available_renewed,
        (SELECT COUNT(*) FROM renewed_inventory WHERE status = 'sold' AND sold_at >= NOW() - INTERVAL '30 days') as sold_renewed,
        (SELECT COUNT(*) FROM ngos WHERE verification_status = 'verified') as verified_ngos
    `;
    
    const metricsResult = await pool.query(metricsQuery);
    const metrics = metricsResult.rows[0];

    // Calculate savings and revenue
    const avgReverseLogisticsCost = 150; // Mock average cost
    const totalSavings = parseInt(metrics.careconnect_returns) * avgReverseLogisticsCost;
    
    const revenueQuery = `
      SELECT SUM(current_price - acquisition_cost) as total_revenue
      FROM renewed_inventory 
      WHERE status = 'sold' AND sold_at >= NOW() - INTERVAL '30 days'
    `;
    const revenueResult = await pool.query(revenueQuery);
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;

    // Daily trends
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        decision_path,
        COUNT(*) as count
      FROM return_decisions 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), decision_path
      ORDER BY date DESC
    `;
    const trendsResult = await pool.query(trendsQuery);

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalReturns: parseInt(metrics.total_returns),
          careConnectReturns: parseInt(metrics.careconnect_returns),
          reCommerceReturns: parseInt(metrics.recommerce_returns),
          completedDonations: parseInt(metrics.completed_donations),
          totalCreditGiven: parseFloat(metrics.total_credits_given) || 0,
          availableRenewed: parseInt(metrics.available_renewed),
          soldRenewed: parseInt(metrics.sold_renewed),
          verifiedNGOs: parseInt(metrics.verified_ngos),
          totalSavings: totalSavings,
          totalRevenue: totalRevenue,
          adoptionRate: metrics.total_returns > 0 ? 
            Math.round((parseInt(metrics.careconnect_returns) / parseInt(metrics.total_returns)) * 100) : 0
        },
        trends: trendsResult.rows
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * @swagger
 * /api/v1/admin/ngos:
 *   get:
 *     summary: Get NGO management data
 *     tags: [Admin]
 */
router.get('/ngos', async (req, res) => {
  try {
    const ngosQuery = `
      SELECT 
        n.*,
        COUNT(d.id) as total_donations_received,
        SUM(d.credit_amount) as total_credit_value,
        COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_donations
      FROM ngos n
      LEFT JOIN donations d ON n.id = d.ngo_id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `;
    
    const result = await pool.query(ngosQuery);
    
    res.json({
      success: true,
      ngos: result.rows.map(ngo => ({
        ...ngo,
        performance_score: Math.min(100, 
          ((parseInt(ngo.completed_donations) || 0) * 20) + 
          (ngo.verification_status === 'verified' ? 30 : 0)
        )
      }))
    });

  } catch (error) {
    console.error('NGO management error:', error);
    res.status(500).json({ error: 'Failed to fetch NGO data' });
  }
});

module.exports = router;