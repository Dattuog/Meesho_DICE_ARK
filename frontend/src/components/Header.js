import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, User, ShoppingCart, Wallet } from 'lucide-react';

const Header = () => {
  const user = useSelector(state => state.user);
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top navigation bar - Meesho style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="text-3xl font-bold" style={{ color: '#500050' }}>
                meesho
              </div>
            </div>

            {/* Center - Search bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Try Saree, Kurti or Search by Product Code"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
                <span className="hover:text-purple-600 cursor-pointer">Become a Supplier</span>
                <span className="hover:text-purple-600 cursor-pointer">Investor Relations</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div 
                  onClick={() => navigate('/wallet')}
                  className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 cursor-pointer"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm font-medium">Wallet</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 cursor-pointer">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Profile</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 cursor-pointer">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium">Cart</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-8 h-12 text-sm font-medium text-gray-700">
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Women Ethnic</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Women Western</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Men</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Kids</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Home & Kitchen</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Beauty & Health</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Jewellery & Accessories</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Bags & Footwear</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Electronics</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Sports & Fitness</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Car & Motorbike</span>
          </nav>
        </div>
      </div>

      {/* Benefits bar */}
      <div className="bg-pink-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F49717' }}>
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="font-medium">7 Days Easy Return</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F49717' }}>
                <span className="text-white text-xs font-bold">₹</span>
              </div>
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F49717' }}>
                <span className="text-white text-xs font-bold">↓</span>
              </div>
              <span className="font-medium">Lowest Prices</span>
            </div>
          </div>
        </div>
      </div>

      {/* User info section for demo */}
      {user && (
        <div style={{ background: 'linear-gradient(90deg, #500050 0%, #F49717 100%)' }} className="text-white">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>Welcome, {user.name}!</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Wallet Balance:</span>
                <span className="font-bold text-yellow-200">₹{user.walletBalance}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;