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
  async getProduct(id) {
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

  // Get featured products
  async getFeaturedProducts(limit = 6) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
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

// Orders Service
export const orderService = {
  // Create new order
  async createOrder(orderData, orderItems) {
    try {
      // Start a transaction-like process
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .insert({
          customer_name: orderData.name,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          address: orderData.address,
          payment_method: orderData.paymentMethod,
          total: orderData.total,
          status: ORDER_STATUS.PENDING,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Add order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))

      const { data: items, error: itemsError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .insert(orderItemsData)
        .select()

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of orderItems) {
        const { data: product } = await supabase
          .from(TABLES.PRODUCTS)
          .select('stock')
          .eq('id', item.id)
          .single()

        if (product) {
          await supabase
            .from(TABLES.PRODUCTS)
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.id)
        }
      }

      return { data: { order, items }, error: null }
    } catch (error) {
      console.error('Error creating order:', error)
      return { data: null, error: error.message }
    }
  },

  // Get order by ID
  async getOrder(orderId) {
    try {
      const { data: order, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (*)
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

  // Get all orders (for admin)
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ORDERS)
        .select(`
          *,
          order_items (
            *,
            products (name, image)
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
