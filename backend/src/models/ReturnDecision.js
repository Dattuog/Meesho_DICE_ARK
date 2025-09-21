const BaseModel = require('./BaseModel');

class ReturnDecision extends BaseModel {
  constructor() {
    super('return_decisions');
  }

  // Create return decision
  async createDecision(decisionData) {
    try {
      const {
        order_item_id,
        user_id,
        product_id,
        return_reason,
        item_condition,
        item_value,
        decision_path,
        decision_score,
        decision_factors,
        estimated_credit,
        estimated_resale_value,
        processing_cost_estimate
      } = decisionData;

      // Generate decision ID
      const decision_id = `DEC_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const query = `
        INSERT INTO return_decisions (
          decision_id, order_item_id, user_id, product_id, return_reason,
          item_condition, item_value, decision_path, decision_score,
          decision_factors, estimated_credit, estimated_resale_value,
          processing_cost_estimate
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        decision_id, order_item_id, user_id, product_id, return_reason,
        item_condition, item_value, decision_path, decision_score,
        typeof decision_factors === 'object' ? JSON.stringify(decision_factors) : decision_factors,
        estimated_credit, estimated_resale_value, processing_cost_estimate
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating return decision:', error);
      throw error;
    }
  }

  // Update user choice
  async updateUserChoice(decisionId, userChoice) {
    try {
      const query = `
        UPDATE return_decisions 
        SET user_choice = $1, updated_at = NOW()
        WHERE decision_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [userChoice, decisionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user choice:', error);
      throw error;
    }
  }

  // Complete decision
  async completeDecision(decisionId, outcome, revenueImpact = 0, costSavings = 0) {
    try {
      const query = `
        UPDATE return_decisions 
        SET 
          final_outcome = $1,
          revenue_impact = $2,
          cost_savings = $3,
          completed_at = NOW()
        WHERE decision_id = $4
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [outcome, revenueImpact, costSavings, decisionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error completing decision:', error);
      throw error;
    }
  }

  // Get decision analytics
  async getDecisionAnalytics(dateFrom, dateTo) {
    try {
      const query = `
        SELECT 
          decision_path,
          COUNT(*) as total_decisions,
          AVG(item_value) as avg_item_value,
          SUM(COALESCE(revenue_impact, 0)) as total_revenue_impact,
          SUM(COALESCE(cost_savings, 0)) as total_cost_savings,
          AVG(decision_score) as avg_decision_score
        FROM return_decisions
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY decision_path
        ORDER BY total_decisions DESC
      `;
      
      const result = await this.pool.query(query, [dateFrom, dateTo]);
      return result.rows;
    } catch (error) {
      console.error('Error getting decision analytics:', error);
      throw error;
    }
  }

  // Find by decision ID
  async findByDecisionId(decisionId) {
    try {
      const query = `
        SELECT 
          rd.*,
          oi.quantity,
          oi.unit_price,
          p.name as product_name,
          p.category,
          p.brand,
          u.user_id,
          u.name as customer_name
        FROM return_decisions rd
        JOIN order_items oi ON rd.order_item_id = oi.id
        JOIN products p ON rd.product_id = p.id
        JOIN users u ON rd.user_id = u.id
        WHERE rd.decision_id = $1
      `;
      
      const result = await this.pool.query(query, [decisionId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding decision by ID:', error);
      throw error;
    }
  }
}

module.exports = ReturnDecision;