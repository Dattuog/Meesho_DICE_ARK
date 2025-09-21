const BaseModel = require('./BaseModel');

class Order extends BaseModel {
  constructor() {
    super('orders');
  }

  // Find order by order_id (external ID)
  async findByOrderId(orderId) {
    try {
      const query = `
        SELECT 
          o.*,
          u.user_id,
          u.name as customer_name,
          u.email as customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.order_id = $1
      `;
      const result = await this.pool.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding order by order_id:', error);
      throw error;
    }
  }

  // Get order with items
  async getOrderWithItems(orderId) {
    try {
      const query = `
        SELECT 
          o.id as order_id,
          o.order_id as order_number,
          o.order_date,
          o.total_amount,
          o.status as order_status,
          o.delivery_address,
          o.payment_status,
          u.user_id,
          u.name as customer_name,
          u.email as customer_email,
          oi.id as order_item_id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.status as item_status,
          oi.delivered_at,
          p.product_id,
          p.name as product_name,
          p.category,
          p.brand,
          p.original_price,
          p.images,
          CASE 
            WHEN oi.delivered_at IS NOT NULL AND oi.delivered_at > NOW() - INTERVAL '30 days' 
            THEN TRUE 
            ELSE FALSE 
          END as is_return_eligible
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.order_id = $1
        ORDER BY oi.created_at
      `;
      
      const result = await this.pool.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting order with items:', error);
      throw error;
    }
  }

  // Create new order with items
  async createOrderWithItems(orderData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const {
        order_id,
        user_id,
        total_amount,
        delivery_address,
        payment_status = 'PENDING',
        items
      } = orderData;

      // Get user UUID
      const userResult = await client.query('SELECT id FROM users WHERE user_id = $1', [user_id]);
      if (!userResult.rows[0]) {
        throw new Error('User not found');
      }
      const userUuid = userResult.rows[0].id;

      // Create order
      const orderQuery = `
        INSERT INTO orders (order_id, user_id, total_amount, delivery_address, payment_status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        order_id,
        userUuid,
        total_amount,
        typeof delivery_address === 'object' ? JSON.stringify(delivery_address) : delivery_address,
        payment_status
      ]);

      const order = orderResult.rows[0];

      // Create order items
      const orderItems = [];
      for (const item of items) {
        const productResult = await client.query('SELECT id FROM products WHERE product_id = $1', [item.product_id]);
        if (!productResult.rows[0]) {
          throw new Error(`Product not found: ${item.product_id}`);
        }
        const productUuid = productResult.rows[0].id;

        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const itemResult = await client.query(itemQuery, [
          order.id,
          productUuid,
          item.quantity,
          item.unit_price,
          item.total_price
        ]);

        orderItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      return { order, items: orderItems };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order with items:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update order status
  async updateStatus(orderId, status) {
    try {
      const query = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [status, orderId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Mark items as delivered
  async markItemsDelivered(orderId) {
    try {
      const query = `
        UPDATE order_items 
        SET status = 'DELIVERED', delivered_at = NOW()
        WHERE order_id = (SELECT id FROM orders WHERE order_id = $1)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      console.error('Error marking items as delivered:', error);
      throw error;
    }
  }
}

module.exports = Order;