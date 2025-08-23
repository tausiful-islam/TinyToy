import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const RelatedProducts = ({ currentProductId, currentCategory, products = [], loading = false, addToCart, addToWishlist, removeFromWishlist, isInWishlist }) => {
  // Products are already filtered in the parent component
  const relatedProducts = products;

  // Show loading skeleton if loading
  if (loading) {
    return (
      <motion.section 
        className="mt-16 pt-8 border-t"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Related Products
          </h2>
          <p className="text-gray-600">
            Discover more products in the {currentCategory} category
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <motion.section 
      className="mt-16 pt-8 border-t"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Related Products
        </h2>
        <p className="text-gray-600">
          Discover more products in the {currentCategory} category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart}
            addToWishlist={addToWishlist}
            removeFromWishlist={removeFromWishlist}
            isInWishlist={isInWishlist}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default RelatedProducts;
