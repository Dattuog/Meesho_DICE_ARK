const { pool } = require('../config/database');

class WalletCreditService {
  constructor() {
    this.transactionTypes = {
      NGO_DONATION_CREDIT: 'ngo_donation_credit',
      REFUND: 'refund',
      CASHBACK: 'cashback',
      PURCHASE: 'purchase',
      WITHDRAWAL: 'withdrawal'
    };

    this.transactionStatus = {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    };
  }

  /**
   * Initialize wallet tables if they don't exist
   */
  async initializeWalletTables() {
    try {
      // Create wallet table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wallets (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) UNIQUE NOT NULL,
          balance DECIMAL(10,2) DEFAULT 0.00,
          total_credits_earned DECIMAL(10,2) DEFAULT 0.00,
          total_spent DECIMAL(10,2) DEFAULT 0.00,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create wallet transactions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          transaction_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          description TEXT,
          metadata JSONB,
          order_id VARCHAR(255),
          return_id VARCHAR(255),
          ngo_id VARCHAR(255),
          reference_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
      `);

      console.log('Wallet tables initialized successfully');
    } catch (error) {
      console.error('Error initializing wallet tables:', error);
      throw error;
    }
  }

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId) {
    try {
      // Try to get existing wallet
      let result = await pool.query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create new wallet
        result = await pool.query(`
          INSERT INTO wallets (user_id, balance, total_credits_earned, total_spent)
          VALUES ($1, 0.00, 0.00, 0.00)
          RETURNING *
        `, [userId]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      throw error;
    }
  }

  /**
   * Issue instant credit for NGO donation
   */
  async issueNGODonationCredit(creditData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        userId,
        creditAmount,
        orderId,
        returnId,
        ngoId,
        productDetails,
        creditCalculationDetails,
        description = 'Credit for donating return to NGO'
      } = creditData;

      // Generate unique transaction ID
      const transactionId = this.generateTransactionId('NGO', userId);

      // Get or create wallet
      const wallet = await this.getOrCreateWallet(userId);

      // Create transaction record
      const transactionResult = await client.query(`
        INSERT INTO wallet_transactions (
          transaction_id, user_id, type, amount, status, description,
          metadata, order_id, return_id, ngo_id,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        transactionId,
        userId,
        this.transactionTypes.NGO_DONATION_CREDIT,
        creditAmount,
        this.transactionStatus.PENDING,
        description,
        JSON.stringify({
          productDetails,
          creditCalculationDetails,
          donationType: 'ngo_donation',
          issuedAt: new Date().toISOString()
        }),
        orderId,
        returnId,
        ngoId
      ]);

      // Update wallet balance
      const updatedWallet = await client.query(`
        UPDATE wallets 
        SET 
          balance = balance + $1,
          total_credits_earned = total_credits_earned + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `, [creditAmount, userId]);

      // Mark transaction as completed
      await client.query(`
        UPDATE wallet_transactions 
        SET 
          status = $1,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = $2
      `, [this.transactionStatus.COMPLETED, transactionId]);

      await client.query('COMMIT');

      return {
        success: true,
        transaction: {
          ...transactionResult.rows[0],
          status: this.transactionStatus.COMPLETED
        },
        wallet: updatedWallet.rows[0],
        message: 'Credit issued successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error issuing NGO donation credit:', error);
      
      return {
        success: false,
        error: 'Failed to issue credit',
        message: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get wallet balance and transaction history
   */
  async getWalletDetails(userId, limit = 50, offset = 0) {
    try {
      // Get wallet
      const wallet = await this.getOrCreateWallet(userId);

      // Get recent transactions
      const transactionsResult = await pool.query(`
        SELECT 
          transaction_id,
          type,
          amount,
          status,
          description,
          metadata,
          order_id,
          return_id,
          ngo_id,
          created_at,
          completed_at
        FROM wallet_transactions 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      // Get transaction summary
      const summaryResult = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
          SUM(CASE WHEN type = 'ngo_donation_credit' AND status = 'completed' THEN amount ELSE 0 END) as total_ngo_credits,
          SUM(CASE WHEN amount > 0 AND status = 'completed' THEN amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN amount < 0 AND status = 'completed' THEN ABS(amount) ELSE 0 END) as total_debits
        FROM wallet_transactions 
        WHERE user_id = $1
      `, [userId]);

      return {
        success: true,
        wallet: {
          ...wallet,
          summary: summaryResult.rows[0]
        },
        transactions: transactionsResult.rows,
        pagination: {
          limit,
          offset,
          total: parseInt(summaryResult.rows[0].total_transactions)
        }
      };

    } catch (error) {
      console.error('Error getting wallet details:', error);
      return {
        success: false,
        error: 'Failed to get wallet details',
        message: error.message
      };
    }
  }

  /**
   * Process wallet payment (deduct from balance)
   */
  async processWalletPayment(paymentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        userId,
        amount,
        orderId,
        description = 'Wallet payment for order'
      } = paymentData;

      // Get current wallet balance
      const walletResult = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(walletResult.rows[0].balance);
      
      if (currentBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Generate transaction ID
      const transactionId = this.generateTransactionId('PAY', userId);

      // Create debit transaction
      await client.query(`
        INSERT INTO wallet_transactions (
          transaction_id, user_id, type, amount, status, description,
          order_id, created_at, completed_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        transactionId,
        userId,
        this.transactionTypes.PURCHASE,
        -amount, // Negative for debit
        this.transactionStatus.COMPLETED,
        description,
        orderId
      ]);

      // Update wallet balance
      const updatedWallet = await client.query(`
        UPDATE wallets 
        SET 
          balance = balance - $1,
          total_spent = total_spent + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `, [amount, userId]);

      await client.query('COMMIT');

      return {
        success: true,
        transactionId,
        wallet: updatedWallet.rows[0],
        message: 'Payment processed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing wallet payment:', error);
      
      return {
        success: false,
        error: 'Payment failed',
        message: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get NGO donation credit statistics
   */
  async getNGOCreditStats(startDate = null, endDate = null) {
    try {
      let dateFilter = '';
      const params = [this.transactionTypes.NGO_DONATION_CREDIT];
      
      if (startDate && endDate) {
        dateFilter = 'AND created_at BETWEEN $2 AND $3';
        params.push(startDate, endDate);
      }

      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT ngo_id) as unique_ngos,
          SUM(amount) as total_credits_issued,
          AVG(amount) as average_credit_amount,
          MIN(amount) as min_credit,
          MAX(amount) as max_credit,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
        FROM wallet_transactions 
        WHERE type = $1 ${dateFilter}
      `, params);

      return {
        success: true,
        stats: result.rows[0]
      };

    } catch (error) {
      console.error('Error getting NGO credit stats:', error);
      return {
        success: false,
        error: 'Failed to get statistics',
        message: error.message
      };
    }
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(prefix, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userHash = userId.substring(0, 4).toUpperCase();
    return `${prefix}_${userHash}_${timestamp}_${random}`;
  }

  /**
   * Validate credit amount
   */
  validateCreditAmount(amount) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, message: 'Invalid credit amount' };
    }
    
    if (numAmount > 5000) {
      return { valid: false, message: 'Credit amount exceeds maximum limit' };
    }
    
    return { valid: true };
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId) {
    try {
      const result = await pool.query(
        'SELECT * FROM wallet_transactions WHERE transaction_id = $1',
        [transactionId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      return {
        success: true,
        transaction: result.rows[0]
      };

    } catch (error) {
      console.error('Error getting transaction:', error);
      return {
        success: false,
        error: 'Failed to get transaction',
        message: error.message
      };
    }
  }
}

module.exports = WalletCreditService;