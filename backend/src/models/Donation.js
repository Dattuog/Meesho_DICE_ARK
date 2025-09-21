const BaseModel = require('./BaseModel');

class Donation extends BaseModel {
  constructor() {
    super('donations');
  }

  // Create new donation
  async createDonation(donationData) {
    try {
      const {
        order_item_id,
        user_id,
        ngo_id,
        original_item_value,
        credit_given,
        pickup_scheduled_at,
        logistics_cost = 0,
        tax_benefit_amount = 0
      } = donationData;

      // Generate donation ID
      const donation_id = `DON_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const query = `
        INSERT INTO donations (
          donation_id, order_item_id, user_id, ngo_id, original_item_value,
          credit_given, pickup_scheduled_at, logistics_cost, tax_benefit_amount,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'INITIATED')
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        donation_id, order_item_id, user_id, ngo_id, original_item_value,
        credit_given, pickup_scheduled_at, logistics_cost, tax_benefit_amount
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  }

  // Update donation status
  async updateStatus(donationId, status, additionalData = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let setClause = 'status = $1, updated_at = NOW()';
      let params = [status, donationId];
      let paramIndex = 3;

      // Add additional fields based on status
      if (status === 'PICKUP_COMPLETED' && additionalData.pickup_completed_at) {
        setClause += `, pickup_completed_at = $${paramIndex}`;
        params.splice(-1, 0, additionalData.pickup_completed_at);
        paramIndex++;
      }

      if (status === 'DELIVERED_TO_NGO' && additionalData.delivered_to_ngo_at) {
        setClause += `, delivered_to_ngo_at = $${paramIndex}`;
        params.splice(-1, 0, additionalData.delivered_to_ngo_at);
        paramIndex++;
      }

      if (additionalData.impact_report) {
        setClause += `, impact_report = $${paramIndex}`;
        params.splice(-1, 0, typeof additionalData.impact_report === 'object' 
          ? JSON.stringify(additionalData.impact_report) 
          : additionalData.impact_report);
        paramIndex++;
      }

      const query = `
        UPDATE donations 
        SET ${setClause}
        WHERE donation_id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, params);
      
      // If delivered to NGO, update NGO capacity
      if (status === 'DELIVERED_TO_NGO' && result.rows[0]) {
        const donation = result.rows[0];
        await client.query(
          'UPDATE ngos SET current_capacity = current_capacity + 1 WHERE id = $1',
          [donation.ngo_id]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating donation status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Find donation by ID
  async findByDonationId(donationId) {
    try {
      const query = `
        SELECT 
          d.*,
          oi.quantity,
          oi.unit_price,
          p.name as product_name,
          p.category,
          p.brand,
          p.images,
          u.user_id,
          u.name as customer_name,
          u.email as customer_email,
          n.name as ngo_name,
          n.address as ngo_address,
          n.contact_person
        FROM donations d
        JOIN order_items oi ON d.order_item_id = oi.id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN ngos n ON d.ngo_id = n.id
        WHERE d.donation_id = $1
      `;
      
      const result = await this.pool.query(query, [donationId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding donation by ID:', error);
      throw error;
    }
  }

  // Get user donations
  async getUserDonations(userId) {
    try {
      const query = `
        SELECT 
          d.*,
          p.name as product_name,
          p.category,
          p.brand,
          p.images,
          n.name as ngo_name,
          n.ngo_id
        FROM donations d
        JOIN order_items oi ON d.order_item_id = oi.id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN ngos n ON d.ngo_id = n.id
        WHERE u.user_id = $1
        ORDER BY d.created_at DESC
      `;
      
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user donations:', error);
      throw error;
    }
  }

  // Get NGO donations
  async getNGODonations(ngoId, status = null) {
    try {
      let query = `
        SELECT 
          d.*,
          p.name as product_name,
          p.category,
          p.brand,
          p.images,
          u.name as donor_name,
          u.user_id as donor_id
        FROM donations d
        JOIN order_items oi ON d.order_item_id = oi.id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON d.user_id = u.id
        JOIN ngos n ON d.ngo_id = n.id
        WHERE n.ngo_id = $1
      `;
      
      const params = [ngoId];
      if (status) {
        query += ' AND d.status = $2';
        params.push(status);
      }
      
      query += ' ORDER BY d.created_at DESC';
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting NGO donations:', error);
      throw error;
    }
  }

  // Get donation analytics
  async getDonationAnalytics(dateFrom, dateTo) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_donations,
          SUM(original_item_value) as total_item_value,
          SUM(credit_given) as total_credits_given,
          SUM(logistics_cost) as total_logistics_cost,
          AVG(credit_given) as avg_credit_per_donation,
          COUNT(CASE WHEN status = 'DELIVERED_TO_NGO' THEN 1 END) as completed_donations,
          COUNT(DISTINCT ngo_id) as unique_ngos_served,
          COUNT(DISTINCT user_id) as unique_donors
        FROM donations
        WHERE created_at >= $1 AND created_at <= $2
      `;
      
      const result = await this.pool.query(query, [dateFrom, dateTo]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting donation analytics:', error);
      throw error;
    }
  }
}

module.exports = Donation;