import { supabase, TABLES, ORDER_STATUS } from '../lib/supabase.js'

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
      console.error('Error fetching products:', error)
      return { data: null, error: error.message }
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
      console.error('Error fetching product:', error)
      return { data: null, error: error.message }
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
      console.error('Error fetching featured products:', error)
      return { data: null, error: error.message }
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
      if (cartItems && Array.isArray(cartItems)) {
        // New format: orderInput is customer data, cartItems is separate
        orderData = {
          customer_name: orderInput.name || orderInput.customer_name,
          customer_email: orderInput.email || orderInput.customer_email,
          customer_phone: orderInput.phone || orderInput.customer_phone,
          customer_id: user ? user.id : null, // Link to user if authenticated
          address: orderInput.address,
          payment_method: orderInput.paymentMethod || orderInput.payment_method,
          total: orderInput.total,
          notes: orderInput.notes || null,
          status: ORDER_STATUS.PENDING,
          created_at: new Date().toISOString()
        };
      } else {
        // Legacy format: orderInput contains everything
        orderData = {
          customer_name: orderInput.customer_name,
          customer_email: orderInput.customer_email,
          customer_phone: orderInput.customer_phone,
          customer_id: user ? user.id : null, // Link to user if authenticated
          address: orderInput.address,
          payment_method: orderInput.payment_method,
          total: orderInput.total,
          notes: orderInput.notes,
          status: ORDER_STATUS.PENDING,
          created_at: new Date().toISOString()
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

  // Get order by ID with variant information
  async getOrder(orderId) {
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
        .single()

      if (orderError) throw orderError
      return { data: order, error: null }
    } catch (error) {
      console.error('Error fetching order:', error)
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
        .eq('customer_id', userId)
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
        .eq('customer_id', userId)
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
  },

  // Check if user has specific role
  hasRole(user, role) {
    return user?.user_metadata?.role === role
  },

  // Check if user is admin
  isAdmin(user) {
    return this.hasRole(user, 'admin')
  },

  // Check if user is customer
  isCustomer(user) {
    return this.hasRole(user, 'customer') || (!user?.user_metadata?.role && user)
  },

  // Get user display name
  getUserDisplayName(user) {
    if (!user) return null
    
    const metadata = user.user_metadata || {}
    return metadata.full_name || metadata.firstName || user.email || 'User'
  }
}

// Wishlist Service
export const wishlistService = {
  // Get user wishlist
  async getWishlist(userId) {
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

  // Add to wishlist
  async addToWishlist(userId, productId) {
    try {
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

  // Remove from wishlist
  async removeFromWishlist(userId, productId) {
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
  }
}
