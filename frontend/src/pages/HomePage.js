import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Heart, RefreshCw, TrendingUp, Users, Leaf, Building, Search } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Heart,
      title: 'CareConnect',
      description: 'Donate low-value returns & get instant credits',
      color: 'text-green-600 bg-green-100',
      path: '/orders'
    },
    {
      icon: RefreshCw,
      title: 'Meesho Renewed',
      description: 'Quality refurbished products at great prices',
      color: 'text-blue-600 bg-blue-100',
      path: '/renewed'
    },
    {
      icon: TrendingUp,
      title: 'Smart Returns',
      description: 'AI-powered return processing system',
      color: 'text-purple-600 bg-purple-100',
      path: '/orders'
    }
  ];

  const stats = [
    { label: 'Returns Processed', value: '10,000+', icon: Package },
    { label: 'Families Helped', value: '5,000+', icon: Users },
    { label: 'CO₂ Saved', value: '25 tons', icon: Leaf }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner - Meesho Style */}
      <div className="relative">
        <div 
          className="h-96 bg-gradient-to-r text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #500050 0%, #F49717 100%)' }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4">Meesho Rebound</h1>
                <p className="text-xl md:text-2xl mb-6 text-white/90">
                  Transforming returns into social impact & value
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-2xl font-bold mb-3">Smart Return System</h3>
                  <p className="text-lg text-white/90">
                    Intelligent routing • Instant credits • Social impact
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden md:block"
              >
                <div className="relative">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
                    <div className="text-center">
                      <div className="text-6xl font-bold mb-2">10K+</div>
                      <div className="text-xl">Returns Processed</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-300/20 rounded-full blur-lg"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Solutions</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Revolutionizing the returns experience with smart technology and social impact
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => navigate(feature.path)}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-purple-200 transition-all duration-300"
              >
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h3>
            <p className="text-xl text-gray-600">Making a difference, one return at a time</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center group"
                >
                  <div 
                    className="inline-flex p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: '#F49717', color: 'white' }}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* NGO Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 md:p-12 border border-green-200 mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">NGO Partnership</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our donation network and help transform returns into community support. 
              Partner with us to receive donated items and make a positive impact.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/ngo-onboarding')}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-green-600 transition-all duration-300"
            >
              <Building className="h-6 w-6" />
              <span>Register Your NGO</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/ngo-status')}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-xl border-2 border-green-600 hover:bg-green-50 transition-all duration-300"
            >
              <Search className="h-6 w-6" />
              <span>Check Status</span>
            </motion.button>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl font-bold text-green-600 mb-2">Easy Registration</div>
              <p className="text-gray-600">Simple 5-step process to join our network</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-2">Verified Partners</div>
              <p className="text-gray-600">All NGOs are thoroughly verified for trust</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-2">Direct Impact</div>
              <p className="text-gray-600">Receive donations directly in your area</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center"
        >
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/orders')}
              className="px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #500050 0%, #F49717 100%)' }}
            >
              Return an Item
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/renewed')}
              className="px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-xl border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300"
            >
              Shop Renewed
            </motion.button>
          </div>
          
          {/* Demo Notice */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">🚀 Live Demo Experience</h4>
              <p className="text-gray-700">
                Experience Meesho Rebound's smart return system in action. Navigate to "Orders" 
                to try the CareConnect donation flow or browse "Renewed" products for quality refurbished items.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;