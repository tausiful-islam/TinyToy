import { supabase, TABLES, ORDER_STATUS } from '../lib/supabase.js'
import { products as fallbackProducts } from '../data/products.js'
import { authService } from './authService.js'

// Products Service
export const productService = {
  // Get all products with optional filtering
  async getProducts(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .gt('stock', 0) // Only show products with stock

      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching products from Supabase, using fallback data:', error)
      
      // Return fallback data when Supabase fails
      let filteredProducts = fallbackProducts.filter(product => product.stock > 0)
      
      if (filters.category && filters.category !== 'All') {
        filteredProducts = filteredProducts.filter(product => product.category === filters.category)
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        )
      }
      
      if (filters.limit) {
        filteredProducts = filteredProducts.slice(0, filters.limit)
      }
      
      return { data: filteredProducts, error: null }
    }
  },

  // Get single product by ID
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching product from Supabase, using fallback data:', error)
      
      // Return fallback data when Supabase fails
      const product = fallbackProducts.find(p => p.id === parseInt(id))
      return { data: product || null, error: null }
    }
  },

  // Get product by ID (legacy method name for compatibility)
  async getProduct(id) {
    return this.getProductById(id)
  },

  // Get featured products
  async getFeaturedProducts(limit = 6) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('featured', true)
        .gt('stock', 0)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching featured products from Supabase, using fallback data:', error)
      
      // Return fallback data when Supabase fails
      const featuredProducts = fallbackProducts
        .filter(product => product.featured && product.stock > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit)
      
      return { data: featuredProducts, error: null }
    }
  },

  // Update product stock
  async updateStock(productId, newStock) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({ stock: newStock })
        .eq('id', productId)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating stock:', error)
      return { data: null, error: error.message }
    }
  }
}

// Product Variants Service
export const variantService = {
  // Get all variants for a product
  async getVariantsForProduct(productId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching variants:', error)
      return { data: null, error: error.message }
    }
  },

  // Get distinct attribute keys and possible values for a product
  async getVariantAttributeMatrix(productId) {
    try {
      const { data: variants, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .select('attributes')
        .eq('product_id', productId)
        .eq('active', true)

      if (error) throw error

      if (!variants || variants.length === 0) {
        return { data: {}, error: null }
      }

      // Build attribute matrix
      const matrix = {}
      variants.forEach(variant => {
        const attrs = variant.attributes || {}
        Object.keys(attrs).forEach(key => {
          if (!matrix[key]) {
            matrix[key] = new Set()
          }
          matrix[key].add(attrs[key])
        })
      })

      // Convert Sets to Arrays
      const result = {}
      Object.keys(matrix).forEach(key => {
        result[key] = Array.from(matrix[key]).sort()
      })

      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching attribute matrix:', error)
      return { data: null, error: error.message }
    }
  },

  // Check if a selection maps to a valid, active, in-stock variant
  async resolveVariant(productId, attributes) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .eq('attributes', JSON.stringify(attributes))
        .gt('stock', 0)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return { data: data || null, error: null }
    } catch (error) {
      console.error('Error resolving variant:', error)
      return { data: null, error: error.message }
    }
  },

  // Get variant by ID
  async getVariantById(variantId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .select('*')
        .eq('id', variantId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching variant:', error)
      return { data: null, error: error.message }
    }
  },

  // Create variant (admin)
  async createVariant(variantData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .insert(variantData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating variant:', error)
      return { data: null, error: error.message }
    }
  },

  // Update variant (admin)
  async updateVariant(variantId, variantData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .update(variantData)
        .eq('id', variantId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating variant:', error)
      return { data: null, error: error.message }
    }
  },

  // Delete variant (admin)
  async deleteVariant(variantId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_VARIANTS)
        .delete()
        .eq('id', variantId)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error deleting variant:', error)
      return { data: null, error: error.message }
    }
  }
}

// Orders Service
export const orderService = {
  // Create new order with variant support and user linking
  async createOrder(orderInput, cartItems, user = null) {
    try {
      // Prepare order data - support both old and new formats
      let orderData;
      const isAuthenticated = user && user.id;
      
      if (cartItems && Array.isArray(cartItems)) {
        // New format: orderInput is customer data, cartItems is separate
        orderData = {
          customer_name: orderInput.name || orderInput.customer_name,
          customer_email: orderInput.email || orderInput.customer_email,
          customer_phone: orderInput.phone || orderInput.customer_phone,
          user_id: isAuthenticated ? user.id : null, // Link to user if authenticated
          address: orderInput.address,
          payment_method: orderInput.paymentMethod || orderInput.payment_method,
          total: orderInput.total,
          notes: orderInput.notes || null,
          status: ORDER_STATUS.PENDING
        };
      } else {
        // Legacy format: orderInput contains everything
        orderData = {
          customer_name: orderInput.customer_name,
          customer_email: orderInput.customer_email,
          customer_phone: orderInput.customer_phone,
          user_id: isAuthenticated ? user.id : null, // Link to user if authenticated
          address: orderInput.address,
          payment_method: orderInput.payment_method,
          total: orderInput.total,
          notes: orderInput.notes,
          status: ORDER_STATUS.PENDING
        };
        cartItems = orderInput.items; // Items are in orderInput for legacy format
      }

      // Start a transaction-like process
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Prepare order items data
      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id || item.id, // Support both formats
        variant_id: item.variant_id || item.variant?.id || null,
        attributes: item.attributes || null,
        quantity: item.quantity,
        price: item.variant?.price || item.price // Use variant price if available
      }))

      const { data: items, error: itemsError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .insert(orderItemsData)
        .select()

      if (itemsError) throw itemsError

      // Update stock (variant stock if variant exists, otherwise product stock)
      for (const item of cartItems) {
        const variantId = item.variant_id || item.variant?.id;
        const productId = item.product_id || item.id;
        
        if (variantId) {
          // Update variant stock
          const { data: variant } = await supabase
            .from(TABLES.PRODUCT_VARIANTS)
            .select('stock')
            .eq('id', variantId)
            .single()

          if (variant) {
            await supabase
              .from(TABLES.PRODUCT_VARIANTS)
              .update({ stock: variant.stock - item.quantity })
              .eq('id', variantId)
          }
        } else {
          // Update product stock
          const { data: product } = await supabase
            .from(TABLES.PRODUCTS)
            .select('stock')
            .eq('id', productId)
            .single()

          if (product) {
            await supabase
              .from(TABLES.PRODUCTS)
              .update({ stock: product.stock - item.quantity })
              .eq('id', productId)
          }
        }
      }

      return { data: { order, items }, error: null }
    } catch (error) {
      console.error('Error creating order:', error)
      return { data: null, error: error.message }
    }
  },

  // Get order by ID with variant information and user permission checks
  async getOrder(orderId, user = null) {
    try {
      let query = supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (*),
            product_variants (*)
          )
        `)
        .eq('id', orderId)

      // If user is provided, add permission check for non-admin users
      if (user && !authService.isAdmin(user)) {
        query = query.eq('user_id', user.id)
      }

      const { data: order, error: orderError } = await query.single()

      if (orderError) throw orderError
      return { data: order, error: null }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { data: null, error: error.message }
    }
  },

  // Get order history for authenticated users
  async getOrderHistory(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (name, image, price),
            product_variants (attributes, image, price)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching order history:', error)
      return { data: null, error: error.message }
    }
  },

  // Get orders for a specific user (order history)
  async getUserOrders(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (name, image),
            product_variants (attributes, image)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user orders:', error)
      return { data: null, error: error.message }
    }
  },

  // Get order by ID for a specific user (security check)
  async getUserOrder(userId, orderId) {
    try {
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (*),
            product_variants (*)
          )
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (orderError) throw orderError
      return { data: order, error: null }
    } catch (error) {
      console.error('Error fetching user order:', error)
      return { data: null, error: error.message }
    }
  },

  // Get all orders (for admin) with variant information
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (name, image),
            product_variants (attributes, image)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return { data: null, error: error.message }
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { data: null, error: error.message }
    }
  }
}

// Auth Service
export const authService = {
  // Admin login
  async adminLogin(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error logging in:', error)
      return { data: null, error: error.message }
    }
  },

  // Customer sign up with email verification
  async signUp(email, password, userData = {}) {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }
      if (!/(?=.*[a-z])/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter')
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter')
      }
      if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least one number')
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/.test(password)) {
        throw new Error('Password must contain at least one special character')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            role: 'customer'
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error: error.message }
    }
  },

  // Customer sign in
  async signIn(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error: error.message }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      if (!email) {
        throw new Error('Email is required')
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { data: null, error: error.message }
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      // Validate password strength
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }
      if (!/(?=.*[a-z])/.test(newPassword)) {
        throw new Error('Password must contain at least one lowercase letter')
      }
      if (!/(?=.*[A-Z])/.test(newPassword)) {
        throw new Error('Password must contain at least one uppercase letter')
      }
      if (!/(?=.*\d)/.test(newPassword)) {
        throw new Error('Password must contain at least one number')
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/.test(newPassword)) {
        throw new Error('Password must contain at least one special character')
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating password:', error)
      return { data: null, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error: error.message }
    }
  },

  // Get current user
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { data: user, error: null }
    } catch (error) {
      console.error('Error getting user:', error)
      return { data: null, error: error.message }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { data: session, error: null }
    } catch (error) {
      console.error('Error getting session:', error)
      return { data: null, error: error.message }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error.message }
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Wishlist Service
export const wishlistService = {
  // Get user wishlist (supports both authenticated and guest users)
  async getWishlist(userId = null) {
    if (!userId) {
      // Return localStorage wishlist for guest users
      return this.getLocalWishlist()
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Add to wishlist (supports both authenticated and guest users)
  async addToWishlist(userId = null, productId, productData = null) {
    if (!userId) {
      // Add to localStorage for guest users
      return this.addToLocalWishlist(productId, productData)
    }

    try {
      // Check if item already exists in database
      const { data: existing } = await supabase
        .from(TABLES.WISHLISTS)
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single()

      if (existing) {
        return { data: existing, error: null } // Already in wishlist
      }

      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .insert({ user_id: userId, product_id: productId })
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Remove from wishlist (supports both authenticated and guest users)
  async removeFromWishlist(userId = null, productId) {
    if (!userId) {
      // Remove from localStorage for guest users
      return this.removeFromLocalWishlist(productId)
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Check if item is in wishlist (supports both authenticated and guest users)
  async isInWishlist(userId = null, productId) {
    if (!userId) {
      // Check localStorage for guest users
      const localWishlist = this.getLocalWishlistIds()
      return localWishlist.includes(productId.toString())
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (error) {
      console.error('Error checking wishlist item:', error)
      return false
    }
  },

  // Sync localStorage wishlist to database when user logs in
  async syncLocalWishlistToDatabase(userId) {
    try {
      const localWishlist = this.getLocalWishlistData()
      if (!localWishlist || localWishlist.length === 0) {
        return { data: [], error: null }
      }

      // Get existing database wishlist to avoid duplicates
      const { data: existingWishlist } = await this.getWishlist(userId)
      const existingProductIds = new Set(
        existingWishlist?.map(item => item.product_id.toString()) || []
      )

      // Filter out items that already exist in database
      const itemsToSync = localWishlist.filter(
        item => !existingProductIds.has(item.id.toString())
      )

      if (itemsToSync.length === 0) {
        // Clear localStorage since everything is already in database
        this.clearLocalWishlist()
        return { data: [], error: null }
      }

      // Insert new items into database
      const insertData = itemsToSync.map(item => ({
        user_id: userId,
        product_id: item.id
      }))

      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .insert(insertData)
        .select()

      if (error) throw error

      // Clear localStorage after successful sync
      this.clearLocalWishlist()

      return { data, error: null }
    } catch (error) {
      console.error('Error syncing wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Clear entire wishlist (supports both authenticated and guest users)
  async clearWishlist(userId = null) {
    if (!userId) {
      // Clear localStorage for guest users
      return this.clearLocalWishlist()
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.WISHLISTS)
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error clearing wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // === Local Storage Methods for Guest Users ===

  // Get wishlist from localStorage
  getLocalWishlist() {
    try {
      const wishlist = localStorage.getItem('itsmychoicee_wishlist')
      const data = wishlist ? JSON.parse(wishlist) : []
      return { data, error: null }
    } catch (error) {
      console.error('Error reading local wishlist:', error)
      return { data: [], error: error.message }
    }
  },

  // Get wishlist data from localStorage
  getLocalWishlistData() {
    try {
      const wishlist = localStorage.getItem('itsmychoicee_wishlist')
      return wishlist ? JSON.parse(wishlist) : []
    } catch (error) {
      console.error('Error reading local wishlist data:', error)
      return []
    }
  },

  // Get just the product IDs from localStorage wishlist
  getLocalWishlistIds() {
    try {
      const wishlist = this.getLocalWishlistData()
      return wishlist.map(item => item.id.toString())
    } catch (error) {
      console.error('Error getting local wishlist IDs:', error)
      return []
    }
  },

  // Add item to localStorage wishlist
  addToLocalWishlist(productId, productData) {
    try {
      const currentWishlist = this.getLocalWishlistData()
      const existingItem = currentWishlist.find(item => item.id.toString() === productId.toString())
      
      if (existingItem) {
        return { data: existingItem, error: null } // Already in wishlist
      }

      const newItem = productData || { id: productId }
      const updatedWishlist = [...currentWishlist, newItem]
      
      localStorage.setItem('itsmychoicee_wishlist', JSON.stringify(updatedWishlist))
      
      // Dispatch event for wishlist updates
      window.dispatchEvent(new Event('wishlistUpdated'))
      
      return { data: newItem, error: null }
    } catch (error) {
      console.error('Error adding to local wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Remove item from localStorage wishlist
  removeFromLocalWishlist(productId) {
    try {
      const currentWishlist = this.getLocalWishlistData()
      const updatedWishlist = currentWishlist.filter(
        item => item.id.toString() !== productId.toString()
      )
      
      localStorage.setItem('itsmychoicee_wishlist', JSON.stringify(updatedWishlist))
      
      // Dispatch event for wishlist updates
      window.dispatchEvent(new Event('wishlistUpdated'))
      
      return { data: updatedWishlist, error: null }
    } catch (error) {
      console.error('Error removing from local wishlist:', error)
      return { data: null, error: error.message }
    }
  },

  // Clear localStorage wishlist
  clearLocalWishlist() {
    try {
      localStorage.removeItem('itsmychoicee_wishlist')
      
      // Dispatch event for wishlist updates
      window.dispatchEvent(new Event('wishlistUpdated'))
      
      return { data: [], error: null }
    } catch (error) {
      console.error('Error clearing local wishlist:', error)
      return { data: null, error: error.message }
    }
  }
}

// Customer Service
export const customerService = {
  // Get customer profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return { data: data || null, error: null }
    } catch (error) {
      console.error('Error fetching customer profile:', error)
      return { data: null, error: error.message }
    }
  },

  // Update customer profile
  async updateProfile(userId, profileData) {
    try {
      // Check if profile exists
      const { data: existingProfile } = await this.getProfile(userId)

      let data, error

      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from(TABLES.CUSTOMER_PROFILES)
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()

        data = result.data
        error = result.error
      } else {
        // Create new profile
        const result = await supabase
          .from(TABLES.CUSTOMER_PROFILES)
          .insert({
            user_id: userId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        data = result.data
        error = result.error
      }

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating customer profile:', error)
      return { data: null, error: error.message }
    }
  },

  // Get customer addresses
  async getAddresses(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching customer addresses:', error)
      return { data: null, error: error.message }
    }
  },

  // Add new address
  async addAddress(userId, addressData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .insert({
          user_id: userId,
          ...addressData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // If this is set as default, unset other defaults
      if (addressData.is_default) {
        await this.setDefaultAddress(userId, data.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error adding customer address:', error)
      return { data: null, error: error.message }
    }
  },

  // Update address
  async updateAddress(userId, addressId, addressData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .update({
          ...addressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', userId) // Security check
        .select()
        .single()

      if (error) throw error

      // If this is set as default, unset other defaults
      if (addressData.is_default) {
        await this.setDefaultAddress(userId, addressId)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating customer address:', error)
      return { data: null, error: error.message }
    }
  },

  // Delete address
  async deleteAddress(userId, addressId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId) // Security check
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error deleting customer address:', error)
      return { data: null, error: error.message }
    }
  },

  // Set default address
  async setDefaultAddress(userId, addressId) {
    try {
      // First, unset all defaults for this user
      await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .update({ is_default: false })
        .eq('user_id', userId)

      // Then set the specified address as default
      const { data, error } = await supabase
        .from(TABLES.CUSTOMER_ADDRESSES)
        .update({ 
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', userId) // Security check
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error setting default address:', error)
      return { data: null, error: error.message }
    }
  }
}

// Newsletter Service
export const newsletterService = {
  // Subscribe to newsletter
  async subscribe(email, name = null, source = 'website') {
    try {
      const { data, error } = await supabase
        .from(TABLES.NEWSLETTER_SUBSCRIBERS)
        .insert([{
          email: email.toLowerCase().trim(),
          name: name?.trim(),
          source,
          status: 'active',
          subscribed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          return { data: null, error: 'Email already subscribed to newsletter' }
        }
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return { data: null, error: error.message }
    }
  },

  // Unsubscribe from newsletter
  async unsubscribe(email) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NEWSLETTER_SUBSCRIBERS)
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim())
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error)
      return { data: null, error: error.message }
    }
  },

  // Get newsletter subscriber by email
  async getSubscriber(email) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NEWSLETTER_SUBSCRIBERS)
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null } // No subscriber found
        }
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error getting newsletter subscriber:', error)
      return { data: null, error: error.message }
    }
  },

  // Get all active subscribers (admin only)
  async getAllSubscribers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.NEWSLETTER_SUBSCRIBERS)
        .select('*')
        .eq('status', 'active')
        .order('subscribed_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting newsletter subscribers:', error)
      return { data: null, error: error.message }
    }
  }
}

// Contact Form Service
export const contactService = {
  // Submit contact form
  async submitContactForm(formData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_SUBMISSIONS)
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          subject: formData.subject?.trim(),
          message: formData.message.trim(),
          status: 'new'
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      return { data: null, error: error.message }
    }
  },

  // Get contact submissions for user
  async getUserSubmissions(email) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_SUBMISSIONS)
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting user contact submissions:', error)
      return { data: null, error: error.message }
    }
  },

  // Get all contact submissions (admin only)
  async getAllSubmissions() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_SUBMISSIONS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting all contact submissions:', error)
      return { data: null, error: error.message }
    }
  },

  // Update submission status (admin only)
  async updateSubmissionStatus(submissionId, status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_SUBMISSIONS)
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating submission status:', error)
      return { data: null, error: error.message }
    }
  }
}
