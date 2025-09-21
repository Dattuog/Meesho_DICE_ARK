const BaseModel = require('./BaseModel');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Find user by user_id (external ID)
  async findByUserId(userId) {
    try {
      const query = 'SELECT * FROM users WHERE user_id = $1';
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by user_id:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Update wallet balance
  async updateWalletBalance(userId, amount, operation = 'ADD') {
    try {
      const user = await this.findByUserId(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let newBalance;
      if (operation === 'ADD') {
        newBalance = parseFloat(user.wallet_balance) + parseFloat(amount);
      } else if (operation === 'SUBTRACT') {
        newBalance = parseFloat(user.wallet_balance) - parseFloat(amount);
      } else {
        newBalance = parseFloat(amount);
      }

      const query = `
        UPDATE users 
        SET wallet_balance = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [newBalance, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  // Get user orders with items
  async getUserOrders(userId) {
    try {
      const query = `
        SELECT 
          o.id as order_id,
          o.order_id as order_number,
          o.order_date,
          o.total_amount,
          o.status as order_status,
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
          p.images,
          CASE 
            WHEN oi.delivered_at IS NOT NULL AND oi.delivered_at > NOW() - INTERVAL '30 days' 
            THEN TRUE 
            ELSE FALSE 
          END as is_return_eligible
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON o.user_id = u.id
        WHERE u.user_id = $1
        ORDER BY o.order_date DESC
      `;
      
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const {
        user_id,
        email,
        phone,
        name,
        address,
        wallet_balance = 0,
        loyalty_tier = 'BRONZE'
      } = userData;

      const query = `
        INSERT INTO users (user_id, email, phone, name, address, wallet_balance, loyalty_tier)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        user_id, email, phone, name, 
        typeof address === 'object' ? JSON.stringify(address) : address,
        wallet_balance, loyalty_tier
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

module.exports = User;