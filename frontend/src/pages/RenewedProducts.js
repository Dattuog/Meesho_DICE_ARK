// Placeholder pages for demo

import React from 'react';
import { RefreshCw, Star, Tag, Filter } from 'lucide-react';

const RenewedProducts = () => {
  const products = [
    {
      id: 1,
      title: 'Samsung Galaxy Earbuds - Renewed',
      originalPrice: 4999,
      renewedPrice: 3499,
      grade: 'A',
      condition: 'Like New',
      discount: 30,
      image: '/api/placeholder/150/150'
    },
    {
      id: 2,
      title: 'Levi\'s Jeans - Renewed',
      originalPrice: 2999,
      renewedPrice: 2099,
      grade: 'B',
      condition: 'Good',
      discount: 30,
      image: '/api/placeholder/150/150'
    },
    {
      id: 3,
      title: 'Kitchen Aid Blender - Renewed',
      originalPrice: 8999,
      renewedPrice: 6299,
      grade: 'A',
      condition: 'Like New',
      discount: 30,
      image: '/api/placeholder/150/150'
    }
  ];

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Meesho Renewed</h1>
          <Filter className="h-5 w-5 text-gray-600" />
        </div>
        <p className="text-sm text-gray-600">Quality refurbished products at great prices</p>
      </div>

      <div className="p-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Certified Renewed</span>
          </div>
          <p className="text-sm text-green-700">
            All products are professionally inspected, tested, and graded for quality assurance.
          </p>
        </div>

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex space-x-3">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.grade === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      Grade {product.grade}
                    </span>
                    <span className="text-xs text-gray-500">{product.condition}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-lg font-bold text-orange-600">₹{product.renewedPrice}</span>
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                    <span className="text-sm text-green-600">({product.discount}% off)</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.2 (120 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RenewedProducts;