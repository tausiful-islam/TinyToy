import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Heart, User, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { productService } from '../services/database.js';
import RelatedProducts from '../components/RelatedProducts';

const ProductDetail = ({ addToCart, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReviews, setShowReviews] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  
  // Review management state
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    comment: '',
    rating: 5
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isProductInWishlist = isInWishlist && product ? isInWishlist(product.id) : false;

  // Load product from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await productService.getProductById(parseInt(id));
        if (error) throw new Error(error);
        if (data) {
          setProduct(data);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Load reviews from localStorage on component mount
  useEffect(() => {
    if (product) {
      const storageKey = `reviews_${product.id}`;
      const storedReviews = localStorage.getItem(storageKey);
      
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      } else {
        // Initialize with empty reviews for now
        setReviews([]);
      }
    }
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  const handleToggleWishlist = () => {
    if (!addToWishlist || !removeFromWishlist) return;
    
    setIsTogglingWishlist(true);
    if (isProductInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
    setTimeout(() => setIsTogglingWishlist(false), 300);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmittingReview(true);

    // Create new review object
    const review = {
      id: Date.now(), // Simple ID generation
      name: newReview.name.trim(),
      comment: newReview.comment.trim(),
      rating: newReview.rating,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    // Add to reviews list
    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);

    // Persist to localStorage
    const storageKey = `reviews_${product.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedReviews));

    // Reset form
    setNewReview({
      name: '',
      comment: '',
      rating: 5
    });

    setIsSubmittingReview(false);
    setShowReviewForm(false);

    // Show success message (optional)
    setTimeout(() => {
      alert('Thank you for your review!');
    }, 300);
  };

  const handleInputChange = (field, value) => {
    setNewReview(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </motion.div>
    );
  }

  if (!product) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link
            to="/products"
            className="text-primary-500 hover:text-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
          >
            Back to Products
          </Link>
        </div>
      </motion.div>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const renderStarSelector = (currentRating, onRatingChange) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRatingChange(i + 1)}
        className={`h-8 w-8 transition-colors duration-200 ${
          i < currentRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
        }`}
        aria-label={`Rate ${i + 1} stars`}
      >
        <Star className={`h-full w-full ${i < currentRating ? 'fill-current' : ''}`} />
      </button>
    ));
  };

  return (
    <>
      <Helmet>
  <title>{product.name} - Its My Choicee | Premium Quality Products</title>
        <meta name="description" content={`${product.description} - Shop ${product.name} at Its My Choicee. Premium quality, designed for your unique style.`} />
        <meta name="keywords" content={`${product.name}, ${product.category}, fashion, home decor, Its My Choicee`} />
        
        {/* OpenGraph Meta Tags */}
  <meta property="og:title" content={`${product.name} - Its My Choicee`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://itsmychoicee.com/product/${product.id}`} />
        <meta property="og:image" content={product.image} />
        <meta property="og:price:amount" content={product.price} />
        <meta property="og:price:currency" content="USD" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="product" />
  <meta name="twitter:title" content={`${product.name} - Its My Choicee`} />
        <meta name="twitter:description" content={product.description} />
        <meta name="twitter:image" content={product.image} />
        
        {/* Product Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.image,
            "brand": "Its My Choicee",
            "category": product.category,
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": reviews.length
            }
          })}
        </script>
      </Helmet>
      <motion.div 
        className="min-h-screen bg-gray-50 pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Go back to products page"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </Link>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    src={product.images ? product.images[selectedImageIndex] : product.image}
                    alt={`${product.name} - View ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
              </div>

              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        selectedImageIndex === index 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`View image ${index + 1} of ${product.name}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div 
              className="flex flex-col justify-between"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {product.category}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="flex items-center space-x-1">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-gray-600 text-sm">
                      ({product.rating}) {product.reviewCount} reviews
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-primary-600 mb-4">
                    ${product.price}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {product.description}
                  </p>
                  {product.longDescription && (
                    <p className="text-gray-700 leading-relaxed">
                      {product.longDescription}
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Product Features:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Premium quality materials</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Designed for everyday joy</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Free shipping on orders over $25</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>30-day happiness guarantee</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <motion.button
                  onClick={handleAddToCart}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={isAddingToCart ? {
                    scale: [1, 1.1, 1],
                    transition: { 
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  } : {}}
                  aria-label={`Add ${product.name} to cart for $${product.price}`}
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Add to Cart</span>
                </motion.button>
                
                <motion.button 
                  onClick={handleToggleWishlist}
                  className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isProductInWishlist 
                      ? 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={isTogglingWishlist ? {
                    scale: [1, 1.1, 1],
                    transition: { 
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  } : {}}
                  aria-label={`${isProductInWishlist ? 'Remove' : 'Add'} ${product.name} ${isProductInWishlist ? 'from' : 'to'} wishlist`}
                >
                  <Heart className={`h-6 w-6 ${isProductInWishlist ? 'fill-current' : ''}`} />
                  <span>{isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <motion.div 
            className="border-t p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Reviews ({reviews.length})
              </h2>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Write a review"
                >
                  Write a Review
                </motion.button>
                <motion.button
                  onClick={() => setShowReviews(!showReviews)}
                  className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                  whileHover={{ scale: 1.05 }}
                  aria-expanded={showReviews}
                  aria-label={showReviews ? "Hide reviews" : "Show reviews"}
                >
                  {showReviews ? 'Hide Reviews' : 'Show Reviews'}
                </motion.button>
              </div>
            </div>

            {/* Write a Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 bg-gray-50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="reviewName" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="reviewName"
                        value={newReview.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center gap-1">
                        {renderStarSelector(newReview.rating, (rating) => handleInputChange('rating', rating))}
                        <span className="ml-2 text-sm text-gray-600">
                          ({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                      </label>
                      <textarea
                        id="reviewComment"
                        value={newReview.comment}
                        onChange={(e) => handleInputChange('comment', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
                        placeholder="Share your thoughts about this product..."
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        whileHover={{ scale: isSubmittingReview ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmittingReview ? 1 : 0.98 }}
                      >
                        <Send className="h-4 w-4" />
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            <AnimatePresence>
              {showReviews && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        className="bg-gray-50 rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary-100 rounded-full p-3">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{review.name}</h4>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                            <div className="flex items-center space-x-1 mb-3">
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Related Products */}
          <RelatedProducts 
            currentProductId={product.id}
            currentCategory={product.category}
            products={products}
            addToCart={addToCart}
            addToWishlist={addToWishlist}
            removeFromWishlist={removeFromWishlist}
            isInWishlist={isInWishlist}
          />
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default ProductDetail;
