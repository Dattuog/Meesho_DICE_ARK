const express = require('express');
const router = express.Router();
const { ReturnDecision, User, Product, Order, NGO } = require('../models');
const CreditManagementService = require('../services/CreditManagementService');

// Smart decision engine for return processing with integrated credit management
async function makeReturnDecision(itemData, customerData) {
  const { orderItemId, productId, originalPrice, category, condition, purchaseDate } = itemData;
  const { userId, loyaltyTier, location } = customerData;
  
  console.log(`Processing return decision for item: ${orderItemId}, price: ${originalPrice}, category: ${category}`);
  
  // Initialize credit management service
  const creditManager = new CreditManagementService();
  
  // Value-based routing logic
  if (originalPrice <= 500) {
    // CareConnect pathway for low-value items with dynamic credit calculation
    const nearbyNGOs = await findNearbyNGOs(location, category);
    
    // Calculate dynamic credit using the new credit management system
    const product = {
      name: itemData.productName || 'Product',
      price: originalPrice,
      category: category,
      sku: itemData.sku || productId
    };
    
    const orderDetails = {
      deliveryAddress: customerData.address || 'Bangalore, Karnataka',
      sellerLocation: itemData.sellerLocation || 'Bangalore, Karnataka'
    };
    
    const creditCalculation = creditManager.creditCalculator.calculateInstantCredit(
      product,
      orderDetails,
      'ngo_donation'
    );
    
    const dynamicCredit = creditCalculation.success ? 
      creditCalculation.creditDetails.buyerCredit : 
      calculateDonationCredit(originalPrice, loyaltyTier);
    
    return {
      pathway: 'CARECONNECT',
      recommended: 'DONATION',
      creditOffered: dynamicCredit,
      creditDetails: creditCalculation.success ? creditCalculation.creditDetails : null,
      estimatedSavings: originalPrice * 0.6, // 60% cost saving vs traditional return
      processingTime: '24 hours',
      environmentalImpact: 'High - Item goes to community instead of landfill',
      ngosAvailable: nearbyNGOs.length,
      nearbyNGOs: nearbyNGOs,
      confidence: 0.85,
      dynamicCreditEnabled: creditCalculation.success
    };
  } else {
    // Re-commerce pathway for high-value items
    const resaleValue = await estimateResaleValue(itemData);
    const processingCost = calculateProcessingCost(category, condition);
    const flashSalePrice = Math.round(originalPrice * 0.6); // 60% of original price
    
    // Determine if item qualifies for flash sale vs traditional return
    if (originalPrice > 1000 && condition === 'Good') {
      return {
        pathway: 'FLASH_SALE',
        recommended: 'FLASH_SALE',
        flashSalePrice: flashSalePrice,
        originalPrice: originalPrice,
        discount: Math.round(((originalPrice - flashSalePrice) / originalPrice) * 100),
        processingTime: '2-3 hours',
        expectedSales: '85% chance of sale within 24 hours',
        nearbyUsers: Math.floor(Math.random() * 50) + 10, // Simulated nearby interested users
        confidence: 0.82
      };
    } else {
      return {
        pathway: 'RECOMMERCE',
        recommended: 'RESALE',
        estimatedResaleValue: resaleValue,
        processingCost: processingCost,
        expectedProfit: resaleValue - processingCost,
        processingTime: '5-7 days',
        qualityGrade: determineQualityGrade(condition),
        confidence: 0.78
      };
    }
  }
}

// Calculate donation credit based on item value and customer tier
function calculateDonationCredit(itemValue, loyaltyTier = 'BRONZE') {
  const basePercentage = 0.25; // 25% base credit
  const tierMultipliers = {
    'BRONZE': 1.0,
    'SILVER': 1.1,
    'GOLD': 1.2,
    'PLATINUM': 1.3
  };
  
  const multiplier = tierMultipliers[loyaltyTier] || 1.0;
  return Math.round(itemValue * basePercentage * multiplier);
}

// Find nearby NGOs
async function findNearbyNGOs(location, category) {
  try {
    // Validate location object
    if (!location || !location.latitude || !location.longitude) {
      console.log('Invalid location provided, using default location');
      location = {
        latitude: 12.9716, // Default to Bangalore
        longitude: 77.5946
      };
    }
    
    const ngo = new NGO();
    const nearbyNGOs = await ngo.findNearby(
      location.latitude, 
      location.longitude, 
      15, // 15km radius
      category
    );
    
    return nearbyNGOs.map(ngoData => ({
      id: ngoData.ngo_id,
      name: ngoData.name,
      distance: `${ngoData.distance_km.toFixed(1)} km`,
      acceptedCategories: ngoData.accepted_categories,
      capacity: ngoData.capacity_limit - ngoData.current_capacity,
      contactPerson: ngoData.contact_person,
      verified: ngoData.verification_status === 'VERIFIED'
    }));
  } catch (error) {
    console.error('Error finding nearby NGOs:', error);
    return [];
  }
}

// Estimate resale value using market data
async function estimateResaleValue(itemData) {
  const { originalPrice, category, condition, brand, purchaseDate } = itemData;
  
  // Age depreciation
  const ageInDays = Math.floor((new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
  const ageDepreciation = Math.min(ageInDays / 365 * 0.3, 0.5); // Max 50% depreciation for age
  
  // Condition multipliers
  const conditionMultipliers = {
    'Like New': 0.8,
    'Good': 0.65,
    'Fair': 0.45,
    'Poor': 0.25
  };
  
  // Category demand multipliers
  const categoryMultipliers = {
    'Electronics': 0.7,
    'Fashion': 0.6,
    'Home & Kitchen': 0.5,
    'Books': 0.4
  };
  
  const conditionMultiplier = conditionMultipliers[condition] || 0.5;
  const categoryMultiplier = categoryMultipliers[category] || 0.5;
  
  const estimatedValue = originalPrice * 
    (1 - ageDepreciation) * 
    conditionMultiplier * 
    categoryMultiplier;
  
  return Math.round(estimatedValue);
}

// Calculate processing cost
function calculateProcessingCost(category, condition) {
  const baseCosts = {
    'Electronics': 150,
    'Fashion': 80,
    'Home & Kitchen': 100,
    'Books': 40
  };
  
  const conditionMultipliers = {
    'Like New': 1.0,
    'Good': 1.2,
    'Fair': 1.5,
    'Poor': 2.0
  };
  
  const baseCost = baseCosts[category] || 100;
  const multiplier = conditionMultipliers[condition] || 1.0;
  
  return Math.round(baseCost * multiplier);
}

// Determine quality grade
function determineQualityGrade(condition) {
  const gradeMapping = {
    'Like New': 'LIKE_NEW',
    'Good': 'GOOD', 
    'Fair': 'FAIR',
    'Poor': 'FAIR'  // Map Poor to Fair as minimum
  };
  
  return gradeMapping[condition] || 'FAIR';
}

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

    // Get order and item details using new models
    const order = new Order();
    const orderWithItems = await order.getOrderWithItems(orderId);
    
    if (!orderWithItems || orderWithItems.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the specific item in the order
    const item = orderWithItems.find(orderItem => orderItem.order_item_id === itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in order' });
    }

    // Check if return is eligible
    if (!item.is_return_eligible) {
      return res.status(400).json({ 
        error: 'Return not eligible',
        reason: 'Return window has expired (30 days limit)'
      });
    }

    // Prepare data for decision engine
    const itemData = {
      orderItemId: item.order_item_id,
      productId: item.product_id,
      originalPrice: parseFloat(item.unit_price),
      category: item.category,
      condition: 'Good', // Default condition, should come from frontend
      purchaseDate: item.delivered_at || item.order_date,
      brand: item.brand,
      name: item.product_name
    };

    const customerData = {
      userId: item.user_id,
      loyaltyTier: 'BRONZE', // Should come from user data
      location: customerLocation || {
        latitude: 12.9716, // Default to Bangalore
        longitude: 77.5946
      }
    };

    // Make the return decision
    const decision = await makeReturnDecision(itemData, customerData);
    
    // Create return decision record (temporary fix - skip DB insertion for demo)
    let decisionRecord = { decision_id: `DECISION_${Date.now()}` };
    
    try {
      const returnDecision = new ReturnDecision();
      decisionRecord = await returnDecision.createDecision({
        order_item_id: item.order_item_id,
        user_id: item.order_id, // Get user ID from order
        product_id: item.product_id,
        return_reason: returnReason || 'Customer initiated return',
        item_condition: itemData.condition,
        item_value: itemData.originalPrice,
        decision_path: decision.pathway,
        decision_score: decision.confidence,
        decision_factors: {
          categoryMatch: true,
          valueThreshold: itemData.originalPrice <= 500 ? 'LOW' : 'HIGH',
          loyaltyTier: customerData.loyaltyTier,
          ngosAvailable: decision.ngosAvailable || 0
        },
        estimated_credit: decision.creditOffered || null,
        estimated_resale_value: decision.estimatedResaleValue || null,
        processing_cost_estimate: decision.processingCost || null
      });
    } catch (dbError) {
      console.warn('DB insertion failed, proceeding with decision logic:', dbError.message);
      // Continue with just the decision logic for demo purposes
    }
    
    // Format response based on decision pathway
    let options = [];
    
    if (decision.pathway === 'CARECONNECT') {
      options = [
        {
          type: 'donation',
          title: 'Donate for Good',
          description: 'Give back to the community and get instant credits',
          benefits: [
            `Get ₹${decision.creditOffered} instant wallet credit`,
            'Support local NGOs and communities',
            'Fast processing in 24 hours',
            'Zero return shipping costs'
          ],
          recommended: true,
          ngos: decision.nearbyNGOs || []
        },
        {
          type: 'traditional',
          title: 'Standard Return',
          description: 'Get full refund through traditional process',
          benefits: [
            'Full refund to original payment method',
            'Standard return policy applies',
            '5-7 business days processing'
          ],
          recommended: false
        }
      ];
    } else if (decision.pathway === 'FLASH_SALE') {
      options = [
        {
          type: 'flash_sale',
          title: 'Flash Sale to Nearby Users',
          description: 'Sell quickly at discounted price to local buyers',
          benefits: [
            `Get ₹${decision.flashSalePrice} (${decision.discount}% off original price)`,
            `${decision.nearbyUsers}+ interested users nearby`,
            '85% chance of sale within 24 hours',
            'Fast processing in 2-3 hours'
          ],
          recommended: true
        },
        {
          type: 'traditional',
          title: 'Standard Return',
          description: 'Get full refund through traditional process',
          benefits: [
            'Full refund to original payment method',
            'Standard return policy applies',
            '5-7 business days processing'
          ],
          recommended: false
        }
      ];
    } else {
      options = [
        {
          type: 'traditional',
          title: 'Standard Return',
          description: 'Get full refund through traditional process',
          benefits: [
            'Full refund to original payment method',
            'Standard return policy applies',
            '5-7 business days processing'
          ],
          recommended: true
        }
      ];
    }

    res.json({
      success: true,
      orderId,
      itemId,
      item: {
        title: item.product_name,
        category: item.category,
        brand: item.brand,
        originalPrice: item.unit_price,
        images: item.images
      },
      decision: {
        ...decision,
        options,
        creditAmount: decision.creditOffered,
        flashSalePrice: decision.flashSalePrice,
        processingTime: decision.processingTime
      },
      decisionId: decisionRecord.decision_id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Decision engine error:', error);
    res.status(500).json({
      error: 'Decision processing failed',
      message: error.message
    });
  }
});

// POST /api/decision/user-choice - Record user's choice
router.post('/user-choice', async (req, res) => {
  try {
    const { decisionId, userChoice } = req.body;
    
    if (!decisionId || !userChoice) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['decisionId', 'userChoice']
      });
    }
    
    const returnDecision = new ReturnDecision();
    const updatedDecision = await returnDecision.updateUserChoice(decisionId, userChoice);
    
    if (!updatedDecision) {
      return res.status(404).json({
        error: 'Decision not found'
      });
    }
    
    // If user accepted donation, process it
    if (userChoice === 'ACCEPT_DONATION') {
      // Here we would typically:
      // 1. Create donation record
      // 2. Update user wallet
      // 3. Schedule pickup
      // For demo, we'll just complete the decision
      await returnDecision.completeDecision(
        decisionId, 
        'DONATION_ACCEPTED', 
        0, // No direct revenue
        updatedDecision.estimated_credit || 0 // Cost savings
      );
    }
    
    res.json({
      success: true,
      decision: updatedDecision,
      message: 'User choice recorded successfully'
    });
    
  } catch (error) {
    console.error('User choice error:', error);
    res.status(500).json({
      error: 'Failed to record user choice',
      message: error.message
    });
  }
});

// GET /api/decision/analytics - Get decision analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const returnDecision = new ReturnDecision();
    const analytics = await returnDecision.getDecisionAnalytics(
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    );
    
    res.json({
      success: true,
      analytics,
      period: { startDate, endDate }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Analytics retrieval failed',
      message: error.message
    });
  }
});

// GET /api/decision/:decisionId - Get decision details
router.get('/:decisionId', async (req, res) => {
  try {
    const { decisionId } = req.params;
    
    const returnDecision = new ReturnDecision();
    const decision = await returnDecision.findByDecisionId(decisionId);
    
    if (!decision) {
      return res.status(404).json({
        error: 'Decision not found'
      });
    }
    
    res.json({
      success: true,
      decision
    });
    
  } catch (error) {
    console.error('Decision retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve decision',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/decision/process-ngo-donation:
 *   post:
 *     summary: Process complete NGO donation with instant credit
 *     tags: [Decision Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               returnId:
 *                 type: string
 *               ngoId:
 *                 type: string
 *               sellerId:
 *                 type: string
 *               product:
 *                 type: object
 *               orderDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: NGO donation processed successfully with instant credit
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Processing failed
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
      decisionId
    } = req.body;

    // Validate required fields
    if (!userId || !orderId || !sellerId || !product) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, orderId, sellerId, product'
      });
    }

    // Initialize credit management service
    const creditManager = new CreditManagementService();

    // Process the complete NGO donation credit flow
    const result = await creditManager.processNGODonationCredit({
      userId,
      orderId,
      returnId,
      ngoId,
      sellerId,
      product,
      orderDetails,
      returnReason: 'ngo_donation'
    });

    if (result.success) {
      // Update decision record if decisionId provided
      if (decisionId) {
        try {
          const returnDecision = new ReturnDecision();
          await returnDecision.updateDecisionStatus(decisionId, 'COMPLETED', {
            creditAmount: result.result.creditIssued.amount,
            transactionId: result.result.creditIssued.transactionId,
            processingCompletedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.error('Decision status update error:', updateError);
          // Don't fail the whole request for this
        }
      }

      res.json({
        success: true,
        message: 'NGO donation processed successfully with instant credit',
        data: {
          creditIssued: result.result.creditIssued,
          costSharing: result.result.costSharing,
          financialImpact: result.result.financialImpact,
          processing: {
            completedAt: new Date().toISOString(),
            transactionId: result.result.creditIssued.transactionId
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'NGO donation processing failed',
        message: result.message
      });
    }

  } catch (error) {
    console.error('NGO donation processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message
    });
  }
});

module.exports = router;