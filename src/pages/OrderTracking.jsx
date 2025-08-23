import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, Check, Clock, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { orderService } from '../services/database.js';
import { ORDER_STATUS } from '../lib/supabase.js';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await orderService.getOrder(orderId);
        
        if (fetchError) throw new Error(fetchError);
        
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return <Clock className="h-6 w-6" />;
      case ORDER_STATUS.CONFIRMED:
        return <Check className="h-6 w-6" />;
      case ORDER_STATUS.SHIPPED:
        return <Truck className="h-6 w-6" />;
      case ORDER_STATUS.DELIVERED:
        return <Package className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case ORDER_STATUS.CONFIRMED:
        return 'text-blue-600 bg-blue-100';
      case ORDER_STATUS.SHIPPED:
        return 'text-purple-600 bg-purple-100';
      case ORDER_STATUS.DELIVERED:
        return 'text-green-600 bg-green-100';
      case ORDER_STATUS.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 25;
      case ORDER_STATUS.CONFIRMED:
        return 50;
      case ORDER_STATUS.SHIPPED:
        return 75;
      case ORDER_STATUS.DELIVERED:
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Order Not Found - Its My Choicee</title>
          <meta name="description" content="Order tracking page" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
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
  <title>Order #{order.id} - Its My Choicee</title>
        <meta name="description" content={`Track your order #${order.id} status and delivery information`} />
      </Helmet>
      <motion.div 
        className="min-h-screen bg-gray-50 pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.id}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Status */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Status Overview */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
                
                {/* Current Status */}
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${getStatusColor(order.status)} mb-6`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 font-medium">{order.status}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Order Progress</span>
                    <span>{getProgressPercentage(order.status)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-primary-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(order.status)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  {[
                    { status: ORDER_STATUS.PENDING, label: 'Order Placed', description: 'We received your order' },
                    { status: ORDER_STATUS.CONFIRMED, label: 'Order Confirmed', description: 'We confirmed your order details' },
                    { status: ORDER_STATUS.SHIPPED, label: 'Order Shipped', description: 'Your order is on the way' },
                    { status: ORDER_STATUS.DELIVERED, label: 'Order Delivered', description: 'Your order has been delivered' }
                  ].map((step, index) => {
                    const isCompleted = getProgressPercentage(order.status) > (index * 25);
                    const isCurrent = step.status === order.status;
                    
                    return (
                      <div key={step.status} className="flex items-center">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted || isCurrent ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-500'
                        }`}>
                          {isCompleted ? <Check className="h-4 w-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="ml-4">
                          <p className={`font-medium ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
                <div className="space-y-4">
                  {order.order_items?.map((item) => (
                    <motion.div 
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <img
                        src={item.products?.image}
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.products?.name}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Order Summary & Details */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <p className="text-sm text-gray-600">{order.customer_email}</p>
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <p className="text-sm text-gray-600">{order.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-medium text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="text-gray-900">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Status</span>
                    <span className={`font-medium ${order.status === ORDER_STATUS.DELIVERED ? 'text-green-600' : 'text-primary-600'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-primary-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you have any questions about your order, feel free to contact us.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">📧 Email: support@itsmychoicee.com</p>
                  <p className="text-gray-600">📱 WhatsApp: +1 (555) 123-4567</p>
                  <p className="text-gray-600">🕒 Support Hours: 9 AM - 6 PM</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default OrderTracking;
