const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend/public (including images)
const path = require('path');
app.use('/images', express.static(path.join(__dirname, '../../frontend/public/images')));
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/returns', require('./routes/returns'));
app.use('/api/v1/decision', require('./routes/decision'));
app.use('/api/v1/careconnect', require('./routes/careconnect'));
app.use('/api/v1/renewed', require('./routes/renewed'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/flash-sales', require('./routes/flashSales'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/ngo', require('./routes/ngo'));
app.use('/api/v1/credit', require('./routes/credit'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Meesho Rebound API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meesho Rebound API',
      version: '1.0.0',
      description: 'Hybrid Return & Re-commerce System for Meesho',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Meesho Rebound API server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;