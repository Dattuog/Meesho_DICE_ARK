import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Package, Building, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [loading, setLoading] = useState(false);

  const metrics = {
    totalReturns: 1250,
    careConnectReturns: 750,
    reCommerceReturns: 300,
    totalSavings: 112500,
    totalRevenue: 45000,
    adoptionRate: 60,
    totalNGOs: 45,
    verifiedNGOs: 38,
    pendingNGOs: 7
  };

  useEffect(() => {
    if (activeTab === 'ngos') {
      fetchPendingNGOs();
    }
  }, [activeTab]);

  const fetchPendingNGOs = async () => {
    setLoading(true);
    try {
      // Mock data for pending NGOs since we don't have an admin endpoint yet
      setPendingNGOs([
        {
          ngoId: 'NGO_1234567890',
          organizationName: 'Care Foundation',
          contactPerson: 'John Doe',
          email: 'contact@carefoundation.org',
          city: 'Mumbai',
          state: 'Maharashtra',
          focusAreas: ['education', 'healthcare'],
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          ngoId: 'NGO_1234567891',
          organizationName: 'Hope Trust',
          contactPerson: 'Jane Smith',
          email: 'info@hopetrust.org',
          city: 'Delhi',
          state: 'Delhi',
          focusAreas: ['poverty', 'children'],
          status: 'pending',
          createdAt: '2024-01-14T15:20:00Z'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch pending NGOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNGOAction = async (ngoId, action) => {
    try {
      // Mock action since we don't have admin endpoints yet
      toast.success(`NGO ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setPendingNGOs(prev => prev.filter(ngo => ngo.ngoId !== ngoId));
    } catch (error) {
      toast.error(`Failed to ${action} NGO`);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600">Meesho Rebound Analytics</p>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('ngos')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ngos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            NGO Management
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Total Returns</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{metrics.totalReturns}</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">CareConnect</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{metrics.careConnectReturns}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-800">Adoption Rate</span>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">{metrics.adoptionRate}%</div>
              <p className="text-sm text-blue-700">Users choosing smart returns</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Savings</div>
                <div className="text-xl font-bold text-green-600">₹{metrics.totalSavings.toLocaleString()}</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Revenue Generated</div>
                <div className="text-xl font-bold text-blue-600">₹{metrics.totalRevenue.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-bold text-purple-900 mb-3">Key Insights</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• 60% adoption rate for CareConnect donations</li>
                <li>• Average credit: ₹85 per donation</li>
                <li>• 95% customer satisfaction with smart returns</li>
                <li>• 40% reduction in reverse logistics costs</li>
              </ul>
            </div>
          </>
        )}

        {/* NGO Management Tab */}
        {activeTab === 'ngos' && (
          <>
            {/* NGO Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Total NGOs</span>
                </div>
                <div className="text-xl font-bold text-blue-900">{metrics.totalNGOs}</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Verified</span>
                </div>
                <div className="text-xl font-bold text-green-900">{metrics.verifiedNGOs}</div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Pending</span>
                </div>
                <div className="text-xl font-bold text-yellow-900">{metrics.pendingNGOs}</div>
              </div>
            </div>

            {/* Pending NGOs List */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-bold text-gray-900">Pending Verifications</h3>
                <p className="text-sm text-gray-600">NGOs awaiting approval</p>
              </div>
              
              <div className="divide-y">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-orange-500 mx-auto mb-2"></div>
                    Loading...
                  </div>
                ) : pendingNGOs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No pending NGOs
                  </div>
                ) : (
                  pendingNGOs.map((ngo) => (
                    <div key={ngo.ngoId} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{ngo.organizationName}</h4>
                          <p className="text-xs text-gray-600">{ngo.contactPerson} • {ngo.email}</p>
                          <p className="text-xs text-gray-500">{ngo.city}, {ngo.state}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleNGOAction(ngo.ngoId, 'approve')}
                            className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleNGOAction(ngo.ngoId, 'reject')}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ngo.focusAreas.map((area) => (
                          <span
                            key={area}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;