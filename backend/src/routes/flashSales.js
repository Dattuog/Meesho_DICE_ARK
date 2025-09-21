const express = require('express');
const router = express.Router();
const { FlashSale } = require('../models');

// Get nearby flash sales based on user location
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, limit = 20, sortBy = 'distance' } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Platform-controlled distance algorithm
    // Determines optimal radius based on various factors:
    // - Urban areas: 2-5km radius
    // - Suburban areas: 5-15km radius  
    // - Rural areas: 15-25km radius
    // - Item value: Higher value items can have larger radius
    // - Population density: More dense areas have smaller radius
    
    const platformRadius = calculateOptimalRadius(parseFloat(latitude), parseFloat(longitude));

    // Mock flash sales data with local product IDs for image handling
    const mockFlashSales = [
      {
        flash_sale_id: 'fs_001',
        order_item_id: 'item_001',
        product_id: 7,
        local_product_id: 'product_7', // For local image mapping
        product_name: 'Sony Wireless Bluetooth Headphones',
        brand: 'Sony',
        original_price: 2999,
        flash_sale_price: 1299,
        image_urls: [],
        condition: 'Like New',
        return_reason: 'Size mismatch',
        seller_location: {
          latitude: parseFloat(latitude) + 0.01,
          longitude: parseFloat(longitude) + 0.01,
          address: 'Koramangala, Bangalore'
        },
        distance: 1.2,
        time_left: '2h 45m',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      },
      {
        flash_sale_id: 'fs_002',
        order_item_id: 'item_002',
        product_id: 6,
        local_product_id: 'product_6', // For local image mapping
        product_name: 'Adidas Casual T-Shirt - Premium Cotton',
        brand: 'Adidas',
        original_price: 1299,
        flash_sale_price: 649,
        image_urls: [
          'https://images.meesho.com/images/products/12345678/tshirt_512.webp',
          'https://images.meesho.com/images/products/12345678/tshirt2_512.webp'
        ],
        condition: 'Excellent',
        return_reason: 'Wrong size',
        seller_location: {
          latitude: parseFloat(latitude) + 0.02,
          longitude: parseFloat(longitude) - 0.01,
          address: 'HSR Layout, Bangalore'
        },
        distance: 2.8,
        time_left: '1h 20m',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      },
      {
        flash_sale_id: 'fs_003',
        order_item_id: 'item_003',
        product_id: 8,
        local_product_id: 'product_8', // For local image mapping
        product_name: 'Kitchen Blender - High Power Multi-function',
        brand: 'KitchenPro',
        original_price: 2999,
        flash_sale_price: 1499,
        image_urls: [],
        condition: 'Like New',
        return_reason: 'Color not as expected',
        seller_location: {
          latitude: parseFloat(latitude) - 0.01,
          longitude: parseFloat(longitude) + 0.02,
          address: 'Indiranagar, Bangalore'
        },
        distance: 3.5,
        time_left: '45m',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 0.75 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      }
    ];

    // Filter by platform-determined radius (not user-controlled)
    let filteredSales = mockFlashSales.filter(sale => sale.distance <= platformRadius);

    // Sort based on sortBy parameter
    switch (sortBy) {
      case 'price':
        filteredSales.sort((a, b) => a.flash_sale_price - b.flash_sale_price);
        break;
      case 'savings':
        filteredSales.sort((a, b) => 
          (b.original_price - b.flash_sale_price) - (a.original_price - a.flash_sale_price)
        );
        break;
      case 'time':
        filteredSales.sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
        break;
      case 'distance':
      default:
        filteredSales.sort((a, b) => a.distance - b.distance);
        break;
    }

    // Limit results
    filteredSales = filteredSales.slice(0, parseInt(limit));

    res.json({
      success: true,
      flashSales: filteredSales,
      count: filteredSales.length,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        platformRadius: platformRadius,
        algorithm: 'smart_distance_v1'
      }
    });
  } catch (error) {
    console.error('Error fetching nearby flash sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby flash sales'
    });
  }
});

// Get flash sale details by ID
router.get('/:flashSaleId', async (req, res) => {
  try {
    const { flashSaleId } = req.params;
    
    // Mock flash sale detail
    const mockFlashSale = {
      flash_sale_id: flashSaleId,
      order_item_id: 'item_001',
      product_name: 'Boult Audio AirBass Propods TWS Earbuds',
      brand: 'Boult Audio',
      original_price: 2999,
      flash_sale_price: 1299,
      image_urls: [
        'https://images.meesho.com/images/products/123456/1_512.jpg',
        'https://images.meesho.com/images/products/123456/2_512.jpg'
      ],
      condition: 'Like New',
      return_reason: 'Size mismatch',
      description: 'Excellent condition wireless earbuds with active noise cancellation.',
      seller_info: {
        name: 'Priya S.',
        rating: 4.8,
        total_sales: 23,
        location: 'Koramangala, Bangalore'
      },
      seller_location: {
        latitude: 12.9351,
        longitude: 77.6245,
        address: 'Koramangala, Bangalore'
      },
      distance: 1.2,
      time_left: '2h 45m',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      interested_count: 5,
      views: 23
    };

    res.json({
      success: true,
      flashSale: mockFlashSale
    });
  } catch (error) {
    console.error('Error fetching flash sale details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flash sale details'
    });
  }
});

// Claim a flash sale item
router.post('/:flashSaleId/claim', async (req, res) => {
  try {
    const { flashSaleId } = req.params;
    const { buyerId = 'USER001' } = req.body;

    // In a real implementation, you would:
    // 1. Check if flash sale is still active
    // 2. Check if buyer meets requirements
    // 3. Create order/transaction
    // 4. Update flash sale status
    // 5. Notify seller

    // Mock successful claim
    const claimResult = {
      flash_sale_id: flashSaleId,
      buyer_id: buyerId,
      claimed_at: new Date().toISOString(),
      order_id: `ORD_${Date.now()}`,
      status: 'CLAIMED',
      pickup_instructions: {
        contact_seller: true,
        pickup_window: '2 hours',
        location: 'Koramangala, Bangalore'
      }
    };

    res.json({
      success: true,
      message: 'Flash sale item claimed successfully!',
      claim: claimResult
    });
  } catch (error) {
    console.error('Error claiming flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim flash sale item'
    });
  }
});

// Express interest in a flash sale
router.post('/:flashSaleId/interest', async (req, res) => {
  try {
    const { flashSaleId } = req.params;
    const { userId = 'USER001' } = req.body;

    // Mock interest recording
    res.json({
      success: true,
      message: 'Interest recorded successfully!',
      flash_sale_id: flashSaleId,
      user_id: userId,
      interested_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording interest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record interest'
    });
  }
});

// Create a new flash sale (called by decision engine)
router.post('/', async (req, res) => {
  try {
    const {
      order_item_id,
      product_name,
      brand,
      original_price,
      flash_sale_price,
      image_urls,
      condition,
      return_reason,
      seller_location,
      expires_in_hours = 6
    } = req.body;

    const flashSaleId = `fs_${Date.now()}`;
    const expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);

    // Create flash sale record
    const flashSale = {
      flash_sale_id: flashSaleId,
      order_item_id,
      product_name,
      brand,
      original_price,
      flash_sale_price,
      image_urls,
      condition,
      return_reason,
      seller_location,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'ACTIVE'
    };

    // In a real implementation, save to database
    // await FlashSale.create(flashSale);

    // Trigger notifications to nearby users
    await triggerFlashSaleNotifications(flashSale);

    res.json({
      success: true,
      message: 'Flash sale created successfully!',
      flashSale
    });
  } catch (error) {
    console.error('Error creating flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flash sale'
    });
  }
});

// Helper function to trigger notifications
async function triggerFlashSaleNotifications(flashSale) {
  try {
    // In a real implementation, you would:
    // 1. Query users within radius of seller_location
    // 2. Filter by user preferences (price range, categories, etc.)
    // 3. Send push notifications
    // 4. Log notification events

    console.log(`Triggering flash sale notifications for ${flashSale.flash_sale_id}`);
    
    // Mock notification trigger
    const notificationPayload = {
      type: 'FLASH_SALE',
      flash_sale_id: flashSale.flash_sale_id,
      title: '🚀 Flash Sale Alert!',
      message: `${flashSale.product_name} is available nearby for ₹${flashSale.flash_sale_price} (was ₹${flashSale.original_price})`,
      data: {
        flashSaleId: flashSale.flash_sale_id,
        productName: flashSale.product_name,
        flashSalePrice: flashSale.flash_sale_price,
        originalPrice: flashSale.original_price,
        sellerLocation: flashSale.seller_location
      }
    };

    // Log notification (in real app, save to database and send via push service)
    console.log('Flash sale notification payload:', notificationPayload);
    
  } catch (error) {
    console.error('Error triggering flash sale notifications:', error);
  }
}

// Platform-controlled distance algorithm
function calculateOptimalRadius(latitude, longitude) {
  // Meesho's smart distance algorithm that considers multiple factors
  
  // Base radius determination based on location type
  let baseRadius = 5; // Default 5km for urban areas
  
  // Check if location is in major metropolitan areas (simplified)
  const majorCities = [
    { lat: 12.9716, lng: 77.5946, radius: 3 }, // Bangalore - dense urban
    { lat: 19.0760, lng: 72.8777, radius: 4 }, // Mumbai - very dense
    { lat: 28.7041, lng: 77.1025, radius: 4 }, // Delhi - dense
    { lat: 22.5726, lng: 88.3639, radius: 5 }, // Kolkata
    { lat: 13.0827, lng: 80.2707, radius: 4 }, // Chennai
    { lat: 17.3850, lng: 78.4867, radius: 5 }  // Hyderabad
  ];
  
  // Find nearest major city and adjust radius
  let nearestCityRadius = baseRadius;
  let minDistance = Infinity;
  
  majorCities.forEach(city => {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCityRadius = city.radius;
    }
  });
  
  // If within 50km of a major city, use that city's radius
  if (minDistance < 50) {
    baseRadius = nearestCityRadius;
  } else {
    // Rural/suburban area - increase radius
    baseRadius = Math.min(15, baseRadius + Math.floor(minDistance / 50) * 2);
  }
  
  // Additional factors that could influence radius:
  // - Time of day (peak hours might have smaller radius)
  // - Item category (electronics might have larger radius than clothing)
  // - Historical success rate in the area
  // - Current inventory levels
  
  const currentHour = new Date().getHours();
  if (currentHour >= 18 && currentHour <= 22) {
    // Peak evening hours - slightly larger radius for better matches
    baseRadius *= 1.2;
  }
  
  // Ensure radius is within platform limits
  return Math.max(2, Math.min(25, Math.round(baseRadius)));
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;