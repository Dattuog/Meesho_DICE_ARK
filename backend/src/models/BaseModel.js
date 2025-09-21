// Base Model Class for database operations
const { pool } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  // Generic find by ID
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by id:`, error);
      throw error;
    }
  }

  // Generic find all
  async findAll(limit = 100, offset = 0) {
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      const result = await this.pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic create
  async create(data) {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(data);

      const query = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic update
  async update(id, data) {
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = [id, ...Object.values(data)];

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic delete
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
      const result = await this.pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic find by custom criteria
  async findBy(criteria, limit = 100) {
    try {
      const whereClause = Object.keys(criteria)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      const values = Object.values(criteria);

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by criteria:`, error);
      throw error;
    }
  }

  // Execute raw query
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error(`Error executing query on ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = BaseModel;