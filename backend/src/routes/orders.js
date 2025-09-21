const express = require('express');
const router = express.Router();
const { Order, User } = require('../models');

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'USER001'; // Use actual user_id from sample data
    
    console.log('Getting orders for user:', userId);

    // Use the new User model to get orders
    const user = new User();
    const orders = await user.getUserOrders(userId);
    
    if (!orders || orders.length === 0) {
      return res.json({
        success: true,
        orders: []
      });
    }

    // Group orders by order_id and include items (filter out returned items)
    const groupedOrders = {};
    orders.forEach(orderItem => {
      // Skip returned items unless specifically requested
      const showReturned = req.query.includeReturned === 'true';
      if (!showReturned && orderItem.item_status === 'RETURNED') {
        return;
      }

      if (!groupedOrders[orderItem.order_number]) {
        groupedOrders[orderItem.order_number] = {
          id: orderItem.order_id,
          order_id: orderItem.order_number,
          order_date: orderItem.order_date,
          total_amount: orderItem.total_amount,
          status: orderItem.order_status,
          customer_name: orderItem.customer_name,
          items: []
        };
      }
      
      // Parse images JSON if it's a string
      let imageUrls = [];
      if (orderItem.images) {
        try {
          imageUrls = typeof orderItem.images === 'string' 
            ? JSON.parse(orderItem.images) 
            : orderItem.images;
        } catch (e) {
          // If parsing fails, treat as single image URL
          imageUrls = [orderItem.images];
        }
      }

      groupedOrders[orderItem.order_number].items.push({
        id: orderItem.order_item_id,
        order_item_id: orderItem.order_item_id,
        product_id: orderItem.product_id,
        local_product_id: `product_${orderItem.product_id.replace('PROD', '')}`, // Convert PROD001 to product_1
        title: orderItem.product_name,
        product_name: orderItem.product_name,
        category: orderItem.category,
        brand: orderItem.brand,
        price: orderItem.unit_price,
        unit_price: orderItem.unit_price,
        original_price: orderItem.unit_price,
        quantity: orderItem.quantity,
        status: orderItem.item_status,
        images: imageUrls,
        image_urls: imageUrls,
        delivered_at: orderItem.delivered_at,
        delivery_date: orderItem.delivered_at,
        is_return_eligible: orderItem.is_return_eligible,
        canReturn: orderItem.is_return_eligible,
        returnEligible: orderItem.is_return_eligible
      });
    });

    // Filter out orders with no items (all items returned)
    const ordersArray = Object.values(groupedOrders).filter(order => order.items.length > 0);
    
    res.json({
      success: true,
      orders: ordersArray
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
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Use the new Order model to get order details
    const order = new Order();
    const orderWithItems = await order.getOrderWithItems(orderId);
    
    if (!orderWithItems || orderWithItems.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Format the order data
    const orderData = {
      id: orderWithItems[0].order_id,
      order_id: orderWithItems[0].order_number,
      order_date: orderWithItems[0].order_date,
      total_amount: orderWithItems[0].total_amount,
      status: orderWithItems[0].order_status,
      delivery_address: orderWithItems[0].delivery_address,
      payment_status: orderWithItems[0].payment_status,
      customer_name: orderWithItems[0].customer_name,
      customer_email: orderWithItems[0].customer_email,
      items: orderWithItems.map(item => ({
        id: item.order_item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        brand: item.brand,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        status: item.item_status,
        images: item.images,
        delivered_at: item.delivered_at,
        is_return_eligible: item.is_return_eligible
      }))
    };

    res.json({
      success: true,
      order: orderData
    });

  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order details',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/orders/return:
 *   post:
 *     summary: Mark order item as returned
 *     tags: [Orders]
 */
router.post('/return', async (req, res) => {
  try {
    const { orderId, orderItemId, returnType, userId } = req.body;

    if (!orderId || !orderItemId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and Order Item ID are required'
      });
    }

    // Import database connection
    const { pool } = require('../config/database');

    // Update the order item status to 'RETURNED'
    const updateResult = await pool.query(`
      UPDATE order_items 
      SET status = 'RETURNED'
      WHERE id = $1
      RETURNING *
    `, [orderItemId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order item not found'
      });
    }

    // Check if all items in the order are returned
    const orderItemsCheck = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN oi.status = 'RETURNED' THEN 1 END) as returned
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_id = $1
    `, [orderId]);

    const { total, returned } = orderItemsCheck.rows[0];
    
    // If all items are returned, update order status
    if (parseInt(total) === parseInt(returned)) {
      await pool.query(`
        UPDATE orders 
        SET status = 'RETURNED', updated_at = NOW()
        WHERE order_id = $1
      `, [orderId]);
    }

    res.json({
      success: true,
      message: 'Order item marked as returned successfully',
      orderItem: updateResult.rows[0],
      orderFullyReturned: parseInt(total) === parseInt(returned)
    });

  } catch (error) {
    console.error('Return update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update return status',
      message: error.message
    });
  }
});

module.exports = router;