import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const RelatedProducts = ({ currentProductId, currentCategory, products, addToCart }) => {
  // Filter products by same category, excluding current product
  const relatedProducts = products
    .filter(product => 
      product.category === currentCategory && 
      product.id !== currentProductId
    )
    .slice(0, 4); // Show max 4 related products

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
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default RelatedProducts;
