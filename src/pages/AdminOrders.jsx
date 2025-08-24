import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Edit, Eye, Calendar, User, CreditCard, Truck, Check, Clock, X, Users, TrendingUp, ShoppingBag, DollarSign, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { orderService, authService, customerService } from '../services/database.js';
import { ORDER_STATUS } from '../lib/supabase.js';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [customerAnalytics, setCustomerAnalytics] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topCustomers: []
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomerData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    filterCustomers();
  }, [customers, customerSearchTerm]);

  const fetchOrders = async () => {
    try {
      const { data, error: fetchError } = await orderService.getAllOrders();
      
      if (fetchError) throw new Error(fetchError);
      
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    try {
      setCustomersLoading(true);
      
      // Get all orders to build customer analytics
      const { data: ordersData } = await orderService.getAllOrders();
      
      if (ordersData) {
        // Build customer analytics from orders
        const customerMap = new Map();
        let totalRevenue = 0;
        
        ordersData.forEach(order => {
          if (!order.is_guest_order && order.user_id) {
            const customerId = order.user_id;
            const customerEmail = order.customer_email;
            const customerName = order.customer_name;
            
            if (!customerMap.has(customerId)) {
              customerMap.set(customerId, {
                id: customerId,
                email: customerEmail,
                name: customerName,
                totalOrders: 0,
                totalSpent: 0,
                orders: [],
                lastOrderDate: null
              });
            }
            
            const customer = customerMap.get(customerId);
            customer.totalOrders++;
            customer.totalSpent += order.total || 0;
            customer.orders.push(order);
            
            if (!customer.lastOrderDate || new Date(order.created_at) > new Date(customer.lastOrderDate)) {
              customer.lastOrderDate = order.created_at;
            }
          }
          
          totalRevenue += order.total || 0;
        });
        
        const customersList = Array.from(customerMap.values());
        const totalCustomers = customersList.length;
        const averageOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0;
        const topCustomers = customersList
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10);
        
        setCustomers(customersList);
        setCustomerAnalytics({
          totalCustomers,
          totalRevenue,
          averageOrderValue,
          topCustomers
        });
      }
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err.message || 'Failed to fetch customer data');
    } finally {
      setCustomersLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by search term
    if (customerSearchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      const { data, error: updateError } = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (updateError) throw new Error(updateError);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return <Clock className="h-4 w-4" />;
      case ORDER_STATUS.CONFIRMED:
        return <Check className="h-4 w-4" />;
      case ORDER_STATUS.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case ORDER_STATUS.DELIVERED:
        return <Package className="h-4 w-4" />;
      case ORDER_STATUS.CANCELLED:
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderModal = ({ order, onClose, onUpdateStatus }) => {
    if (!order) return null;

    return (
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
                <p className="text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><strong>Name:</strong> {order.customer_name}</p>
                <p><strong>Email:</strong> {order.customer_email}</p>
                {order.customer_phone && <p><strong>Phone:</strong> {order.customer_phone}</p>}
                <p><strong>Address:</strong> {order.address}</p>
                <p><strong>Payment Method:</strong> {order.payment_method}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <img
                      src={item.products?.image}
                      alt={item.products?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.products?.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
              <div className="flex items-center space-x-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ORDER_STATUS).filter(status => status !== order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(order.id, status)}
                    disabled={updating}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      getStatusColor(status).replace('bg-', 'hover:bg-').replace('text-', 'hover:text-')
                    } bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">{status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Its My Choicee</title>
        <meta name="description" content="Manage customer orders and track order status" />
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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage orders and customer analytics</p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Package className="w-4 h-4 mr-2" />
                Orders Management
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`${
                  activeTab === 'customers'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className="w-4 h-4 mr-2" />
                Customer Analytics
              </button>
            </nav>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-md">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {orders.filter(order => order.status === 'delivered').length}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-md">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {orders.filter(order => ['pending', 'processing', 'shipped'].includes(order.status)).length}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-md">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
                  <p className="text-gray-600 mt-2">Manage customer orders and update status</p>
                </div>
                <div className="text-sm text-gray-500">
                  Total Orders: {orders.length}
                </div>
              </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                  >
                    <option value="All">All Status</option>
                    {Object.values(ORDER_STATUS).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <motion.tr 
                        key={order.id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.order_items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'All' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No orders have been placed yet.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Customer Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-2xl font-semibold text-gray-900">{customerAnalytics.totalCustomers}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-md">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">₹{customerAnalytics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-md">
                      <ShoppingBag className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                      <p className="text-2xl font-semibold text-gray-900">₹{customerAnalytics.averageOrderValue.toFixed(0)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-md">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">{customerAnalytics.totalOrders}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Customer Search */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Top Customers Table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Analytics</h3>
                  <p className="text-sm text-gray-600">View customer order history and spending</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Orders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer, index) => (
                        <motion.tr
                          key={customer.email || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-purple-600">
                                    {customer.name ? customer.name.charAt(0).toUpperCase() : 'G'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name || 'Guest Customer'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Customer ID: {customer.email ? customer.email.split('@')[0] : `guest-${index}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.email || 'No email provided'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.totalOrders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{customer.totalSpent.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer.totalOrders >= 5 
                                ? 'bg-green-100 text-green-800' 
                                : customer.totalOrders >= 2 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.totalOrders >= 5 ? 'VIP Customer' : customer.totalOrders >= 2 ? 'Regular' : 'New Customer'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {customerSearchTerm 
                        ? 'Try adjusting your search criteria.' 
                        : 'No customer data available yet.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Modal */}
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateOrderStatus}
          />
        )}
      </motion.div>
    </>
  );
};

export default AdminOrders;
