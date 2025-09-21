import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RotateCcw, Clock, CheckCircle, ArrowLeft, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductImage from '../components/ProductImage';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/v1/orders?userId=USER001');
      console.log('Orders API response:', response.data); // Debug log
      
      // Filter orders that can be returned - check for delivered status and individual items
      const returnableOrders = [];
      
      response.data.orders.forEach(order => {
        // Check if order has returnable items
        const returnableItems = order.items?.filter(item => 
          item.is_return_eligible || item.returnEligible || item.canReturn
        ) || [];
        
        if (returnableItems.length > 0) {
          // Add each returnable item as a separate order entry for the UI
          returnableItems.forEach(item => {
            returnableOrders.push({
              id: item.id || item.order_item_id,
              order_id: order.order_id,
              product_id: item.product_id,
              local_product_id: item.local_product_id,
              product_name: item.product_name || item.title,
              amount: item.unit_price || item.price,
              status: item.status || order.status,
              created_at: order.order_date,
              image_url: item.image_urls?.[0] || item.images?.[0],
              can_return: true
            });
          });
        }
      });
      
      console.log('Filtered returnable orders:', returnableOrders); // Debug log
      setOrders(returnableOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItem = (order) => {
    // Navigate to return flow with order and item details
    navigate(`/return/${order.order_id}/${order.id}`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'returned': return 'text-orange-600 bg-orange-100';
      case 'donated': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return CheckCircle;
      case 'pending': return Clock;
      case 'returned': return RotateCcw;
      default: return Package;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Select Item to Return</h1>
                <p className="text-gray-600">Choose which item you'd like to return</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No returnable orders found</h3>
            <p className="text-gray-500 mb-6">You don't have any pending or delivered orders that can be returned.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden">
                          <ProductImage
                            src={order.image_url}
                            productId={order.local_product_id}
                            alt={order.product_name}
                            className="w-full h-full rounded-lg"
                            showFallbackIcon={true}
                            lazy={true}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {order.product_name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            Order #{order.order_id} • Ordered on {formatDate(order.created_at)}
                          </p>
                          <div className="flex items-center space-x-4">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              <StatusIcon className="h-4 w-4 mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{order.amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Return Action */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Truck className="h-4 w-4" />
                          <span>Eligible for return</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReturnItem(order)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Return This Item</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-2">🔄 Smart Return Process</h4>
          <p className="text-gray-700 text-sm">
            Our AI-powered decision engine will evaluate your return and determine the best outcome - 
            either instant credits through donation or traditional processing. Start your return journey now!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;