const express = require('express');
const router = express.Router();
const { Order, User } = require('../models');

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId'
      });
    }

    console.log('Fetching orders for user:', userId);
    
    const user = new User();
    const orders = await user.getUserOrders(userId);
    
    // Group orders by order_id
    const groupedOrders = orders.reduce((acc, item) => {
      const orderId = item.order_number;
      
      if (!acc[orderId]) {
        acc[orderId] = {
          orderId: item.order_number,
          orderDate: item.order_date,
          totalAmount: item.total_amount,
          orderStatus: item.order_status,
          items: []
        };
      }
      
      acc[orderId].items.push({
        itemId: item.order_item_id,
        productId: item.product_id,
        productName: item.product_name,
        category: item.category,
        brand: item.brand,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        status: item.item_status,
        deliveredAt: item.delivered_at,
        images: item.images,
        isReturnEligible: item.is_return_eligible
      });
      
      return acc;
    }, {});
    
    const ordersList = Object.values(groupedOrders);
    
    res.json({
      success: true,
      orders: ordersList,
      totalOrders: ordersList.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get specific order details
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('Fetching order details for:', orderId);
    
    const order = new Order();
    const orderWithItems = await order.getOrderWithItems(orderId);
    
    if (!orderWithItems || orderWithItems.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    // Structure the response
    const orderData = orderWithItems[0];
    const orderDetails = {
      orderId: orderData.order_number,
      orderDate: orderData.order_date,
      totalAmount: orderData.total_amount,
      orderStatus: orderData.order_status,
      deliveryAddress: orderData.delivery_address,
      paymentStatus: orderData.payment_status,
      customer: {
        userId: orderData.user_id,
        name: orderData.customer_name,
        email: orderData.customer_email
      },
      items: orderWithItems.map(item => ({
        itemId: item.order_item_id,
        productId: item.product_id,
        productName: item.product_name,
        category: item.category,
        brand: item.brand,
        originalPrice: item.original_price,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        status: item.item_status,
        deliveredAt: item.delivered_at,
        images: item.images,
        isReturnEligible: item.is_return_eligible
      }))
    };
    
    res.json({
      success: true,
      order: orderDetails,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Order details fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch order details',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               items:
 *                 type: array
 *               deliveryAddress:
 *                 type: object
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { userId, items, deliveryAddress, totalAmount } = req.body;
    
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'items (array)']
      });
    }
    
    // Generate order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    console.log('Creating new order:', orderId);
    
    const order = new Order();
    const newOrder = await order.createOrderWithItems({
      order_id: orderId,
      user_id: userId,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      payment_status: 'PENDING',
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice,
        total_price: item.totalPrice || (item.unitPrice * (item.quantity || 1))
      }))
    });
    
    res.status(201).json({
      success: true,
      order: newOrder,
      message: 'Order created successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        error: 'Missing required field: status'
      });
    }
    
    console.log('Updating order status:', orderId, 'to', status);
    
    const order = new Order();
    const updatedOrder = await order.updateStatus(orderId, status);
    
    if (!updatedOrder) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    // If status is DELIVERED, mark items as delivered
    if (status === 'DELIVERED') {
      await order.markItemsDelivered(orderId);
    }
    
    res.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: error.message
    });
  }
});

module.exports = router;