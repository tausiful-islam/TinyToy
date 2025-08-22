import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const ProductCard = ({ product, addToCart, addToWishlist, removeFromWishlist, isInWishlist, index = 0 }) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isWishlistClicked, setIsWishlistClicked] = useState(false);

  const isProductInWishlist = isInWishlist ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addToCart(product);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };

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

  return (
    <motion.div 
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -5 }}
    >
      <div className="relative overflow-hidden">
        <motion.img
          src={product.image}
          alt={`${product.name} - ${product.category} product`}
          className="w-full h-64 object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
        
        {/* Wishlist Heart Icon */}
        {addToWishlist && removeFromWishlist && (
          <motion.div className="absolute top-3 right-3 group/wishlist">
            <motion.button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full shadow-md transition-all duration-200 ${
                isProductInWishlist 
                  ? 'bg-secondary text-white hover:bg-secondary/90' 
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-secondary'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isWishlistClicked ? {
                scale: [1, 1.3, 1],
                transition: { 
                  duration: 0.3,
                  ease: "easeInOut"
                }
              } : {}}
              aria-label={`${isProductInWishlist ? 'Remove from' : 'Add to'} wishlist`}
            >
              <Heart 
                className={`h-5 w-5 ${isProductInWishlist ? 'fill-current' : ''}`} 
              />
            </motion.button>
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/wishlist:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-2">
          <span className="inline-block bg-accent-100 text-accent-800 text-xs px-2 py-1 rounded-full font-medium">
            {product.category}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
          <Link to={`/product/${product.id}`}>
            {product.name}
          </Link>
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            ${product.price}
          </span>
          
          <motion.button
            onClick={handleAddToCart}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isClicked ? {
              scale: [1, 1.2, 1],
              transition: { 
                duration: 0.3,
                ease: "easeInOut"
              }
            } : {}}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
