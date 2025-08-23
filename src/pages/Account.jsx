import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { customerService, orderService } from '../services/database'
import { 
  User, 
  MapPin, 
  Clock, 
  Settings,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle
} from 'lucide-react'

const Account = () => {
  const { user, updateProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Profile state
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    preferences: {}
  })

  // Addresses state
  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    title: '',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Bangladesh',
    is_default: false
  })

  // Orders state
  const [orders, setOrders] = useState([])

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true
  })

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // Handle URL tab parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'orders', 'addresses', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Load profile
      const { data: profileData } = await customerService.getProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }

      // Load addresses
      const { data: addressData } = await customerService.getAddresses(user.id)
      if (addressData) {
        setAddresses(addressData)
      }

      // Load order history
      const { data: orderData } = await orderService.getOrderHistory(user.id)
      if (orderData) {
        setOrders(orderData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error: updateError } = await customerService.updateProfile(user.id, profile)
      
      if (updateError) {
        throw new Error(updateError)
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (editingAddress) {
        const { error: updateError } = await customerService.updateAddress(
          user.id, 
          editingAddress.id, 
          addressForm
        )
        if (updateError) throw new Error(updateError)
      } else {
        const { error: addError } = await customerService.addAddress(user.id, addressForm)
        if (addError) throw new Error(addError)
      }

      // Reload addresses
      const { data: addressData } = await customerService.getAddresses(user.id)
      if (addressData) {
        setAddresses(addressData)
      }

      resetAddressForm()
      setMessage('Address saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setLoading(true)
    try {
      const { error } = await customerService.deleteAddress(user.id, addressId)
      if (error) throw new Error(error)

      // Reload addresses
      const { data: addressData } = await customerService.getAddresses(user.id)
      if (addressData) {
        setAddresses(addressData)
      }

      setMessage('Address deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    setLoading(true)
    try {
      const { error } = await customerService.setDefaultAddress(user.id, addressId)
      if (error) throw new Error(error)

      // Reload addresses
      const { data: addressData } = await customerService.getAddresses(user.id)
      if (addressData) {
        setAddresses(addressData)
      }

      setMessage('Default address updated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      full_name: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Bangladesh',
      is_default: false
    })
    setEditingAddress(null)
    setShowAddressForm(false)
  }

  const startEditAddress = (address) => {
    setAddressForm(address)
    setEditingAddress(address)
    setShowAddressForm(true)
  }

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'Confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'Shipped':
        return <Truck className="w-5 h-5 text-purple-500" />
      case 'Delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile Info', icon: User },
    { id: 'orders', name: 'Order History', icon: Clock },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
    { id: 'settings', name: 'Account Settings', icon: Settings }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access your account</h2>
          <a href="/login" className="text-indigo-600 hover:text-indigo-500">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md"
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
          >
            {error}
          </motion.div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                    } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              {/* Profile Info Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          value={profile.first_name || ''}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          value={profile.last_name || ''}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input
                          type="date"
                          value={profile.date_of_birth || ''}
                          onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Order History Tab */}
              {activeTab === 'orders' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Order #{order.id}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {getOrderStatusIcon(order.status)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                <img
                                  src={item.product_variants?.image || item.products?.image || '/placeholder.jpg'}
                                  alt={item.products?.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {item.products?.name}
                                  </h4>
                                  {item.attributes && (
                                    <p className="text-sm text-gray-500">
                                      {Object.entries(item.attributes).map(([key, value]) => 
                                        `${key}: ${value}`
                                      ).join(', ')}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  ৳{(item.price * item.quantity).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                            <span className="text-sm text-gray-500">Payment: {order.payment_method}</span>
                            <span className="text-lg font-bold text-gray-900">
                              Total: ৳{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </button>
                  </div>

                  {/* Address Form */}
                  {showAddressForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 border border-gray-200 rounded-lg p-6 bg-gray-50"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                              type="text"
                              value={addressForm.title}
                              onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                              placeholder="e.g., Home, Office"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                              type="text"
                              value={addressForm.full_name}
                              onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="tel"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                            <input
                              type="text"
                              value={addressForm.address_line_1}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                            <input
                              type="text"
                              value={addressForm.address_line_2}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input
                              type="text"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">State/Division</label>
                            <input
                              type="text"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                            <input
                              type="text"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Country</label>
                            <select
                              value={addressForm.country}
                              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="Bangladesh">Bangladesh</option>
                              <option value="India">India</option>
                              <option value="Pakistan">Pakistan</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                            Set as default address
                          </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={resetAddressForm}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Address List */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No saved addresses</h3>
                      <p className="mt-1 text-sm text-gray-500">Add an address to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 ${
                            address.is_default ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">{address.title}</h3>
                            {address.is_default && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Default
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium">{address.full_name}</p>
                            <p>{address.phone}</p>
                            <p>{address.address_line_1}</p>
                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                            <p>{address.city}, {address.state} {address.postal_code}</p>
                            <p>{address.country}</p>
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <button
                              onClick={() => startEditAddress(address)}
                              className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            
                            {!address.is_default && (
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="flex items-center text-sm text-green-600 hover:text-green-500"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Set Default
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="flex items-center text-sm text-red-600 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Account Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Notification Preferences */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-base font-medium text-gray-900">Email Notifications</label>
                            <p className="text-sm text-gray-500">Receive order updates and promotions via email</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={accountSettings.email_notifications}
                            onChange={(e) => setAccountSettings({
                              ...accountSettings,
                              email_notifications: e.target.checked
                            })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-base font-medium text-gray-900">SMS Notifications</label>
                            <p className="text-sm text-gray-500">Receive order updates via SMS</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={accountSettings.sms_notifications}
                            onChange={(e) => setAccountSettings({
                              ...accountSettings,
                              sms_notifications: e.target.checked
                            })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-base font-medium text-gray-900">Marketing Emails</label>
                            <p className="text-sm text-gray-500">Receive promotional offers and product updates</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={accountSettings.marketing_emails}
                            onChange={(e) => setAccountSettings({
                              ...accountSettings,
                              marketing_emails: e.target.checked
                            })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Change */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Security</h3>
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            // Navigate to password reset or show password change form
                            alert('Password change functionality would be implemented here')
                          }}
                          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Delete Account
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                Once you delete your account, there is no going back. Please be certain.
                              </p>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                    alert('Account deletion functionality would be implemented here')
                                  }
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                Delete Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Account
