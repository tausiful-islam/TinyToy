import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

const ProductCard = ({ product, addToCart, addToWishlist, removeFromWishlist, isInWishlist, index = 0 }) => {
  const [isWishlistClicked, setIsWishlistClicked] = useState(false);

  const isProductInWishlist = isInWishlist ? isInWishlist(product.id) : false;

  const handleToggleWishlist = (e) => {
    e.preventDefault(); // Prevent navigation if this is inside a Link
    if (!addToWishlist || !removeFromWishlist) return;
    
    setIsWishlistClicked(true);
    if (isProductInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
    setTimeout(() => setIsWishlistClicked(false), 300);
  };

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      )
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      )
    }

    return stars
  }

  return (
    <motion.div 
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -5 }}
    >
      {/* Wishlist Button */}
      {addToWishlist && removeFromWishlist && (
        <motion.button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isWishlistClicked ? {
            scale: [1, 1.3, 1],
            transition: { 
              duration: 0.3,
              ease: "easeInOut"
            }
          } : {}}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isProductInWishlist 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </motion.button>
      )}

      <Link to={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-50">
          <motion.img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex items-center space-x-0.5">
              {renderStars(product.rating || 0)}
            </div>
            <span className="text-xs text-gray-500">
              ({product.review_count || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price}
              </span>
            </div>
            
            {/* Stock Status */}
            <div className="text-xs">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">In Stock</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Category Badge */}
          <div className="mt-3">
            <span className="inline-block px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-full">
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
