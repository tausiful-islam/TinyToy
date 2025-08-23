import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database table names
export const TABLES = {
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  WISHLISTS: 'wishlists',
  REVIEWS: 'reviews',
  CUSTOMER_PROFILES: 'customer_profiles',
  CUSTOMER_ADDRESSES: 'customer_addresses',
  NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers',
  CONTACT_SUBMISSIONS: 'contact_submissions'
}

// Order status options
export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
}

// Payment methods
export const PAYMENT_METHODS = {
  COD: 'Cash on Delivery',
  BANK_TRANSFER: 'Bank Transfer'
}
