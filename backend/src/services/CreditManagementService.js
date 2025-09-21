const CreditCalculationService = require('./CreditCalculationService');
const WalletCreditService = require('./WalletCreditService');
const { pool } = require('../config/database');

class CreditManagementService {
  constructor() {
    this.creditCalculator = new CreditCalculationService();
    this.walletService = new WalletCreditService();
    
    // Initialize financial tracking tables
    this.initializeFinancialTables();
  }

  /**
   * Initialize financial tracking tables
   */
  async initializeFinancialTables() {
    try {
      // Credit cost sharing records
      await pool.query(`
        CREATE TABLE IF NOT EXISTS credit_cost_sharing (
          id SERIAL PRIMARY KEY,
          transaction_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          order_id VARCHAR(255) NOT NULL,
          return_id VARCHAR(255),
          ngo_id VARCHAR(255),
          seller_id VARCHAR(255) NOT NULL,
          
          -- Credit details
          buyer_credit_amount DECIMAL(10,2) NOT NULL,
          total_avoided_costs DECIMAL(10,2) NOT NULL,
          
          -- Cost sharing
          seller_cost_amount DECIMAL(10,2) NOT NULL,
          meesho_cost_amount DECIMAL(10,2) NOT NULL,
          seller_cost_percentage DECIMAL(5,2) NOT NULL,
          meesho_cost_percentage DECIMAL(5,2) NOT NULL,
          
          -- Seller benefit analysis
          traditional_return_cost DECIMAL(10,2) NOT NULL,
          seller_savings DECIMAL(10,2) NOT NULL,
          seller_savings_percentage DECIMAL(5,2) NOT NULL,
          
          -- Product and calculation metadata
          product_price DECIMAL(10,2) NOT NULL,
          product_category VARCHAR(100),
          calculation_metadata JSONB,
          
          -- Status and timing
          status VARCHAR(20) DEFAULT 'pending',
          processed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Monthly financial summary
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ngo_credit_financial_summary (
          id SERIAL PRIMARY KEY,
          month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
          
          -- Transaction volumes
          total_transactions INTEGER DEFAULT 0,
          total_credits_issued DECIMAL(12,2) DEFAULT 0.00,
          total_avoided_costs DECIMAL(12,2) DEFAULT 0.00,
          
          -- Cost distribution
          total_seller_costs DECIMAL(12,2) DEFAULT 0.00,
          total_meesho_costs DECIMAL(12,2) DEFAULT 0.00,
          total_seller_savings DECIMAL(12,2) DEFAULT 0.00,
          
          -- Performance metrics
          average_credit_amount DECIMAL(10,2) DEFAULT 0.00,
          average_seller_savings DECIMAL(10,2) DEFAULT 0.00,
          cost_efficiency_ratio DECIMAL(5,4) DEFAULT 0.00, -- Credits issued / Total costs
          
          -- Category breakdown
          category_breakdown JSONB,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(month_year)
        )
      `);

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_credit_cost_sharing_user_id ON credit_cost_sharing(user_id);
        CREATE INDEX IF NOT EXISTS idx_credit_cost_sharing_seller_id ON credit_cost_sharing(seller_id);
        CREATE INDEX IF NOT EXISTS idx_credit_cost_sharing_order_id ON credit_cost_sharing(order_id);
        CREATE INDEX IF NOT EXISTS idx_credit_cost_sharing_created_at ON credit_cost_sharing(created_at);
        CREATE INDEX IF NOT EXISTS idx_credit_cost_sharing_status ON credit_cost_sharing(status);
      `);

      console.log('Financial tracking tables initialized successfully');
    } catch (error) {
      console.error('Error initializing financial tables:', error);
    }
  }

  /**
   * Process complete NGO donation credit flow
   */
  async processNGODonationCredit(donationData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        userId,
        orderId,
        returnId,
        ngoId,
        sellerId,
        product,
        orderDetails,
        returnReason = 'ngo_donation'
      } = donationData;

      // Step 1: Calculate instant credit
      const creditCalculation = this.creditCalculator.calculateInstantCredit(
        product,
        orderDetails,
        returnReason
      );

      if (!creditCalculation.success) {
        throw new Error(`Credit calculation failed: ${creditCalculation.message}`);
      }

      const { creditDetails } = creditCalculation;

      // Step 2: Validate credit amount
      const validation = this.walletService.validateCreditAmount(creditDetails.buyerCredit);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Step 3: Issue credit to buyer's wallet
      const creditResult = await this.walletService.issueNGODonationCredit({
        userId,
        creditAmount: creditDetails.buyerCredit,
        orderId,
        returnId,
        ngoId,
        productDetails: {
          name: product.name,
          price: product.price,
          category: product.category,
          sku: product.sku
        },
        creditCalculationDetails: creditDetails,
        description: `₹${creditDetails.buyerCredit} credit for donating return to NGO`
      });

      if (!creditResult.success) {
        throw new Error(`Credit issuance failed: ${creditResult.message}`);
      }

      // Step 4: Record cost sharing
      const costSharingRecord = await this.recordCostSharing({
        transactionId: creditResult.transaction.transaction_id,
        userId,
        orderId,
        returnId,
        ngoId,
        sellerId,
        creditDetails,
        product
      });

      // Step 5: Update monthly summary
      await this.updateMonthlySummary(creditDetails, product.category);

      await client.query('COMMIT');

      return {
        success: true,
        result: {
          creditIssued: {
            amount: creditDetails.buyerCredit,
            transactionId: creditResult.transaction.transaction_id,
            walletBalance: creditResult.wallet.balance
          },
          costSharing: {
            sellerCost: creditDetails.costSharing.sellerAmount,
            meeshoCost: creditDetails.costSharing.meeshoAmount,
            sellerSavings: creditDetails.sellerBenefit.savings,
            savingsPercentage: creditDetails.sellerBenefit.savingsPercentage
          },
          avoidedCosts: creditDetails.avoidedCosts,
          financialImpact: {
            buyerBenefit: creditDetails.buyerCredit,
            sellerNetCost: creditDetails.costSharing.sellerAmount,
            traditionalCost: creditDetails.sellerBenefit.traditionalCost,
            totalSystemSavings: creditDetails.avoidedCosts.total - creditDetails.buyerCredit
          }
        },
        message: 'NGO donation credit processed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing NGO donation credit:', error);
      
      return {
        success: false,
        error: 'Credit processing failed',
        message: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Record cost sharing details
   */
  async recordCostSharing(data) {
    try {
      const {
        transactionId,
        userId,
        orderId,
        returnId,
        ngoId,
        sellerId,
        creditDetails,
        product
      } = data;

      const result = await pool.query(`
        INSERT INTO credit_cost_sharing (
          transaction_id, user_id, order_id, return_id, ngo_id, seller_id,
          buyer_credit_amount, total_avoided_costs,
          seller_cost_amount, meesho_cost_amount, 
          seller_cost_percentage, meesho_cost_percentage,
          traditional_return_cost, seller_savings, seller_savings_percentage,
          product_price, product_category, calculation_metadata,
          status, processed_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        transactionId,
        userId,
        orderId,
        returnId,
        ngoId,
        sellerId,
        creditDetails.buyerCredit,
        creditDetails.avoidedCosts.total,
        creditDetails.costSharing.sellerAmount,
        creditDetails.costSharing.meeshoAmount,
        creditDetails.costSharing.sellerPercentage,
        creditDetails.costSharing.meeshoPercentage,
        creditDetails.sellerBenefit.traditionalCost,
        creditDetails.sellerBenefit.savings,
        creditDetails.sellerBenefit.savingsPercentage,
        parseFloat(product.price),
        product.category,
        JSON.stringify(creditDetails.metadata),
        'completed'
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error recording cost sharing:', error);
      throw error;
    }
  }

  /**
   * Update monthly financial summary
   */
  async updateMonthlySummary(creditDetails, category) {
    try {
      const monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM format
      
      // Get current category breakdown
      const existingSummary = await pool.query(
        'SELECT category_breakdown FROM ngo_credit_financial_summary WHERE month_year = $1',
        [monthYear]
      );

      let categoryBreakdown = {};
      if (existingSummary.rows.length > 0 && existingSummary.rows[0].category_breakdown) {
        categoryBreakdown = existingSummary.rows[0].category_breakdown;
      }

      // Update category breakdown
      const categoryKey = category || 'uncategorized';
      if (!categoryBreakdown[categoryKey]) {
        categoryBreakdown[categoryKey] = {
          transactions: 0,
          totalCredits: 0,
          totalAvoidedCosts: 0,
          totalSellerCosts: 0,
          totalMeeshoCosts: 0
        };
      }

      categoryBreakdown[categoryKey].transactions += 1;
      categoryBreakdown[categoryKey].totalCredits += creditDetails.buyerCredit;
      categoryBreakdown[categoryKey].totalAvoidedCosts += creditDetails.avoidedCosts.total;
      categoryBreakdown[categoryKey].totalSellerCosts += creditDetails.costSharing.sellerAmount;
      categoryBreakdown[categoryKey].totalMeeshoCosts += creditDetails.costSharing.meeshoAmount;

      // Upsert monthly summary
      await pool.query(`
        INSERT INTO ngo_credit_financial_summary (
          month_year, total_transactions, total_credits_issued, total_avoided_costs,
          total_seller_costs, total_meesho_costs, total_seller_savings,
          category_breakdown, updated_at
        )
        VALUES ($1, 1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (month_year) DO UPDATE SET
          total_transactions = ngo_credit_financial_summary.total_transactions + 1,
          total_credits_issued = ngo_credit_financial_summary.total_credits_issued + $2,
          total_avoided_costs = ngo_credit_financial_summary.total_avoided_costs + $3,
          total_seller_costs = ngo_credit_financial_summary.total_seller_costs + $4,
          total_meesho_costs = ngo_credit_financial_summary.total_meesho_costs + $5,
          total_seller_savings = ngo_credit_financial_summary.total_seller_savings + $6,
          average_credit_amount = (ngo_credit_financial_summary.total_credits_issued + $2) / (ngo_credit_financial_summary.total_transactions + 1),
          average_seller_savings = (ngo_credit_financial_summary.total_seller_savings + $6) / (ngo_credit_financial_summary.total_transactions + 1),
          cost_efficiency_ratio = (ngo_credit_financial_summary.total_credits_issued + $2) / (ngo_credit_financial_summary.total_seller_costs + ngo_credit_financial_summary.total_meesho_costs + $4 + $5),
          category_breakdown = $7,
          updated_at = CURRENT_TIMESTAMP
      `, [
        monthYear,
        creditDetails.buyerCredit,
        creditDetails.avoidedCosts.total,
        creditDetails.costSharing.sellerAmount,
        creditDetails.costSharing.meeshoAmount,
        creditDetails.sellerBenefit.savings,
        JSON.stringify(categoryBreakdown)
      ]);

    } catch (error) {
      console.error('Error updating monthly summary:', error);
      // Don't throw error to avoid breaking the main transaction
    }
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(period = 'current_month') {
    try {
      let dateFilter = '';
      let monthYear = '';
      
      const now = new Date();
      
      switch (period) {
        case 'current_month':
          monthYear = now.toISOString().substring(0, 7);
          dateFilter = `WHERE month_year = '${monthYear}'`;
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          monthYear = lastMonth.toISOString().substring(0, 7);
          dateFilter = `WHERE month_year = '${monthYear}'`;
          break;
        case 'last_3_months':
          dateFilter = `WHERE month_year >= '${new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().substring(0, 7)}'`;
          break;
        case 'last_6_months':
          dateFilter = `WHERE month_year >= '${new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().substring(0, 7)}'`;
          break;
      }

      // Get summary data
      const summaryResult = await pool.query(`
        SELECT 
          COALESCE(SUM(total_transactions), 0) as total_transactions,
          COALESCE(SUM(total_credits_issued), 0) as total_credits_issued,
          COALESCE(SUM(total_avoided_costs), 0) as total_avoided_costs,
          COALESCE(SUM(total_seller_costs), 0) as total_seller_costs,
          COALESCE(SUM(total_meesho_costs), 0) as total_meesho_costs,
          COALESCE(SUM(total_seller_savings), 0) as total_seller_savings,
          COALESCE(AVG(average_credit_amount), 0) as average_credit_amount,
          COALESCE(AVG(cost_efficiency_ratio), 0) as cost_efficiency_ratio
        FROM ngo_credit_financial_summary 
        ${dateFilter}
      `);

      // Get monthly trends
      const trendsResult = await pool.query(`
        SELECT 
          month_year,
          total_transactions,
          total_credits_issued,
          total_seller_savings,
          average_credit_amount,
          cost_efficiency_ratio,
          category_breakdown
        FROM ngo_credit_financial_summary 
        ${dateFilter}
        ORDER BY month_year DESC
      `);

      // Get recent cost sharing records
      const recentTransactions = await pool.query(`
        SELECT 
          transaction_id,
          user_id,
          order_id,
          seller_id,
          buyer_credit_amount,
          seller_cost_amount,
          seller_savings,
          seller_savings_percentage,
          product_category,
          created_at
        FROM credit_cost_sharing 
        WHERE status = 'completed'
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      const summary = summaryResult.rows[0];
      
      return {
        success: true,
        analytics: {
          summary: {
            ...summary,
            total_platform_savings: parseFloat(summary.total_avoided_costs) - parseFloat(summary.total_credits_issued),
            seller_savings_rate: summary.total_avoided_costs > 0 ? 
              (parseFloat(summary.total_seller_savings) / parseFloat(summary.total_avoided_costs) * 100).toFixed(2) : 0
          },
          trends: trendsResult.rows,
          recentTransactions: recentTransactions.rows,
          period: period
        }
      };

    } catch (error) {
      console.error('Error getting financial analytics:', error);
      return {
        success: false,
        error: 'Failed to get analytics',
        message: error.message
      };
    }
  }

  /**
   * Get seller cost analysis
   */
  async getSellerCostAnalysis(sellerId, period = '30_days') {
    try {
      let dateFilter = '';
      
      switch (period) {
        case '7_days':
          dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case '30_days':
          dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case '90_days':
          dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
          break;
      }

      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_ngo_donations,
          SUM(buyer_credit_amount) as total_credits_issued,
          SUM(seller_cost_amount) as total_seller_costs,
          SUM(traditional_return_cost) as total_traditional_costs,
          SUM(seller_savings) as total_seller_savings,
          AVG(seller_savings_percentage) as average_savings_percentage,
          SUM(seller_cost_amount) / COUNT(*) as average_cost_per_donation,
          SUM(seller_savings) / COUNT(*) as average_savings_per_donation
        FROM credit_cost_sharing 
        WHERE seller_id = $1 AND status = 'completed' ${dateFilter}
      `, [sellerId]);

      const categoryBreakdown = await pool.query(`
        SELECT 
          product_category,
          COUNT(*) as transactions,
          SUM(seller_cost_amount) as total_costs,
          SUM(seller_savings) as total_savings,
          AVG(seller_savings_percentage) as avg_savings_percentage
        FROM credit_cost_sharing 
        WHERE seller_id = $1 AND status = 'completed' ${dateFilter}
        GROUP BY product_category
        ORDER BY total_costs DESC
      `, [sellerId]);

      return {
        success: true,
        analysis: {
          summary: result.rows[0],
          categoryBreakdown: categoryBreakdown.rows,
          period: period
        }
      };

    } catch (error) {
      console.error('Error getting seller cost analysis:', error);
      return {
        success: false,
        error: 'Failed to get seller analysis',
        message: error.message
      };
    }
  }
}

module.exports = CreditManagementService;