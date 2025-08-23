import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sparkles, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/database.js';

const Home = ({ addToCart, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await productService.getProducts({ limit: 8 });
        if (error) throw new Error(error);
        setFeaturedProducts(data || []);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <>
            <Helmet>
        <title>Its My Choicee - Your Personal Shopping Destination</title>
        <meta name="description" content="Discover amazing products tailored to your unique style and preferences. At Its My Choicee, every purchase reflects your personal taste." />
      </Helmet>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
                <Sparkles className="h-5 w-5 text-accent-500" />
                <span className="text-sm font-medium text-gray-700">Your Choice Since 2024</span>
                <Sparkles className="h-5 w-5 text-accent-500" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Your Style, Your Choice
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Its My Choicee
              </span>
            </motion.h1>            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover amazing products that match your unique style and personality. At Its My Choicee, every item is carefully selected to help you express who you truly are.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/products"
                  className="group bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Browse our product collection"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Heart className="h-8 w-8 text-primary-300" />
        </motion.div>
        <motion.div 
          className="absolute bottom-20 right-10"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Gift className="h-10 w-10 text-secondary-300" />
        </motion.div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Discover our most loved items that bring smiles to customers worldwide
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {loading ? (
              // Loading skeleton for featured products
              Array(8).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  addToWishlist={addToWishlist}
                  removeFromWishlist={removeFromWishlist}
                  isInWishlist={isInWishlist}
                  index={index}
                />
              ))
            )}
          </motion.div>
          
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                aria-label="View all products in our collection"
              >
                <span>View All Products</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;
