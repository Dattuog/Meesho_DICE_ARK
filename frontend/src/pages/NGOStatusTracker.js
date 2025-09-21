import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Building,
  Heart,
  Eye,
  Package,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const NGOStatusTracker = () => {
  const [ngoId, setNgoId] = useState('');
  const [ngoData, setNgoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const checkNGOStatus = async () => {
    if (!ngoId.trim()) {
      toast.error('Please enter your NGO ID');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setNgoData(null);

    try {
      const response = await api.get(`/api/v1/ngo/status/${ngoId}`);
      if (response.data.success) {
        setNgoData(response.data.ngo);
      }
    } catch (error) {
      console.error('Failed to fetch NGO status:', error);
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to fetch NGO status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NGO Status Tracker</h1>
              <p className="text-gray-600">Check your registration and verification status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Search className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Enter Your NGO ID</h2>
          </div>
          
          <div className="flex space-x-4">
            <input
              type="text"
              value={ngoId}
              onChange={(e) => setNgoId(e.target.value)}
              placeholder="Enter your NGO ID (e.g., NGO_1234567890)"
              className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              onKeyPress={(e) => e.key === 'Enter' && checkNGOStatus()}
            />
            <button
              onClick={checkNGOStatus}
              disabled={loading}
              className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Check Status'}
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            Your NGO ID was provided when you submitted your registration application.
          </p>
        </motion.div>

        {/* Not Found Message */}
        {notFound && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">NGO Not Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find an NGO with the ID "{ngoId}". Please check your NGO ID and try again.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                If you haven't registered yet, you can <a href="/ngo-onboarding" className="text-blue-500 hover:underline">register your NGO here</a>.
              </p>
            </div>
          </motion.div>
        )}

        {/* NGO Details */}
        {ngoData && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-6"
          >
            {/* Status Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-900">Registration Status</h2>
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(ngoData.status)}`}>
                  {getStatusIcon(ngoData.status)}
                  <span className="font-semibold capitalize">{ngoData.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{ngoData.organizationName}</h3>
                  <p className="text-gray-600 mb-1">NGO ID: <span className="font-mono">{ngoData.ngoId}</span></p>
                  <p className="text-gray-600 mb-1">Registration No: {ngoData.registrationNumber}</p>
                  <p className="text-gray-600">Applied: {formatDate(ngoData.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">Contact: {ngoData.contactPerson}</p>
                  <p className="text-gray-600 mb-1">Email: {ngoData.email}</p>
                  <p className="text-gray-600">Phone: {ngoData.phone}</p>
                </div>
              </div>
            </div>

            {/* Status-specific Information */}
            {ngoData.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-yellow-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Application Under Review</h3>
                    <p className="text-yellow-800 mb-4">
                      Your NGO registration is currently being reviewed by our verification team. 
                      This process typically takes 3-5 business days.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-yellow-800">Application submitted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-800">Document verification in progress</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                        <span className="text-sm text-gray-600">Final approval</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {ngoData.status === 'verified' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">NGO Verified & Active</h3>
                    <p className="text-green-800 mb-4">
                      Congratulations! Your NGO has been successfully verified and is now part of our donation network.
                    </p>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{ngoData.totalDonationsReceived || 0}</div>
                        <div className="text-sm text-gray-600">Items Received</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 text-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{ngoData.currentCapacity || ngoData.capacityLimit}</div>
                        <div className="text-sm text-gray-600">Available Capacity</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{ngoData.focusAreas?.length || 0}</div>
                        <div className="text-sm text-gray-600">Focus Areas</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Building className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{ngoData.acceptedCategories?.length || 0}</div>
                        <div className="text-sm text-gray-600">Categories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {ngoData.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-6 w-6 text-red-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Application Rejected</h3>
                    <p className="text-red-800 mb-4">
                      Unfortunately, your NGO application could not be approved at this time.
                    </p>
                    {ngoData.rejectionReason && (
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Reason:</strong> {ngoData.rejectionReason}
                        </p>
                      </div>
                    )}
                    <p className="text-red-700 text-sm">
                      You can reapply after addressing the issues mentioned above. 
                      For questions, please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Organization Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Established:</span> {ngoData.establishedYear || 'Not specified'}</p>
                    <p><span className="text-gray-600">Website:</span> 
                      {ngoData.website ? (
                        <a href={ngoData.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                          {ngoData.website}
                        </a>
                      ) : 'Not provided'}
                    </p>
                    <p><span className="text-gray-600">Capacity:</span> {ngoData.capacityLimit} items/month</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Address</h4>
                  <div className="text-sm text-gray-700">
                    <p>{ngoData.address}</p>
                    <p>{ngoData.city}, {ngoData.state} - {ngoData.pincode}</p>
                  </div>
                </div>
              </div>

              {ngoData.focusAreas && ngoData.focusAreas.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {ngoData.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize"
                      >
                        {typeof area === 'string' ? area.replace('_', ' ') : area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ngoData.acceptedCategories && ngoData.acceptedCategories.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Accepted Product Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {ngoData.acceptedCategories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm capitalize"
                      >
                        {typeof category === 'string' ? category.replace('_', ' ') : category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NGOStatusTracker;