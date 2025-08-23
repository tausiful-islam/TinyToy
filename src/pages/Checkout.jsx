import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, MapPin, User, Check, Truck, Phone, UserPlus, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { orderService } from '../services/database.js';
import { PAYMENT_METHODS } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext';

const Checkout = ({ cartItems, clearCart }) => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: PAYMENT_METHODS.COD, // Default to Cash on Delivery
    createAccount: false,
    password: '',
    confirmPassword: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [error, setError] = useState(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountCreationError, setAccountCreationError] = useState(null);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = total > 50 ? 0 : 9.99;
  const tax = total * 0.08;
  const codFee = formData.paymentMethod === PAYMENT_METHODS.COD ? 2.99 : 0;
  const bankTransferFee = formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER ? 1.99 : 0;
  const finalTotal = total + shipping + tax + codFee + bankTransferFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    const required = ['name', 'email', 'phone', 'address', 'city'];
    for (let field of required) {
      if (!formData[field].trim()) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      return 'Please enter a valid phone number';
    }

    // Password validation when creating account
    if (formData.createAccount && !user) {
      if (!formData.password.trim()) {
        return 'Password is required to create an account';
      }
      if (formData.password.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      if (!formData.confirmPassword.trim()) {
        return 'Please confirm your password';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare order data
      const orderData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: `${formData.address.trim()}, ${formData.city.trim()}, ${formData.zipCode.trim()}`,
        paymentMethod: formData.paymentMethod,
        total: finalTotal
      };

      // Create order in database
      const { data, error: orderError } = await orderService.createOrder(orderData, cartItems, user);
      
      if (orderError) throw new Error(orderError);

      // Success - show confirmation
      setOrderNumber(data.order.id);
      setIsSubmitted(true);
      
      // Try to create account if requested
      if (formData.createAccount && !user) {
        try {
          const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
          const lastName = lastNameParts.join(' ') || firstName;

          const accountResult = await signUp({
            email: formData.email.trim(),
            password: formData.password,
            firstName: firstName,
            lastName: lastName,
            marketingEmails: false
          });

          if (accountResult.success) {
            setAccountCreated(true);
          } else {
            setAccountCreationError(accountResult.error || 'Failed to create account');
          }
        } catch (accountError) {
          console.error('Account creation failed:', accountError);
          setAccountCreationError('Failed to create account. You can create one later from the login page.');
        }
      }
      
      // Clear cart after successful order
      if (clearCart) clearCart();
      
    } catch (err) {
      console.error('Order creation failed:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Helmet>
            <title>Order Confirmed - Its My Choicee</title>
          <meta name="description" content="Your order has been confirmed successfully" />
        </Helmet>
        <motion.div 
          className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            >
              <Check className="h-12 w-12 text-green-600" />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Order Confirmed!
            </motion.h1>
            <motion.div 
              className="bg-white rounded-lg p-6 mb-6 border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-lg font-semibold text-gray-900 mb-2">Order #{orderNumber}</p>
              <p className="text-gray-600 mb-4">
                Thank you {formData.name}! Your order has been placed successfully.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>📧 Confirmation sent to: {formData.email}</p>
                <p>📱 We'll contact you at: {formData.phone}</p>
                <p>💰 Payment: {formData.paymentMethod}</p>
                <p>📦 We will contact you soon to confirm your order</p>
              </div>

              {/* Account Creation Status */}
              {formData.createAccount && !user && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {accountCreated ? (
                    <div className="flex items-center justify-center text-green-600 text-sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span>Account created successfully! Check your email to verify.</span>
                    </div>
                  ) : accountCreationError ? (
                    <div className="text-orange-600 text-sm">
                      <p className="flex items-center justify-center mb-1">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Account creation was skipped
                      </p>
                      <p className="text-xs text-gray-500">{accountCreationError}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Link
                to={`/order/${orderNumber}`}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Track Your Order
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
            <title>Checkout - Its My Choicee</title>
            <meta name="description" content="Complete your purchase at Its My Choicee" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <Link
              to="/products"
              className="text-primary-500 hover:text-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
  <title>Checkout - Its My Choicee</title>
  <meta name="description" content="Complete your purchase at Its My Choicee" />
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
              aria-label="Go back to products"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Shopping</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                        required
                        aria-label="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                        required
                        aria-label="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                      required
                      aria-label="Enter your email address"
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                        required
                        aria-label="Enter your street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          required
                          aria-label="Enter your city"
                        />
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          required
                          aria-label="Enter your ZIP code"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    {/* Cash on Delivery Option */}
                    <motion.label 
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.paymentMethod === PAYMENT_METHODS.COD 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={PAYMENT_METHODS.COD}
                        checked={formData.paymentMethod === PAYMENT_METHODS.COD}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center w-full">
                        <Truck className="h-6 w-6 text-gray-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Cash on Delivery</div>
                          <div className="text-sm text-gray-500">Pay when your order arrives</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.paymentMethod === PAYMENT_METHODS.COD 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === PAYMENT_METHODS.COD && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                    </motion.label>

                    {/* Bank Transfer Option */}
                    <motion.label 
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={PAYMENT_METHODS.BANK_TRANSFER}
                        checked={formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center w-full">
                        <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Bank Transfer</div>
                          <div className="text-sm text-gray-500">Pay directly to our bank account</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                    </motion.label>
                  </div>

                  {/* Cash on Delivery Note */}
                  {formData.paymentMethod === PAYMENT_METHODS.COD && (
                    <motion.div 
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start">
                        <Truck className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Cash on Delivery</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            You can pay in cash when your order is delivered to your doorstep. 
                            Please keep the exact amount ready for a smooth delivery experience.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Bank Transfer Note */}
                  {formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && (
                    <motion.div 
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Bank Transfer Details</h4>
                          <div className="text-sm text-blue-700 mt-2 space-y-1">
                            <p><strong>Bank:</strong> Its My Choicee Bank</p>
                            <p><strong>Account Number:</strong> 1234567890</p>
                            <p><strong>Account Name:</strong> Its My Choicee Store</p>
                            <p><strong>Reference:</strong> Please use Order #{orderNumber || 'PENDING'} as reference</p>
                            <p className="mt-2 text-xs">Please transfer the exact amount and send payment confirmation to our WhatsApp.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Account Creation Section - Only show if user is not logged in */}
                {!user && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Account (Optional)
                    </h2>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="createAccount"
                          name="createAccount"
                          checked={formData.createAccount}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <label htmlFor="createAccount" className="text-sm font-medium text-purple-900">
                            Create an account for faster future checkouts
                          </label>
                          <div className="text-sm text-purple-700 mt-1 space-y-1">
                            <p>✓ Save your shipping information</p>
                            <p>✓ Track your orders easily</p>
                            <p>✓ Access exclusive member offers</p>
                            <p>✓ Build a wishlist of favorite items</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password fields - only show when create account is checked */}
                    {formData.createAccount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                              placeholder="Enter password"
                              minLength="6"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                              placeholder="Confirm password"
                              minLength="6"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div 
                    className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Place Order - ${formData.paymentMethod}`
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Order Summary */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.id} 
                    className="flex items-center space-x-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <img
                      src={item.image}
                      alt={`${item.name} in cart`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="border-t pt-6 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {formData.paymentMethod === PAYMENT_METHODS.COD && (
                  <div className="flex justify-between text-gray-600">
                    <span>Cash on Delivery Fee</span>
                    <span>${codFee.toFixed(2)}</span>
                  </div>
                )}
                {formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && (
                  <div className="flex justify-between text-gray-600">
                    <span>Bank Transfer Fee</span>
                    <span>${bankTransferFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {total < 50 && (
                <div className="mt-4 p-3 bg-accent-50 rounded-lg">
                  <p className="text-sm text-accent-800">
                    Add ${(50 - total).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Checkout;
