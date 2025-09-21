const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  // Find product by product_id (external ID)
  async findByProductId(productId) {
    try {
      const query = 'SELECT * FROM products WHERE product_id = $1 AND is_active = true';
      const result = await this.pool.query(query, [productId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding product by product_id:', error);
      throw error;
    }
  }

  // Find products by category
  async findByCategory(category, limit = 50) {
    try {
      const query = `
        SELECT * FROM products 
        WHERE category = $1 AND is_active = true 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await this.pool.query(query, [category, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding products by category:', error);
      throw error;
    }
  }

  // Search products
  async search(searchTerm, limit = 50) {
    try {
      const query = `
        SELECT * FROM products 
        WHERE (
          LOWER(name) LIKE LOWER($1) OR 
          LOWER(brand) LIKE LOWER($1) OR 
          LOWER(category) LIKE LOWER($1) OR
          $1 = ANY(tags)
        ) AND is_active = true
        ORDER BY 
          CASE 
            WHEN LOWER(name) LIKE LOWER($1) THEN 1
            WHEN LOWER(brand) LIKE LOWER($1) THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT $2
      `;
      const searchPattern = `%${searchTerm}%`;
      const result = await this.pool.query(query, [searchPattern, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get renewed products
  async getRenewedProducts(limit = 50, grade = null) {
    try {
      let query = `
        SELECT 
          ri.*,
          p.name as original_product_name,
          p.category,
          p.brand,
          p.images as original_images,
          ri.new_images as renewed_images,
          ri.listed_price,
          ri.original_price,
          ROUND(((ri.original_price - ri.listed_price) / ri.original_price * 100), 0) as discount_percentage
        FROM renewed_inventory ri
        JOIN products p ON ri.original_order_item_id IN (
          SELECT oi.id FROM order_items oi WHERE oi.product_id = p.id
        )
        WHERE ri.status = 'LISTED'
      `;
      
      const params = [];
      if (grade) {
        query += ' AND ri.grade = $1';
        params.push(grade);
      }
      
      query += ' ORDER BY ri.listed_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting renewed products:', error);
      throw error;
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      const {
        product_id,
        name,
        category,
        subcategory,
        brand,
        original_price,
        images,
        specifications,
        tags
      } = productData;

      const query = `
        INSERT INTO products (
          product_id, name, category, subcategory, brand, 
          original_price, images, specifications, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        product_id, name, category, subcategory, brand,
        original_price,
        Array.isArray(images) ? JSON.stringify(images) : images,
        typeof specifications === 'object' ? JSON.stringify(specifications) : specifications,
        Array.isArray(tags) ? tags : []
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update product status
  async updateStatus(productId, isActive) {
    try {
      const query = `
        UPDATE products 
        SET is_active = $1, updated_at = NOW()
        WHERE product_id = $2
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [isActive, productId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  }
}

module.exports = Product;