import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, RefreshCw, Heart, BarChart3, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/impact', icon: Heart, label: 'Impact' },
    { path: '/admin', icon: BarChart3, label: 'Admin' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-white shadow-md' 
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #500050 0%, #F49717 100%)' } : {}}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-semibold">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;