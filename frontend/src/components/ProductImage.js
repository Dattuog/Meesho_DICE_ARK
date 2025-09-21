import React, { useState } from 'react';
import { Package } from 'lucide-react';

const ProductImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '',
  showFallbackIcon = true,
  lazy = true,
  productId = null // New prop to handle local images by product ID
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Simple direct mapping to ensure images work
  const getImageSrc = () => {
    // If external src is provided, use it first
    if (src && src.trim() && !src.includes('example.com') && !src.includes('meesho.com')) {
      return src;
    }
    
    // Direct mapping for local images - using available images
    if (productId) {
      const cleanId = productId.replace('product_', '').replace(/^0+/, '') || '1';
      
      // Map product IDs to available images (you have product_1.jpg to product_10.jpg)
      const imageMap = {
        '1': '/images/products/product_1.jpg',
        '001': '/images/products/product_1.jpg',
        '2': '/images/products/product_2.jpg',
        '3': '/images/products/product_3.jpg',
        '003': '/images/products/product_3.jpg',
        '4': '/images/products/product_4.jpg',
        '5': '/images/products/product_5.jpg',
        '6': '/images/products/product_6.jpg',
        '7': '/images/products/product_7.jpg',
        '8': '/images/products/product_8.jpg',
        '9': '/images/products/product_9.jpg',
        '10': '/images/products/product_10.jpg'
      };
      
      return imageMap[cleanId] || `/images/products/product_${Math.floor(Math.random() * 10) + 1}.jpg`;
    }
    
    return null;
  };

  const imageSrc = getImageSrc();

  if (imageError || !imageSrc) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className} ${fallbackClassName}`}>
        <Package className="h-8 w-8 text-gray-400" />
        <div className="ml-2 text-xs text-gray-500">
          {productId ? 'Loading...' : 'No Image'}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className={`absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center ${className}`}>
          <Package className="h-8 w-8 text-gray-300" />
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

// Higher-order component for product image galleries
const ProductImageGallery = ({ 
  images = [], 
  productName = 'Product', 
  productId = null, // New prop for local image handling
  className = '',
  maxImages = 4,
  showThumbnails = false 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Generate local image paths using available images
  const generateLocalImages = (productId, maxCount = 4) => {
    if (!productId) return [];
    
    const availableImages = [
      '/images/products/product_1.jpg',
      '/images/products/product_2.jpg',
      '/images/products/product_3.jpg',
      '/images/products/product_4.jpg',
      '/images/products/product_5.jpg',
      '/images/products/product_6.jpg',
      '/images/products/product_7.jpg',
      '/images/products/product_8.jpg',
      '/images/products/product_9.jpg',
      '/images/products/product_10.jpg'
    ];
    
    // Return random selection of available images
    return availableImages.slice(0, maxCount);
  };

  // Determine image list to use
  const getImageList = () => {
    if (Array.isArray(images) && images.length > 0) {
      return images; // Use provided images
    }
    if (productId) {
      return generateLocalImages(productId, maxImages); // Generate local image paths
    }
    return ['']; // Fallback to empty
  };

  const imageList = getImageList();
  const mainImage = imageList[currentImageIndex] || imageList[0];

  return (
    <div className={`${className}`}>
      {/* Main image */}
      <ProductImage
        src={mainImage}
        productId={productId}
        alt={productName}
        className="w-full h-full rounded-lg"
        lazy={true}
      />
      
      {/* Thumbnails for multiple images */}
      {showThumbnails && imageList.length > 1 && (
        <div className="flex space-x-2 mt-2 overflow-x-auto">
          {imageList.slice(0, maxImages).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                index === currentImageIndex 
                  ? 'border-purple-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ProductImage
                src={image}
                productId={productId}
                alt={`${productName} ${index + 1}`}
                className="w-full h-full"
                showFallbackIcon={false}
                lazy={false}
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Image counter for multiple images */}
      {imageList.length > 1 && !showThumbnails && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          1/{imageList.length}
        </div>
      )}
    </div>
  );
};

export default ProductImage;
export { ProductImageGallery };