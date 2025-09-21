import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  MapPin, 
  DollarSign, 
  Clock, 
  Settings,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import notificationService from '../services/notificationService';

const NotificationManagement = () => {
  const [preferences, setPreferences] = useState({
    flashSalesEnabled: true,
    priceRange: { min: 0, max: 10000 },
    categories: [],
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'home', name: 'Home & Kitchen', icon: '🏠' },
    { id: 'beauty', name: 'Beauty & Personal Care', icon: '💄' },
    { id: 'sports', name: 'Sports & Fitness', icon: '⚽' },
    { id: 'books', name: 'Books & Media', icon: '📚' }
  ];

  useEffect(() => {
    loadPreferences();
    loadNotificationHistory();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prev => ({ ...prev, ...prefs }));
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const history = await notificationService.getNotificationHistory();
      // Mock data for demonstration
      const mockHistory = [
        {
          id: 'notif_001',
          type: 'FLASH_SALE',
          title: '🚀 Flash Sale Alert!',
          message: 'Boult Audio AirBass Propods TWS Earbuds is available nearby (1.2km away) for ₹1299 (was ₹2999)',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: false,
          clicked: false,
          data: {
            flashSaleId: 'fs_001',
            itemName: 'Boult Audio AirBass Propods TWS Earbuds',
            distance: 1.2,
            price: 1299,
            originalPrice: 2999
          }
        },
        {
          id: 'notif_002',
          type: 'FLASH_SALE',
          title: '🚀 Flash Sale Alert!',
          message: 'Roadster Casual Shirt is available nearby (2.8km away) for ₹649 (was ₹1299)',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          read: true,
          clicked: true,
          data: {
            flashSaleId: 'fs_002',
            itemName: 'Roadster Casual Shirt',
            distance: 2.8,
            price: 649,
            originalPrice: 1299
          }
        },
        {
          id: 'notif_003',
          type: 'FLASH_SALE',
          title: '🚀 Flash Sale Alert!',
          message: 'Nike Air Max Sneakers is available nearby (3.5km away) for ₹4999 (was ₹7999)',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: true,
          clicked: false,
          data: {
            flashSaleId: 'fs_003',
            itemName: 'Nike Air Max Sneakers',
            distance: 3.5,
            price: 4999,
            originalPrice: 7999
          }
        }
      ];
      
      setNotificationHistory(history.length > 0 ? history : mockHistory);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await notificationService.updateNotificationPreferences(preferences);
      toast.success('Notification preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const clearAllNotifications = () => {
    setNotificationHistory([]);
    toast.success('All notifications cleared');
  };

  const markAsRead = (notificationId) => {
    setNotificationHistory(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (notificationId) => {
    setNotificationHistory(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
    toast.success('Notification deleted');
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600">Manage your flash sale alerts and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preferences Panel */}
          <div className="space-y-6">
            {/* Flash Sale Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Bell className="h-6 w-6 text-purple-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Flash Sale Alerts</h2>
                    <p className="text-gray-600 text-sm">Get notified about new flash sales near you</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, flashSalesEnabled: !prev.flashSalesEnabled }))}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                    preferences.flashSalesEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    preferences.flashSalesEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {preferences.flashSalesEnabled && (
                <div className="space-y-4">
                  {/* Platform Distance Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Smart Distance Matching</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Our platform automatically determines the optimal distance range for flash sale alerts based on your location, item availability, and logistics efficiency. You'll only receive notifications for items that make sense for you to collect.
                    </p>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Price Range: ₹{preferences.priceRange.min} - ₹{preferences.priceRange.max}</span>
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="20000"
                          step="500"
                          value={preferences.priceRange.min}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: parseInt(e.target.value) }
                          }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-gray-500 mt-1">Min: ₹{preferences.priceRange.min}</div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="20000"
                          step="500"
                          value={preferences.priceRange.max}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: parseInt(e.target.value) }
                          }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-gray-500 mt-1">Max: ₹{preferences.priceRange.max}</div>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Interested Categories
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            preferences.categories.includes(category.id)
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Advanced Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Advanced Settings</h2>
              
              <div className="space-y-4">
                {/* Quiet Hours */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>Quiet Hours</span>
                    </label>
                    <button
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                      }))}
                      className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                        preferences.quietHours.enabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                        preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {preferences.quietHours.enabled && (
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Sound & Vibration */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Sound</label>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                      preferences.soundEnabled ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                      preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Vibration</label>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                      preferences.vibrationEnabled ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                      preferences.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={savePreferences}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </motion.button>
          </div>

          {/* Notification History */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Notification History</h2>
                  {notificationHistory.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No notifications yet</p>
                    <p className="text-gray-500 text-sm">Flash sale alerts will appear here</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notificationHistory.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 m-2 rounded-lg border transition-colors ${
                          notification.read
                            ? 'border-gray-200 bg-white'
                            : 'border-purple-200 bg-purple-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                              {notification.clicked && (
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>Viewed</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4 text-gray-500" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;