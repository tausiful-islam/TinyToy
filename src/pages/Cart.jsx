import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Minus, X, ShoppingBag, ArrowRight } from 'lucide-react'

export default function Cart({ cartItems, updateQuantity, removeFromCart }) {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const discount = promoApplied ? subtotal * 0.1 : 0 // 10% discount stub
  const total = subtotal - discount

  const handlePromoSubmit = (e) => {
    e.preventDefault()
    // Stub implementation - just toggle for demo
    if (promoCode.toLowerCase() === 'welcome10') {
      setPromoApplied(true)
    } else {
      setPromoApplied(false)
    }
  }

  const formatAttributesDisplay = (attributes) => {
    if (!attributes || Object.keys(attributes).length === 0) return ''
    
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' • ')
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - Its My Choicee</title>
          <meta name="description" content="Your shopping cart is currently empty. Browse our collection and add items to your cart." />
        </Helmet>

        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-8" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-lg text-gray-600 mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Shopping Cart ({cartItems.length}) - Its My Choicee</title>
        <meta name="description" content="Review your selected items and proceed to checkout. Your style, your choice at Its My Choicee." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Cart Items</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.cartKey} className="px-6 py-6">
                      <div className="flex items-center">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.variant?.image || item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 ml-6">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                <Link 
                                  to={`/product/${item.id}`}
                                  className="hover:text-purple-600 transition-colors"
                                >
                                  {item.name}
                                </Link>
                              </h3>
                              
                              {/* Variant Attributes */}
                              {item.attributes && Object.keys(item.attributes).length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatAttributesDisplay(item.attributes)}
                                </p>
                              )}
                              
                              <p className="text-lg font-medium text-gray-900 mt-2">
                                ${item.price}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.cartKey)}
                              className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove item"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center mt-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.cartKey, Math.max(0, item.quantity - 1))}
                                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              
                              <span className="px-4 py-2 text-gray-900 font-medium">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="ml-6 text-lg font-medium text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                </div>
                
                <div className="px-6 py-6 space-y-4">
                  {/* Promo Code */}
                  <form onSubmit={handlePromoSubmit} className="space-y-3">
                    <label htmlFor="promo-code" className="text-sm font-medium text-gray-700">
                      Promo Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="promo-code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoApplied && (
                      <p className="text-sm text-green-600">✓ WELCOME10 applied</p>
                    )}
                  </form>

                  {/* Order Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-green-600">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">Free</span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-lg font-medium">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="mt-6">
                    <Link
                      to="/checkout"
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>

                  {/* Continue Shopping */}
                  <div className="mt-4 text-center">
                    <Link
                      to="/products"
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      ← Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
