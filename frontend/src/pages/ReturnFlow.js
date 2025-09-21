import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductImage from '../components/ProductImage';
import CreditConfirmationModal from '../components/CreditConfirmationModal';

const ReturnFlow = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);
  const [decisionResponse, setDecisionResponse] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [processingCredit, setProcessingCredit] = useState(false);

  const returnReasons = [
    { value: 'size_mismatch', label: 'Size doesn\'t fit' },
    { value: 'quality_issue', label: 'Quality not as expected' },
    { value: 'damaged', label: 'Item damaged/defective' },
    { value: 'wrong_item', label: 'Wrong item delivered' },
    { value: 'not_needed', label: 'No longer needed' },
    { value: 'other', label: 'Other reason' }
  ];

  useEffect(() => {
    fetchItemDetails();
  }, [orderId, itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/orders?userId=USER001');
      const orders = response.data.orders;
      
      let foundItem = null;
      orders.forEach(order => {
        if (order.order_id === orderId) {
          const matchingItem = order.items?.find(item => item.order_item_id === itemId);
          if (matchingItem) {
            foundItem = { ...matchingItem, order_date: order.order_date };
          }
        }
      });
      
      if (foundItem) {
        setItem(foundItem);
      } else {
        toast.error('Item not found');
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Failed to load item details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + proofImages.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    setProofImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreditConfirmation = async (creditData) => {
    setProcessingCredit(true);
    
    try {
      // Process the complete NGO donation with instant credit
      const response = await api.post('/api/v1/decision/process-ngo-donation', {
        userId: 'USER001', // This should come from auth context
        orderId,
        returnId: `RET_${orderId}_${itemId}`,
        ngoId: selectedNGO?.id,
        sellerId: item?.seller_id || 'SELLER001',
        product: {
          name: item?.product_name,
          price: item?.unit_price,
          category: item?.category || 'Fashion',
          sku: item?.sku || item?.local_product_id
        },
        orderDetails: {
          deliveryAddress: 'Bangalore, Karnataka', // This should come from user profile
          sellerLocation: 'Bangalore, Karnataka'
        },
        decisionId: decisionResponse?.decision_id
      });

      if (response.data.success) {
        // Mark the order item as returned
        try {
          await api.post('/api/v1/orders/return', {
            orderId,
            orderItemId: itemId,
            returnType: 'ngo_donation',
            userId: 'USER001'
          });
        } catch (orderError) {
          console.warn('Failed to update order status:', orderError);
          // Don't fail the entire flow if order update fails
        }

        setShowCreditModal(false);
        setReturnSubmitted(true);
        
        toast.success(`🎉 ₹${response.data.data.creditIssued.amount} credit added to your wallet!`);
        
        // Update decision response with actual credit data
        setDecisionResponse(prev => ({
          ...prev,
          refund: {
            amount: response.data.data.creditIssued.amount,
            transactionId: response.data.data.creditIssued.transactionId
          },
          assignedNGO: {
            ...selectedNGO,
            organizationName: selectedNGO?.name,
            city: 'City',
            state: 'State'
          }
        }));
        
        setTimeout(() => {
          toast.success(`💝 Your item will be donated to ${selectedNGO?.name}! Thank you for contributing to social impact.`);
        }, 2000);

        // Redirect to orders page after successful return
        setTimeout(() => {
          navigate('/orders');
        }, 4000);
      } else {
        toast.error(response.data.message || 'Failed to process donation');
      }
    } catch (error) {
      console.error('Credit processing error:', error);
      toast.error('Failed to process instant credit');
    } finally {
      setProcessingCredit(false);
    }
  };

  const handleCreditModalClose = () => {
    setShowCreditModal(false);
    // Fall back to traditional return processing
    setReturnSubmitted(true);
    toast.success('Return request submitted for traditional processing');
  };

  const handleSubmitReturn = async () => {
    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }
    if (!returnDescription.trim()) {
      toast.error('Please provide a description');
      return;
    }
    if (proofImages.length === 0) {
      toast.error('Please upload at least one proof image');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await api.post('/api/v1/decision/evaluate', {
        orderId,
        itemId,
        returnReason,
        returnDescription,
        customerLocation: { latitude: 12.9716, longitude: 77.5946 }
      });

      setDecisionResponse(response.data.decision);
      
      // Show credit confirmation modal for NGO donations
      if (response.data.decision?.pathway === 'CARECONNECT') {
        // Select the first available NGO or let user choose
        const availableNGO = response.data.decision?.nearbyNGOs?.[0];
        if (availableNGO) {
          setSelectedNGO(availableNGO);
        }
        setShowCreditModal(true);
      } else {
        setReturnSubmitted(true);
        toast.success('Return request submitted successfully!');
        
        setTimeout(() => {
          if (response.data.decision?.pathway === 'FLASH_SALE') {
            toast.success('� Great news! Your item has been listed in a flash sale for nearby customers!');
          } else {
            toast.success('📦 Your return has been processed through our standard procedure.');
          }
        }, 2000);
      }
      
    } catch (error) {
      toast.error('Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (returnSubmitted) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your return request has been successfully submitted. Our platform is now processing your request and will automatically find the best solution.
            </p>
            {/* Decision-specific information */}
            {decisionResponse?.pathway === 'CARECONNECT' && decisionResponse?.assignedNGO && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center space-x-2 text-green-700 mb-3">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-bold text-lg">Donation Confirmed!</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-green-800 font-semibold mb-2">
                    Your item will be donated to:
                  </p>
                  <p className="text-xl font-bold text-green-900 mb-1">
                    {decisionResponse.assignedNGO.organizationName}
                  </p>
                  <p className="text-green-700 text-sm">
                    {decisionResponse.assignedNGO.city}, {decisionResponse.assignedNGO.state}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">
                      ₹{decisionResponse.refund?.amount || 0}
                    </span>
                    <p className="text-green-700 text-sm">Instant credit added to your wallet</p>
                  </div>
                </div>
                <p className="text-green-700 text-sm text-center">
                  Thank you for contributing to social impact! Your donation will help the community.
                </p>
              </div>
            )}

            {decisionResponse?.pathway === 'FLASH_SALE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
                  <Package className="h-5 w-5" />
                  <span className="font-semibold">Flash Sale Listed!</span>
                </div>
                <p className="text-blue-600 text-sm text-center">
                  Your item has been listed in a flash sale for nearby customers. This helps avoid unnecessary logistics while getting you faster resolution!
                </p>
              </div>
            )}

            {(!decisionResponse || decisionResponse?.pathway === 'TRADITIONAL') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Platform Processing...</span>
                </div>
                <p className="text-blue-600 text-sm">
                  We're processing your return through our standard procedure. You'll receive updates via email and SMS.
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Back to Orders
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/orders')} 
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Return Item</h1>
              <p className="text-gray-600">Tell us why you want to return this item</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden">
              <ProductImage
                src={item?.image_urls?.[0]}
                productId={item?.local_product_id}
                alt={item?.product_name}
                className="w-full h-full rounded-lg"
                showFallbackIcon={true}
                lazy={true}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{item?.product_name}</h2>
              <p className="text-gray-600 mb-2">{item?.brand}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="text-lg font-bold text-gray-900">₹{item?.unit_price}</span>
                <span>Order #{orderId}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Return Details</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Why are you returning this item? *
            </label>
            <div className="space-y-2">
              {returnReasons.map((reason) => (
                <label key={reason.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="returnReason"
                    value={reason.value}
                    checked={returnReason === reason.value}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please describe the issue in detail *
            </label>
            <textarea
              value={returnDescription}
              onChange={(e) => setReturnDescription(e.target.value)}
              placeholder="Provide specific details about why you want to return this item..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload proof images (Max 3) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Click to upload images or drag and drop</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
              >
                Choose Files
              </label>
            </div>
            
            {proofImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {proofImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Proof ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitReturn}
            disabled={submitting}
            className="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #500050 0%, #F49717 100%)' }}
          >
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">How it works</h4>
              <p className="text-gray-700 text-sm">
                After you submit your return request, our platform will automatically process it and find the best solution - including our innovative flash sale program that connects you directly with nearby customers for faster resolution!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Credit Confirmation Modal */}
      <CreditConfirmationModal
        isOpen={showCreditModal}
        onClose={handleCreditModalClose}
        onConfirm={handleCreditConfirmation}
        product={{
          name: item?.product_name,
          price: item?.unit_price,
          category: item?.category || 'Fashion',
          sku: item?.sku || item?.local_product_id
        }}
        orderDetails={{
          address: 'Bangalore, Karnataka', // Should come from user profile
          sellerLocation: 'Bangalore, Karnataka'
        }}
        ngoDetails={selectedNGO}
        loading={processingCredit}
      />
    </div>
  );
};

export default ReturnFlow;