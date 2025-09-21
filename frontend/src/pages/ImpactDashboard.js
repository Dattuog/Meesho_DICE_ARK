import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, TreePine, Gift, TrendingUp } from 'lucide-react';
import api from '../services/api';

const ImpactDashboard = () => {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpactData();
  }, []);

  const fetchImpactData = async () => {
    try {
      const response = await api.get('/api/v1/careconnect/impact/demo_user_1');
      setImpact(response.data.impact);
    } catch (error) {
      console.error('Failed to fetch impact data:', error);
      // Mock data for demo
      setImpact({
        totalDonations: 3,
        totalCreditsEarned: 175,
        supportedNGOs: ['Akshaya Patra Foundation', 'Goonj'],
        estimatedFamiliesHelped: 8,
        environmentalImpact: {
          co2Saved: 7.5,
          wasteReduced: 2.4
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const impactCards = [
    {
      title: 'Items Donated',
      value: impact?.totalDonations || 0,
      icon: Gift,
      color: 'text-green-600 bg-green-100',
      suffix: 'items'
    },
    {
      title: 'Credits Earned',
      value: `₹${impact?.totalCreditsEarned || 0}`,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
      suffix: ''
    },
    {
      title: 'Families Helped',
      value: impact?.estimatedFamiliesHelped || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      suffix: 'families'
    },
    {
      title: 'CO₂ Saved',
      value: impact?.environmentalImpact?.co2Saved || 0,
      icon: TreePine,
      color: 'text-emerald-600 bg-emerald-100',
      suffix: 'kg'
    }
  ];

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto mb-3 text-green-100" />
          <h1 className="text-2xl font-bold mb-2">Your Impact</h1>
          <p className="text-green-100">
            Every donation creates a ripple of positive change
          </p>
        </div>
      </div>

      {/* Impact Cards */}
      <div className="p-6 -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {impactCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-sm border"
              >
                <div className={`p-2 rounded-full w-10 h-10 ${card.color} mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
                <div className="text-sm text-gray-600">{card.title}</div>
              </motion.div>
            );
          })}
        </div>

        {/* NGOs Supported */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
        >
          <h3 className="font-bold text-gray-900 mb-4">NGOs You've Supported</h3>
          {impact?.supportedNGOs?.length > 0 ? (
            <div className="space-y-3">
              {impact.supportedNGOs.map((ngo, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{ngo}</div>
                    <div className="text-sm text-gray-500">Community Support</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No donations yet. Start your impact journey!
            </p>
          )}
        </motion.div>

        {/* Environmental Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-2 rounded-full">
              <TreePine className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-green-900">Environmental Impact</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {impact?.environmentalImpact?.co2Saved || 0} kg
              </div>
              <div className="text-sm text-green-600">CO₂ Emissions Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {impact?.environmentalImpact?.wasteReduced || 0} kg
              </div>
              <div className="text-sm text-green-600">Waste Reduced</div>
            </div>
          </div>
        </motion.div>

        {/* Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl p-6 text-center"
        >
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-lg mb-2">Impact Champion</h3>
          <p className="text-orange-100 text-sm">
            You're making a difference! Keep up the great work.
          </p>
          <div className="mt-4 bg-white/20 rounded-full px-3 py-1 inline-block text-sm">
            Level 1 • {impact?.totalDonations || 0}/5 donations
          </div>
        </motion.div>

        {/* Social Sharing */}
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Share Your Impact 📱
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;