import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import { ProductGridSkeleton, HeroCarouselSkeleton } from '../components/LoadingSkeleton';
import { productService, newsletterService } from '../services/database.js';

const Home = ({ addToCart, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch featured products for carousel
        const { data: featured, error: featuredError } = await productService.getFeaturedProducts(4);
        if (featuredError) throw new Error(featuredError);
        setFeaturedProducts(featured || []);

        // Fetch latest products for grid
        const { data: latest, error: latestError } = await productService.getProducts({ limit: 8 });
        if (latestError) throw new Error(latestError);
        setNewProducts(latest || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterStatus(null);

    try {
      const { data, error } = await newsletterService.subscribe(newsletterEmail, null, 'homepage');
      
      if (error) {
        throw new Error(error);
      }

      setNewsletterStatus({
        type: 'success',
        message: 'Thank you for subscribing! Check your email for confirmation.'
      });
      setNewsletterEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setNewsletterStatus({
        type: 'error',
        message: error.message || 'There was an error subscribing. Please try again.'
      });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Its My Choicee - Your Style, Your Choice</title>
        <meta name="description" content="Discover amazing products that match your unique style and personality. At Its My Choicee, every item is carefully selected to help you express who you truly are." />
        <meta property="og:title" content="Its My Choicee - Your Style, Your Choice" />
        <meta property="og:description" content="Discover amazing products that match your unique style and personality." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="min-h-screen">
        {/* Hero Carousel */}
        {loading ? (
          <HeroCarouselSkeleton />
        ) : (
          <HeroCarousel featuredProducts={featuredProducts} />
        )}

        {/* Categories/Features Strip */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Curated Collection</h3>
                <p className="text-gray-600">Every product is handpicked for quality and style</p>
              </motion.div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending Now</h3>
                <p className="text-gray-600">Stay ahead with the latest trends and styles</p>
              </motion.div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Quality</h3>
                <p className="text-gray-600">Top-rated products with excellent reviews</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* New & Noteworthy Section */}
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
                New & Noteworthy
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our latest arrivals and customer favorites that are making waves
              </p>
            </motion.div>
            
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {newProducts.map((product, index) => (
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
              </motion.div>
            )}
            
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Shop All Products</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stay in the Loop
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Be the first to know about new arrivals, exclusive offers, and style tips
              </p>
              
              {newsletterStatus && (
                <div className={`max-w-md mx-auto mb-6 p-4 rounded-lg ${
                  newsletterStatus.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {newsletterStatus.message}
                </div>
              )}
              
              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex space-x-4">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterSubmitting}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
