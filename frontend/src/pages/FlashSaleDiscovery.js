import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Zap, Filter, Heart, Share2, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import notificationService from '../services/notificationService';
import ProductImage from '../components/ProductImage';

const FlashSaleDiscovery = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    categories: [],
    sortBy: 'distance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchFlashSales();
      checkNotificationStatus();
    }
  }, [userLocation, filters]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Bangalore coordinates
          setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
          toast.error('Unable to get your location. Showing results for Bangalore.');
        }
      );
    } else {
      setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
      toast.error('Geolocation not supported. Showing results for Bangalore.');
    }
  };

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/flash-sales/nearby', {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
          sortBy: filters.sortBy
        }
      });

      // Mock data for demonstration since backend endpoint might not exist yet
      const mockFlashSales = [
        {
          flash_sale_id: 'fs_001',
          order_item_id: 'item_001',
          product_name: 'Boult Audio AirBass Propods TWS Earbuds',
          brand: 'Boult Audio',
          original_price: 2999,
          flash_sale_price: 1299,
          image_urls: ['https://images.meesho.com/images/products/123456/1_512.jpg'],
          condition: 'Like New',
          return_reason: 'Size mismatch',
          distance: 1.2,
          time_left: '2h 45m',
          seller_location: 'Koramangala, Bangalore',
          savings: 1700,
          created_at: new Date().toISOString()
        },
        {
          flash_sale_id: 'fs_002',
          order_item_id: 'item_002',
          product_name: 'Roadster Casual Shirt',
          brand: 'Roadster',
          original_price: 1299,
          flash_sale_price: 649,
          image_urls: ['https://images.meesho.com/images/products/234567/1_512.jpg'],
          condition: 'Excellent',
          return_reason: 'Wrong size',
          distance: 2.8,
          time_left: '1h 20m',
          seller_location: 'HSR Layout, Bangalore',
          savings: 650,
          created_at: new Date().toISOString()
        },
        {
          flash_sale_id: 'fs_003',
          order_item_id: 'item_003',
          product_name: 'Nike Air Max Sneakers',
          brand: 'Nike',
          original_price: 7999,
          flash_sale_price: 4999,
          image_urls: ['https://images.meesho.com/images/products/345678/1_512.jpg'],
          condition: 'Like New',
          return_reason: 'Color not as expected',
          distance: 3.5,
          time_left: '45m',
          seller_location: 'Indiranagar, Bangalore',
          savings: 3000,
          created_at: new Date().toISOString()
        }
      ];

      setFlashSales(response.data?.flashSales || mockFlashSales);
    } catch (error) {
      console.error('Failed to fetch flash sales:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationStatus = async () => {
    const hasPermission = await notificationService.requestPermission();
    setNotificationsEnabled(hasPermission);
  };

  const enableNotifications = async () => {
    try {
      await notificationService.subscribeToFlashSales(userLocation);
      notificationService.startFlashSalePolling(userLocation);
      setNotificationsEnabled(true);
      toast.success('🔔 Flash sale notifications enabled!');
    } catch (error) {
      toast.error('Failed to enable notifications');
    }
  };

  const handleClaimFlashSale = async (flashSaleId) => {
    try {
      const response = await api.post(`/api/v1/flash-sales/${flashSaleId}/claim`);
      toast.success('🎉 Flash sale item claimed! Check your orders.');
      fetchFlashSales(); // Refresh list
    } catch (error) {
      toast.error('Failed to claim flash sale item');
    }
  };

  const formatTimeLeft = (timeLeft) => {
    return timeLeft || 'Ending soon';
  };

  const calculateSavings = (original, flashPrice) => {
    return Math.round(((original - flashPrice) / original) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Finding flash sales near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Platform optimized range</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!notificationsEnabled && (
                <button
                  onClick={enableNotifications}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <span className="text-sm font-medium">🔔 Enable Alerts</span>
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="distance">Distance</option>
                  <option value="price">Price: Low to High</option>
                  <option value="savings">Best Savings</option>
                  <option value="time">Time Left</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="500"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: { ...prev.priceRange, max: parseInt(e.target.value) }
                  }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">₹{filters.priceRange.max}</div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Flash Sales Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {flashSales.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Flash Sales Found</h3>
            <p className="text-gray-600">Check back later for new flash sales in your area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashSales.map((sale, index) => (
              <motion.div
                key={sale.flash_sale_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image and Timer */}
                <div className="relative">
                  <div className="aspect-square overflow-hidden">
                    <ProductImage
                      src={sale.image_urls?.[0]}
                      productId={sale.local_product_id}
                      alt={sale.product_name}
                      className="w-full h-full"
                      showFallbackIcon={true}
                      lazy={true}
                    />
                  </div>
                  
                  {/* Timer Badge */}
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft(sale.time_left)}</span>
                  </div>
                  
                  {/* Savings Badge */}
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {calculateSavings(sale.original_price, sale.flash_sale_price)}% OFF
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">
                      {sale.product_name}
                    </h3>
                    <p className="text-gray-600 text-sm">{sale.brand}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{sale.flash_sale_price}</span>
                      <span className="text-lg text-gray-500 line-through">₹{sale.original_price}</span>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      Save ₹{sale.original_price - sale.flash_sale_price}
                    </div>
                  </div>

                  {/* Condition and Location */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-medium text-green-600">{sale.condition}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{sale.distance}km away • {typeof sale.seller_location === 'object' ? sale.seller_location.address : sale.seller_location}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleClaimFlashSale(sale.flash_sale_id)}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      Claim Now
                    </button>
                    <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Location */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={getUserLocation}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
      >
        <Navigation className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default FlashSaleDiscovery;