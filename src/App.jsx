import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Cart from './components/Cart';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import CartPage from './pages/Cart';
import Wishlist from './pages/Wishlist';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Account from './pages/Account';
import AdminLogin from './pages/AdminLogin';
import AdminOrders from './pages/AdminOrders';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('itsmychoicee_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }

    const savedWishlist = localStorage.getItem('itsmychoicee_wishlist');
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('itsmychoicee_cart', JSON.stringify(cartItems));
    // Dispatch event for cart updates
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cartItems]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('itsmychoicee_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Add item to cart with variant support
  const addToCart = (product, variant = null, attributes = null, quantity = 1) => {
    setCartItems(prevItems => {
      const cartKey = variant ? `${product.id}-${variant.id}` : `${product.id}`;
      const existingItem = prevItems.find(item => 
        variant 
          ? (item.id === product.id && item.variant?.id === variant.id)
          : item.id === product.id && !item.variant
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          (variant 
            ? (item.id === product.id && item.variant?.id === variant.id)
            : item.id === product.id && !item.variant)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem = {
          ...product,
          cartKey,
          quantity,
          variant,
          attributes,
          // Use variant price if available, otherwise product price
          price: variant?.price || product.price
        };
        return [...prevItems, newItem];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(cartKey);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cartKey === cartKey
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Remove item from cart
  const removeFromCart = (cartKey) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartKey !== cartKey));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlistItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (!existingItem) {
        return [...prevItems, product];
      }
      return prevItems;
    });
  };

  // Remove item from wishlist
  const removeFromWishlist = (productId) => {
    setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Clear wishlist
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  // Toggle cart visibility
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Header />
            
            <Cart
              isOpen={isCartOpen}
              toggleCart={toggleCart}
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />

            <main>
              <Routes>
                <Route 
                  path="/" 
                  element={<Home addToCart={addToCart} addToWishlist={addToWishlist} isInWishlist={isInWishlist} removeFromWishlist={removeFromWishlist} />} 
                />
                <Route 
                  path="/products" 
                  element={<Products addToCart={addToCart} addToWishlist={addToWishlist} isInWishlist={isInWishlist} removeFromWishlist={removeFromWishlist} />} 
                />
                <Route 
                  path="/product/:id" 
                  element={<ProductDetail addToCart={addToCart} addToWishlist={addToWishlist} isInWishlist={isInWishlist} removeFromWishlist={removeFromWishlist} />} 
                />
                <Route 
                  path="/cart" 
                  element={<CartPage cartItems={cartItems} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} 
                />
                <Route 
                  path="/about" 
                  element={<About />} 
                />
                <Route 
                  path="/contact" 
                  element={<Contact />} 
                />
                <Route 
                  path="/checkout" 
                  element={<Checkout cartItems={cartItems} clearCart={clearCart} />} 
                />
                <Route 
                  path="/wishlist" 
                  element={<Wishlist wishlistItems={wishlistItems} addToCart={addToCart} removeFromWishlist={removeFromWishlist} />} 
                />
                <Route 
                  path="/order/:orderId" 
                  element={<OrderTracking />} 
                />
                <Route 
                  path="/login" 
                  element={<Login />} 
                />
                <Route 
                  path="/signup" 
                  element={<SignUp />} 
                />
                <Route 
                  path="/account" 
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/login" 
                  element={<AdminLogin />} 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <ProtectedRoute>
                      <AdminOrders />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
