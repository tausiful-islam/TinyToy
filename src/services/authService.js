// Complete Authentication Service using Supabase Auth
// File: src/services/authService.js
// Includes: signUp, signIn, signOut, getUser, resetPassword, email verification

import { supabase } from '../lib/supabase.js'

// Password validation regex
const PASSWORD_REGEX = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumbers: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate password requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = []
  
  if (!password || password.length < PASSWORD_REGEX.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REGEX.minLength} characters long`)
  }
  
  if (!PASSWORD_REGEX.hasUpperCase.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!PASSWORD_REGEX.hasLowerCase.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!PASSWORD_REGEX.hasNumbers.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!PASSWORD_REGEX.hasSpecialChar.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const validateEmail = (email) => {
  return EMAIL_REGEX.test(email)
}

/**
 * Complete Authentication Service
 */
export const authService = {
  
  /**
   * User Registration (Sign Up)
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} userData - Additional user data (firstName, lastName, phone)
   * @returns {Promise<object>} - Registration result
   */
  async signUp(email, password, userData = {}) {
    try {
      // Validate email format
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password requirements
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0])
      }

      // Attempt to sign up user
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            phone: userData.phone || '',
            full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            user_type: 'customer'
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
          throw new Error('An account with this email already exists')
        }
        if (error.message.includes('invalid email')) {
          throw new Error('Please enter a valid email address')
        }
        if (error.message.includes('weak password')) {
          throw new Error('Password is too weak. Please choose a stronger password.')
        }
        throw new Error(error.message)
      }

      return { 
        data, 
        error: null,
        needsVerification: !data.user?.email_confirmed_at,
        message: data.user?.email_confirmed_at 
          ? 'Account created successfully!' 
          : 'Please check your email to verify your account.'
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to create account. Please try again.',
        needsVerification: false
      }
    }
  },

  /**
   * User Login (Sign In)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - Login result
   */
  async signIn(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        // Handle specific authentication errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in')
        }
        if (error.message.includes('too many requests')) {
          throw new Error('Too many login attempts. Please try again later.')
        }
        throw new Error(error.message)
      }

      // Check if user email is verified
      if (!data.user?.email_confirmed_at) {
        throw new Error('Please verify your email address before signing in')
      }

      return { 
        data, 
        error: null,
        user: data.user,
        session: data.session,
        message: 'Successfully signed in!'
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to sign in. Please try again.',
        user: null,
        session: null
      }
    }
  },

  /**
   * Admin Login (Separate from customer login)
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<object>} - Admin login result
   */
  async adminLogin(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Check if using demo credentials
      const demoEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@itsmychoicee.com'
      const demoPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
      
      if (email === demoEmail && password === demoPassword) {
        // Demo admin login (when Supabase not set up)
        const demoUser = {
          id: 'demo-admin-id',
          email: demoEmail,
          user_metadata: {
            user_type: 'admin',
            full_name: 'Demo Admin'
          },
          email_confirmed_at: new Date().toISOString()
        }
        
        return {
          data: {
            user: demoUser,
            session: { user: demoUser, access_token: 'demo-token' }
          },
          error: null,
          user: demoUser,
          session: { user: demoUser, access_token: 'demo-token' },
          isDemo: true,
          message: 'Demo admin login successful!'
        }
      }

      // Real Supabase admin login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid admin credentials')
        }
        throw new Error(error.message)
      }

      // Verify admin role (optional - can be enhanced with database check)
      const userType = data.user?.user_metadata?.user_type
      if (userType !== 'admin') {
        // For now, allow any authenticated user to access admin
        // Later you can add proper role checking
      }

      return { 
        data, 
        error: null,
        user: data.user,
        session: data.session,
        isDemo: false,
        message: 'Admin login successful!'
      }
    } catch (error) {
      console.error('Admin login error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to authenticate admin. Please try again.',
        user: null,
        session: null,
        isDemo: false
      }
    }
  },

  /**
   * User Logout (Sign Out)
   * @returns {Promise<object>} - Logout result
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }

      // Clear any local storage data
      localStorage.removeItem('itsmychoicee_cart')
      localStorage.removeItem('itsmychoicee_wishlist')

      return { 
        error: null,
        message: 'Successfully signed out!'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      return { 
        error: error.message || 'Failed to sign out. Please try again.'
      }
    }
  },

  /**
   * Get Current User
   * @returns {Promise<object>} - Current user data
   */
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw new Error(error.message)
      }

      return { 
        user, 
        error: null,
        isAuthenticated: !!user
      }
    } catch (error) {
      console.error('Get user error:', error)
      return { 
        user: null, 
        error: error.message || 'Failed to get user information',
        isAuthenticated: false
      }
    }
  },

  /**
   * Get Current Session
   * @returns {Promise<object>} - Current session data
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw new Error(error.message)
      }

      return { 
        data: session, 
        error: null,
        session,
        user: session?.user || null,
        isAuthenticated: !!session
      }
    } catch (error) {
      console.error('Get session error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to get session',
        session: null,
        user: null,
        isAuthenticated: false
      }
    }
  },

  /**
   * Reset Password (Send reset email)
   * @param {string} email - User email
   * @returns {Promise<object>} - Reset result
   */
  async resetPassword(email) {
    try {
      if (!email) {
        throw new Error('Email address is required')
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      )

      if (error) {
        if (error.message.includes('not found')) {
          throw new Error('No account found with this email address')
        }
        throw new Error(error.message)
      }

      return { 
        data, 
        error: null,
        message: 'Password reset email sent! Please check your inbox.'
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to send reset email. Please try again.'
      }
    }
  },

  /**
   * Update Password (After reset)
   * @param {string} newPassword - New password
   * @returns {Promise<object>} - Update result
   */
  async updatePassword(newPassword) {
    try {
      // Validate new password
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0])
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }

      return { 
        data, 
        error: null,
        message: 'Password updated successfully!'
      }
    } catch (error) {
      console.error('Update password error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to update password. Please try again.'
      }
    }
  },

  /**
   * Resend Email Verification
   * @param {string} email - User email
   * @returns {Promise<object>} - Resend result
   */
  async resendVerification(email) {
    try {
      if (!email) {
        throw new Error('Email address is required')
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return { 
        data, 
        error: null,
        message: 'Verification email sent! Please check your inbox.'
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to send verification email. Please try again.'
      }
    }
  },

  /**
   * Update User Profile
   * @param {object} updates - Profile updates
   * @returns {Promise<object>} - Update result
   */
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...updates,
          full_name: updates.firstName && updates.lastName 
            ? `${updates.firstName} ${updates.lastName}`.trim()
            : undefined
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return { 
        data, 
        error: null,
        user: data.user,
        message: 'Profile updated successfully!'
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { 
        data: null, 
        error: error.message || 'Failed to update profile. Please try again.',
        user: null
      }
    }
  },

  /**
   * Listen to Authentication State Changes
   * @param {function} callback - Callback function
   * @returns {object} - Subscription object
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} - Authentication status
   */
  async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Check authentication error:', error)
      return false
    }
  },

  /**
   * Get user role/type
   * @returns {Promise<string>} - User role
   */
  async getUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.user_metadata?.user_type || 'customer'
    } catch (error) {
      console.error('Get user role error:', error)
      return 'customer'
    }
  }
}

// Export validation functions for use in components
export const validation = {
  validateEmail,
  validatePassword,
  PASSWORD_REGEX,
  EMAIL_REGEX
}

export default authService
