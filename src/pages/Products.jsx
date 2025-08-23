import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import { productService } from '../services/database.js';

const Products = ({ addToCart, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await productService.getProducts({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchTerm || undefined
        });

        if (fetchError) throw new Error(fetchError);

        setProducts(data || []);

        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(data?.map(product => product.category) || [])];
        setCategories(uniqueCategories);

      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Pagination logic for scalability
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setCurrentPage(1);
  };

  // Animation variants for staggered product cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <>
      <Helmet>
  <title>Products - Its My Choicee | Find Your Perfect Item</title>
  <meta name="description" content="Explore our curated collection of fashion, home decor, and gifts that reflect your unique style. Shop confidently at Its My Choicee." />
  <meta name="keywords" content="fashion, home decor, gifts, shopping, its my choicee, style, personal taste" />
  {/* OpenGraph Meta Tags */}
  <meta property="og:title" content="Products - Its My Choicee | Find Your Perfect Item" />
  <meta property="og:description" content="Explore our curated collection of fashion, home decor, and gifts that reflect your unique style." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://itsmychoicee.com/products" />
  <meta property="og:image" content="https://itsmychoicee.com/og-products.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Its My Choicee" />
  {/* Twitter Card Meta Tags */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Products - Its My Choicee" />
  <meta name="twitter:description" content="Explore our curated collection of fashion, home decor, and gifts that reflect your unique style." />
  <meta name="twitter:image" content="https://itsmychoicee.com/twitter-products.jpg" />
  <meta name="twitter:creator" content="@itsmychoicee" />
  {/* Additional SEO */}
  <link rel="canonical" href="https://itsmychoicee.com/products" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>

      <motion.div 
        className="min-h-screen bg-gray-50 pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Products
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our carefully curated collection of items designed to bring joy, positivity, and happiness to your everyday life.
            </p>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search products..."
            />
            <CategoryFilter
              value={selectedCategory}
              onChange={setSelectedCategory}
              categories={categories}
            />
          </motion.div>

          {/* Active Filters and Clear Button */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {/* Active Filters */}
              {searchTerm && (
                <motion.span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 text-primary-600 hover:text-primary-800 focus:outline-none"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              )}
              {selectedCategory !== 'All' && (
                <motion.span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
                >
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="ml-2 text-secondary-600 hover:text-secondary-800 focus:outline-none"
                    aria-label="Clear category filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              )}
            </div>

            {/* Clear All Filters button */}
            <motion.button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All Filters
            </motion.button>
          </div>

          {/* Error State */}
          {error && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-6xl mb-4">😞</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </motion.div>
          )}

          {/* Results Count */}
          {!loading && !error && (
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-600">
                {filteredProducts.length === 0 
                  ? 'No products found matching your criteria'
                  : `Showing ${paginatedProducts.length} of ${filteredProducts.length} products`
                }
              </p>
            </motion.div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 ? (
            <>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                  >
                    <ProductCard
                      product={product}
                      addToCart={addToCart}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      isInWishlist={isInWishlist}
                      index={index}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination - Prepared for scalability */}
              {totalPages > 1 && (
                <motion.div
                  className="flex justify-center items-center gap-2 mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          currentPage === i + 1
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </motion.div>
              )}
            </>
          ) : !loading && !error && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Empty State SVG Illustration */}
              <motion.div
                className="w-64 h-64 mx-auto mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Search magnifying glass */}
                  <circle cx="80" cy="80" r="30" fill="none" stroke="url(#gradient1)" strokeWidth="6"/>
                  <line x1="105" y1="105" x2="130" y2="130" stroke="url(#gradient1)" strokeWidth="6" strokeLinecap="round"/>
                  
                  {/* Empty box */}
                  <rect x="110" y="50" width="60" height="60" fill="none" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8,4"/>
                  <text x="140" y="85" textAnchor="middle" fill="#9ca3af" fontSize="24">?</text>
                  
                  {/* Floating elements */}
                  <motion.circle 
                    cx="40" cy="40" r="8" fill="#fbbf24" 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.circle 
                    cx="160" cy="160" r="6" fill="#34d399"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </svg>
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">No products found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any products matching your search criteria. Try adjusting your filters or search terms.
              </p>
              <button
                onClick={clearFilters}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Products;
