const express = require('express');
const router = express.Router();

// Simple auth for demo - in production use proper JWT implementation
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo login - accept any email/password
  const mockUser = {
    id: 'demo_user_1',
    email: email || 'demo@meesho.com',
    name: 'Demo Customer',
    type: email?.includes('admin') ? 'admin' : 'customer'
  };

  res.json({
    success: true,
    user: mockUser,
    token: 'demo_token_' + Date.now() // Mock JWT token
  });
});

router.get('/profile', (req, res) => {
  // Mock profile data
  res.json({
    success: true,
    user: {
      id: 'demo_user_1',
      email: 'demo@meesho.com',
      name: 'Demo Customer',
      phone: '+91-9876543210',
      walletBalance: 150.00,
      totalDonations: 2,
      totalOrders: 15,
      joinedDate: '2023-01-15'
    }
  });
});

module.exports = router;