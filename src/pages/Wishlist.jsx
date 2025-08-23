import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ShoppingCart, Star } from 'lucide-react';

/**
 * Wishlist page component that displays user's saved favorite products
 * @param {Object} props - Component props
 * @param {Array} props.wishlistItems - Array of products in wishlist
 * @param {Function} props.addToCart - Function to add product to cart
 * @param {Function} props.removeFromWishlist - Function to remove product from wishlist
 * @returns {JSX.Element} Wishlist page component
 */
const Wishlist = ({ wishlistItems, addToCart, removeFromWishlist }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    // Optional: Add success animation here
  };

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId);
  };

  return (
    <>
      <Helmet>
        <title>My Wishlist - Its My Choicee</title>
        <meta 
          name="description" 
          content="View and manage your favorite products in your Its My Choicee wishlist. Save items for later and easily add them to your cart." 
        />
        <meta name="keywords" content="wishlist, favorites, saved products, Its My Choicee" />
        <meta property="og:title" content="My Wishlist - Its My Choicee" />
        <meta property="og:description" content="View and manage your favorite products in your Its My Choicee wishlist." />
      </Helmet>

      <motion.div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-secondary-500 fill-current" />
              <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {wishlistItems.length > 0 
                ? `You have ${wishlistItems.length} ${wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist`
                : 'Save your favorite products here for later'
              }
            </p>
          </motion.div>

          {/* Wishlist Content */}
          {wishlistItems.length === 0 ? (
            /* Empty State */
            <motion.div 
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
                  <p className="text-gray-500 mb-8">
                    Start adding products to your wishlist by clicking the heart icon on any product you love!
                  </p>
                </div>
                
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Wishlist Grid */
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
            >
              {wishlistItems.map((product) => (
                <motion.div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </Link>
                    
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-200 group/btn"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Heart className="h-5 w-5 text-secondary-500 fill-current group-hover/btn:scale-110 transition-transform duration-200" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-primary-800 bg-primary-100 rounded-full">
                        {product.category}
                      </span>
                    </div>

                    {/* Product Name */}
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors duration-200 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        ({product.rating})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <motion.button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-primary-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-all duration-200 flex items-center justify-center gap-2 group/cart"
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart className="h-4 w-4 group-hover/cart:scale-110 transition-transform duration-200" />
                        Add to Cart
                      </motion.button>
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                        aria-label={`Remove ${product.name} from wishlist`}
                      >
                        <Heart className="h-4 w-4" />
                        Remove from Wishlist
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Continue Shopping Section */}
          {wishlistItems.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              variants={itemVariants}
            >
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-primary-500 border-2 border-primary-500 px-8 py-3 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ShoppingBag className="h-5 w-5" />
                Continue Shopping
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Wishlist;
