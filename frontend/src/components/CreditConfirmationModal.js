import React, { useState, useEffect } from 'react';
import { CheckCircle, Gift, Wallet, TrendingUp, Info, ArrowRight } from 'lucide-react';
import api from '../services/api';

const CreditConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product, 
  orderDetails, 
  ngoDetails,
  loading = false 
}) => {
  const [creditCalculation, setCreditCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  useEffect(() => {
    if (isOpen && product && orderDetails) {
      calculateCredit();
    }
  }, [isOpen, product, orderDetails]);

  const calculateCredit = async () => {
    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      const response = await api.post('/api/v1/credit/calculate', {
        product: {
          name: product.name,
          price: product.price,
          category: product.category,
          sku: product.sku
        },
        orderDetails: {
          deliveryAddress: orderDetails.address,
          sellerLocation: orderDetails.sellerLocation || 'Bangalore, Karnataka'
        },
        returnReason: 'ngo_donation'
      });

      if (response.data.success) {
        setCreditCalculation(response.data.creditDetails);
      } else {
        setCalculationError(response.data.message || 'Failed to calculate credit');
      }
    } catch (error) {
      console.error('Credit calculation error:', error);
      setCalculationError('Unable to calculate credit amount');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmDonation = () => {
    if (creditCalculation) {
      onConfirm({
        creditAmount: creditCalculation.buyerCredit,
        creditDetails: creditCalculation
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Instant Credit</h3>
                <p className="text-sm text-gray-600">For donating to NGO</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {isCalculating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating your instant credit...</p>
            </div>
          ) : calculationError ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-600 mb-4">{calculationError}</p>
              <button
                onClick={calculateCredit}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : creditCalculation ? (
            <div className="space-y-6">
              {/* Credit Amount Display */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <Wallet className="w-8 h-8 text-purple-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-700">Instant Credit</span>
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  ₹{creditCalculation.buyerCredit}
                </div>
                <p className="text-sm text-gray-600">
                  Will be added to your wallet immediately
                </p>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Donating Product</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Order Value: ₹{product.price}</p>
                  </div>
                </div>
              </div>

              {/* NGO Info */}
              {ngoDetails && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Donating To</h4>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {ngoDetails.name?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ngoDetails.name}</p>
                      <p className="text-sm text-gray-600">{ngoDetails.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">How We Calculate This Credit</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reverse Logistics Saved:</span>
                    <span className="font-medium">₹{creditCalculation.avoidedCosts.reverseLogistics}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Costs Saved:</span>
                    <span className="font-medium">₹{creditCalculation.avoidedCosts.warehouseProcessing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Write-off Risk Avoided:</span>
                    <span className="font-medium">₹{creditCalculation.avoidedCosts.productWriteOff}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Costs Avoided:</span>
                      <span className="text-green-600">₹{creditCalculation.avoidedCosts.total}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 mt-2">
                    <div className="flex justify-between text-purple-600 font-semibold">
                      <span>Your Credit (60% of savings):</span>
                      <span>₹{creditCalculation.buyerCredit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Summary */}
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Win-Win Impact</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>You get instant ₹{creditCalculation.buyerCredit} credit</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Product helps those in need</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Seller saves ₹{creditCalculation.sellerBenefit.savings} vs traditional return</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDonation}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Confirm Donation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-gray-500 text-center">
                Credit will be instantly added to your Meesho Rebound wallet and can be used for future purchases
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CreditConfirmationModal;