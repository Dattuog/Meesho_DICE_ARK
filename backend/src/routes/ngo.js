const express = require('express');
const router = express.Router();
const { NGO, Donation } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads (documents)
const upload = multer({
  dest: 'uploads/ngo-documents/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/**
 * @swagger
 * /api/v1/ngo/register:
 *   post:
 *     summary: Register a new NGO
 *     tags: [NGO]
 *     description: Allows NGOs to register for the donation program
 */
router.post('/register', upload.fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'taxExemptionCertificate', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      organizationName,
      registrationNumber,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      website,
      description,
      focusAreas,
      acceptedCategories,
      capacityLimit,
      operatingHours,
      establishedYear
    } = req.body;

    // Validate required fields
    if (!organizationName || !registrationNumber || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Parse arrays if they come as strings
    const parsedFocusAreas = typeof focusAreas === 'string' ? JSON.parse(focusAreas) : focusAreas;
    const parsedAcceptedCategories = typeof acceptedCategories === 'string' ? JSON.parse(acceptedCategories) : acceptedCategories;
    const parsedOperatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;

    // Generate NGO ID
    const ngoId = `NGO${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Prepare documents info
    const documents = {};
    if (req.files) {
      if (req.files.registrationCertificate) {
        documents.registrationCertificate = req.files.registrationCertificate[0].path;
      }
      if (req.files.taxExemptionCertificate) {
        documents.taxExemptionCertificate = req.files.taxExemptionCertificate[0].path;
      }
      if (req.files.addressProof) {
        documents.addressProof = req.files.addressProof[0].path;
      }
    }

    // Create NGO record
    // Prepare location data for database - handle empty strings
    const hasValidLocation = latitude && longitude && 
                           latitude.toString().trim() !== '' && 
                           longitude.toString().trim() !== '' &&
                           !isNaN(parseFloat(latitude)) && 
                           !isNaN(parseFloat(longitude));
    
    const locationData = hasValidLocation ? {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    } : null;

    const ngoData = {
      ngo_id: ngoId,
      name: organizationName,
      email,
      phone,
      address: {
        street: address,
        city,
        state,
        pincode
      },
      location: locationData,
      registration_number: registrationNumber,
      accepted_categories: parsedAcceptedCategories,
      capacity_limit: parseInt(capacityLimit) || 50,
      contact_person: contactPerson,
      bank_details: null, // Will be updated later
      verification_status: 'PENDING'
    };

    console.log('Creating NGO with data:', JSON.stringify(ngoData, null, 2));
    const ngo = new NGO();
    const result = await ngo.createNGO(ngoData);

    res.json({
      success: true,
      message: 'NGO registration submitted successfully. Your application is under review.',
      ngo: {
        ngoId: result.ngo_id,
        organizationName: result.organization_name,
        verificationStatus: result.verification_status,
        expectedReviewTime: '3-5 business days'
      }
    });

  } catch (error) {
    console.error('NGO registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      ngoData: JSON.stringify(ngoData, null, 2)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to register NGO',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/ngo/status/{ngoId}:
 *   get:
 *     summary: Check NGO application status
 *     tags: [NGO]
 */
router.get('/status/:ngoId', async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    const ngo = new NGO();
    const ngoData = await ngo.findByNgoId(ngoId);
    
    if (!ngoData) {
      return res.status(404).json({
        success: false,
        error: 'NGO not found'
      });
    }

    res.json({
      success: true,
      ngo: {
        ngoId: ngoData.ngo_id,
        organizationName: ngoData.organization_name,
        verificationStatus: ngoData.verification_status,
        registrationDate: ngoData.created_at,
        currentCapacity: ngoData.current_capacity,
        capacityLimit: ngoData.capacity_limit,
        acceptedCategories: ngoData.accepted_categories,
        isActive: ngoData.is_active
      }
    });

  } catch (error) {
    console.error('NGO status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check NGO status'
    });
  }
});

/**
 * @swagger
 * /api/v1/ngo/nearby:
 *   get:
 *     summary: Find nearby verified NGOs
 *     tags: [NGO]
 */
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 15, category } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const ngo = new NGO();
    const nearbyNGOs = await ngo.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius),
      category
    );

    res.json({
      success: true,
      ngos: nearbyNGOs.map(ngoData => ({
        ngoId: ngoData.ngo_id,
        organizationName: ngoData.organization_name,
        contactPerson: ngoData.contact_person,
        distance: `${ngoData.distance_km.toFixed(1)} km`,
        acceptedCategories: ngoData.accepted_categories,
        availableCapacity: ngoData.capacity_limit - ngoData.current_capacity,
        focusAreas: ngoData.focus_areas,
        operatingHours: ngoData.operating_hours,
        address: ngoData.address,
        city: ngoData.city
      })),
      count: nearbyNGOs.length,
      searchRadius: `${radius} km`
    });

  } catch (error) {
    console.error('Nearby NGOs search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby NGOs'
    });
  }
});

/**
 * @swagger
 * /api/v1/ngo/categories:
 *   get:
 *     summary: Get available product categories for NGO selection
 *     tags: [NGO]
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'clothing',
        name: 'Clothing & Apparel',
        description: 'Shirts, pants, dresses, shoes, accessories',
        icon: '👕'
      },
      {
        id: 'electronics',
        name: 'Electronics',
        description: 'Mobile phones, tablets, chargers, cables',
        icon: '📱'
      },
      {
        id: 'home-kitchen',
        name: 'Home & Kitchen',
        description: 'Cookware, appliances, home decor',
        icon: '🏠'
      },
      {
        id: 'books',
        name: 'Books & Stationery',
        description: 'Educational books, notebooks, school supplies',
        icon: '📚'
      },
      {
        id: 'toys',
        name: 'Toys & Games',
        description: 'Children toys, educational games, sports items',
        icon: '🧸'
      },
      {
        id: 'health-beauty',
        name: 'Health & Beauty',
        description: 'Personal care items, cosmetics (unopened)',
        icon: '💄'
      },
      {
        id: 'sports',
        name: 'Sports & Fitness',
        description: 'Exercise equipment, sports gear, outdoor items',
        icon: '⚽'
      }
    ];

    res.json({
      success: true,
      categories,
      message: 'Select categories your NGO can accept and distribute'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @swagger
 * /api/v1/ngo/update-capacity:
 *   post:
 *     summary: Update NGO capacity (for internal use)
 *     tags: [NGO]
 */
router.post('/update-capacity', async (req, res) => {
  try {
    const { ngoId, increment = 1 } = req.body;
    
    if (!ngoId) {
      return res.status(400).json({
        success: false,
        error: 'NGO ID is required'
      });
    }

    const ngo = new NGO();
    const result = await ngo.updateCapacity(ngoId, increment);
    
    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Unable to update capacity. NGO may be at full capacity.'
      });
    }

    res.json({
      success: true,
      message: 'Capacity updated successfully',
      currentCapacity: result.current_capacity,
      capacityLimit: result.capacity_limit,
      availableCapacity: result.capacity_limit - result.current_capacity
    });

  } catch (error) {
    console.error('Capacity update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update capacity'
    });
  }
});

/**
 * @swagger
 * /api/v1/ngo/profile/{ngoId}:
 *   put:
 *     summary: Update NGO profile
 *     tags: [NGO]
 */
router.put('/profile/:ngoId', async (req, res) => {
  try {
    const { ngoId } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via API
    delete updateData.verificationStatus;
    delete updateData.ngoId;
    delete updateData.currentCapacity;
    
    const ngo = new NGO();
    const existingNGO = await ngo.findByNgoId(ngoId);
    
    if (!existingNGO) {
      return res.status(404).json({
        success: false,
        error: 'NGO not found'
      });
    }

    // Update NGO profile
    const result = await ngo.update(existingNGO.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      ngo: {
        ngoId: result.ngo_id,
        organizationName: result.organization_name,
        contactPerson: result.contact_person,
        email: result.email,
        phone: result.phone
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;