const express = require('express');
const router = express.Router();
const CreditManagementService = require('../services/CreditManagementService');
const WalletCreditService = require('../services/WalletCreditService');

const creditManager = new CreditManagementService();
const walletService = new WalletCreditService();

/**
 * @route POST /api/credit/calculate
 * @desc Calculate instant credit for NGO donation (preview)
 */
router.post('/calculate', async (req, res) => {
  try {
    const { product, orderDetails, returnReason } = req.body;

    if (!product || !product.price) {
      return res.status(400).json({
        success: false,
        error: 'Product information is required'
      });
    }

    if (!orderDetails) {
      return res.status(400).json({
        success: false,
        error: 'Order details are required'
      });
    }

    const creditCalculation = creditManager.creditCalculator.calculateInstantCredit(
      product,
      orderDetails,
      returnReason || 'ngo_donation'
    );

    res.json(creditCalculation);

  } catch (error) {
    console.error('Credit calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Credit calculation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/credit/process-ngo-donation
 * @desc Process complete NGO donation credit flow
 */
router.post('/process-ngo-donation', async (req, res) => {
  try {
    const {
      userId,
      orderId,
      returnId,
      ngoId,
      sellerId,
      product,
      orderDetails,
      returnReason
    } = req.body;

    // Validate required fields
    const requiredFields = { userId, orderId, sellerId, product, orderDetails };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    const result = await creditManager.processNGODonationCredit({
      userId,
      orderId,
      returnId,
      ngoId,
      sellerId,
      product,
      orderDetails,
      returnReason: returnReason || 'ngo_donation'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'NGO donation credit processed successfully',
        data: result.result
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('NGO donation credit processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Credit processing failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/wallet/:userId
 * @desc Get wallet details and transaction history
 */
router.get('/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const walletDetails = await walletService.getWalletDetails(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(walletDetails);

  } catch (error) {
    console.error('Wallet details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet details',
      message: error.message
    });
  }
});

/**
 * @route POST /api/credit/wallet/payment
 * @desc Process wallet payment
 */
router.post('/wallet/payment', async (req, res) => {
  try {
    const { userId, amount, orderId, description } = req.body;

    if (!userId || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'User ID, amount, and order ID are required'
      });
    }

    const paymentResult = await walletService.processWalletPayment({
      userId,
      amount: parseFloat(amount),
      orderId,
      description
    });

    res.json(paymentResult);

  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/analytics
 * @desc Get financial analytics for credit system
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'current_month' } = req.query;

    const analytics = await creditManager.getFinancialAnalytics(period);

    res.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/seller-analysis/:sellerId
 * @desc Get seller-specific cost analysis
 */
router.get('/seller-analysis/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { period = '30_days' } = req.query;

    const analysis = await creditManager.getSellerCostAnalysis(sellerId, period);

    res.json(analysis);

  } catch (error) {
    console.error('Seller analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get seller analysis',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/stats
 * @desc Get NGO donation credit statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await walletService.getNGOCreditStats(startDate, endDate);

    res.json(stats);

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/transaction/:transactionId
 * @desc Get specific transaction details
 */
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await walletService.getTransaction(transactionId);

    res.json(transaction);

  } catch (error) {
    console.error('Transaction details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction details',
      message: error.message
    });
  }
});

/**
 * @route GET /api/credit/config
 * @desc Get current credit configuration (admin)
 */
router.get('/config', async (req, res) => {
  try {
    const config = creditManager.creditCalculator.getConfiguration();

    res.json({
      success: true,
      configuration: config
    });

  } catch (error) {
    console.error('Configuration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/credit/config/cost-factors
 * @desc Update cost factors configuration (admin)
 */
router.put('/config/cost-factors', async (req, res) => {
  try {
    const { costFactors } = req.body;

    if (!costFactors) {
      return res.status(400).json({
        success: false,
        error: 'Cost factors are required'
      });
    }

    creditManager.creditCalculator.updateCostFactors(costFactors);

    res.json({
      success: true,
      message: 'Cost factors updated successfully',
      configuration: creditManager.creditCalculator.getConfiguration()
    });

  } catch (error) {
    console.error('Cost factors update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cost factors',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/credit/config/credit-settings
 * @desc Update credit settings (admin)
 */
router.put('/config/credit-settings', async (req, res) => {
  try {
    const { creditConfig } = req.body;

    if (!creditConfig) {
      return res.status(400).json({
        success: false,
        error: 'Credit configuration is required'
      });
    }

    creditManager.creditCalculator.updateCreditConfig(creditConfig);

    res.json({
      success: true,
      message: 'Credit settings updated successfully',
      configuration: creditManager.creditCalculator.getConfiguration()
    });

  } catch (error) {
    console.error('Credit settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update credit settings',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/credit/config/cost-sharing
 * @desc Update cost sharing configuration (admin)
 */
router.put('/config/cost-sharing', async (req, res) => {
  try {
    const { costSharingConfig } = req.body;

    if (!costSharingConfig) {
      return res.status(400).json({
        success: false,
        error: 'Cost sharing configuration is required'
      });
    }

    // Validate percentages add up to 100
    const total = costSharingConfig.seller + costSharingConfig.meesho;
    if (total !== 100) {
      return res.status(400).json({
        success: false,
        error: 'Seller and Meesho percentages must add up to 100'
      });
    }

    creditManager.creditCalculator.updateCostSharingConfig(costSharingConfig);

    res.json({
      success: true,
      message: 'Cost sharing configuration updated successfully',
      configuration: creditManager.creditCalculator.getConfiguration()
    });

  } catch (error) {
    console.error('Cost sharing update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cost sharing configuration',
      message: error.message
    });
  }
});

/**
 * @route POST /api/credit/demo/seed-wallet
 * @desc Create demo wallet data for testing
 */
router.post('/demo/seed-wallet', async (req, res) => {
  try {
    const { userId = 'user123' } = req.body;

    // Initialize wallet tables first
    await walletService.initializeWalletTables();

    // Create demo NGO donation credits
    const demoTransactions = [
      {
        userId,
        creditAmount: 75,
        orderId: 'ORD001',
        ngoId: 'NGO001',
        productDetails: {
          name: 'Cotton Kurti',
          price: 299,
          category: 'Fashion'
        },
        creditCalculationDetails: {
          buyerCredit: 75,
          avoidedCosts: { total: 125 }
        },
        description: 'Credit for donating Cotton Kurti to NGO'
      },
      {
        userId,
        creditAmount: 150,
        orderId: 'ORD002',
        ngoId: 'NGO002',
        productDetails: {
          name: 'Smartphone Cover',
          price: 599,
          category: 'Electronics'
        },
        creditCalculationDetails: {
          buyerCredit: 150,
          avoidedCosts: { total: 250 }
        },
        description: 'Credit for donating Smartphone Cover to NGO'
      },
      {
        userId,
        creditAmount: 45,
        orderId: 'ORD003',
        ngoId: 'NGO001',
        productDetails: {
          name: 'Face Cream',
          price: 199,
          category: 'Beauty'
        },
        creditCalculationDetails: {
          buyerCredit: 45,
          avoidedCosts: { total: 75 }
        },
        description: 'Credit for donating Face Cream to NGO'
      }
    ];

    const results = [];
    for (const transaction of demoTransactions) {
      const result = await walletService.issueNGODonationCredit(transaction);
      results.push(result);
    }

    res.json({
      success: true,
      message: 'Demo wallet data created successfully',
      results: results.filter(r => r.success),
      totalCredits: results.reduce((sum, r) => sum + (r.success ? r.transaction.amount : 0), 0)
    });

  } catch (error) {
    console.error('Demo seed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create demo data',
      message: error.message
    });
  }
});

module.exports = router;