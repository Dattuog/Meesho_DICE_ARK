const BaseModel = require('./BaseModel');

class NGO extends BaseModel {
  constructor() {
    super('ngos');
  }

  // Find NGO by ngo_id (external ID)
  async findByNgoId(ngoId) {
    try {
      const query = 'SELECT * FROM ngos WHERE ngo_id = $1 AND is_active = true';
      const result = await this.pool.query(query, [ngoId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding NGO by ngo_id:', error);
      throw error;
    }
  }

  // Find nearby NGOs
  async findNearby(latitude, longitude, radiusKm = 15, category = null) {
    try {
      let query = `
        SELECT *,
          (6371 * acos(
            cos(radians($1)) * cos(radians(ST_Y(location))) *
            cos(radians(ST_X(location)) - radians($2)) +
            sin(radians($1)) * sin(radians(ST_Y(location)))
          )) AS distance_km
        FROM ngos
        WHERE 
          is_active = true 
          AND verification_status = 'VERIFIED'
          AND current_capacity < capacity_limit
      `;
      
      const params = [latitude, longitude];
      let paramIndex = 3;

      if (category) {
        query += ` AND $${paramIndex} = ANY(accepted_categories)`;
        params.push(category);
        paramIndex++;
      }

      query += `
        HAVING distance_km <= $${paramIndex}
        ORDER BY distance_km, (capacity_limit - current_capacity) DESC
        LIMIT 10
      `;
      params.push(radiusKm);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding nearby NGOs:', error);
      throw error;
    }
  }

  // Update NGO capacity
  async updateCapacity(ngoId, increment = 1) {
    try {
      const query = `
        UPDATE ngos 
        SET 
          current_capacity = current_capacity + $1,
          updated_at = NOW()
        WHERE ngo_id = $2 AND current_capacity + $1 <= capacity_limit
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [increment, ngoId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating NGO capacity:', error);
      throw error;
    }
  }

  // Get NGOs by verification status
  async findByVerificationStatus(status = 'VERIFIED') {
    try {
      const query = `
        SELECT * FROM ngos 
        WHERE verification_status = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await this.pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding NGOs by verification status:', error);
      throw error;
    }
  }

  // Create new NGO
  async createNGO(ngoData) {
    try {
      const {
        ngo_id,
        name,
        email,
        phone,
        address,
        location,
        registration_number,
        accepted_categories,
        capacity_limit = 100,
        contact_person,
        bank_details,
        verification_status = 'PENDING'
      } = ngoData;

      let query, params;
      
      if (location && location.latitude && location.longitude) {
        query = `
          INSERT INTO ngos (
            ngo_id, name, email, phone, address, location, registration_number,
            accepted_categories, capacity_limit, contact_person, bank_details,
            verification_status
          )
          VALUES ($1, $2, $3, $4, $5, POINT($6, $7), $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
        
        params = [
          ngo_id, name, email, phone,
          typeof address === 'object' ? JSON.stringify(address) : address,
          location.longitude, location.latitude,
          registration_number,
          Array.isArray(accepted_categories) ? accepted_categories : [],
          capacity_limit, contact_person,
          typeof bank_details === 'object' ? JSON.stringify(bank_details) : bank_details,
          verification_status
        ];
      } else {
        query = `
          INSERT INTO ngos (
            ngo_id, name, email, phone, address, location, registration_number,
            accepted_categories, capacity_limit, contact_person, bank_details,
            verification_status
          )
          VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        params = [
          ngo_id, name, email, phone,
          typeof address === 'object' ? JSON.stringify(address) : address,
          registration_number,
          Array.isArray(accepted_categories) ? accepted_categories : [],
          capacity_limit, contact_person,
          typeof bank_details === 'object' ? JSON.stringify(bank_details) : bank_details,
          verification_status
        ];
      }
      
      const result = await this.pool.query(query, params);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating NGO:', error);
      throw error;
    }
  }

  // Update verification status
  async updateVerificationStatus(ngoId, status) {
    try {
      const query = `
        UPDATE ngos 
        SET verification_status = $1, updated_at = NOW()
        WHERE ngo_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [status, ngoId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }

  // Update impact metrics
  async updateImpactMetrics(ngoId, metrics) {
    try {
      const query = `
        UPDATE ngos 
        SET 
          impact_metrics = $1,
          updated_at = NOW()
        WHERE ngo_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        typeof metrics === 'object' ? JSON.stringify(metrics) : metrics,
        ngoId
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating impact metrics:', error);
      throw error;
    }
  }
}

module.exports = NGO;