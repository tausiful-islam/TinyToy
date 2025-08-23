import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/database.js';

// Create the Auth Context
const AuthContext = createContext({});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      setLoading(true);
      const { data: currentUser } = await authService.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, userData);
      
      if (result.data && !result.error) {
        // Don't set user state yet if email verification is required
        if (!result.data.user?.email_confirmed_at) {
          return {
            success: true,
            message: 'Please check your email to verify your account.',
            requiresVerification: true
          };
        }
        
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, user: result.data.user };
      }
      
      return { success: false, error: result.error || 'Failed to create account' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create account' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);
      
      if (result.data && !result.error) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, user: result.data.user };
      }
      
      return { success: false, error: result.error || 'Invalid credentials' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Admin sign in function
  const adminSignIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.adminLogin(email, password);
      
      if (result.data && !result.error) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, user: result.data.user };
      }
      
      return { success: false, error: result.error || 'Invalid admin credentials' };
    } catch (error) {
      console.error('Admin sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in as admin' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await authService.signOut();
      
      if (!result.error) {
        setUser(null);
        setIsAuthenticated(false);
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      const result = await authService.resetPassword(email);
      
      if (!result.error) {
        return { 
          success: true, 
          message: 'Password reset email sent. Please check your inbox.' 
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send reset email' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      const result = await authService.updatePassword(newPassword);
      
      if (!result.error) {
        return { success: true, message: 'Password updated successfully' };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Update password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const result = await authService.updateProfile(updates);
      
      if (result.data && !result.error) {
        setUser(result.data.user);
        return { success: true, user: result.data.user };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return authService.hasRole(user, role);
  };

  // Check if user is admin
  const isAdmin = () => {
    return authService.isAdmin(user);
  };

  // Check if user is customer
  const isCustomer = () => {
    return authService.isCustomer(user);
  };

  // Get user display name
  const getUserDisplayName = () => {
    return authService.getUserDisplayName(user);
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Authentication functions
    signUp,
    signIn,
    adminSignIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    
    // Utility functions
    hasRole,
    isAdmin,
    isCustomer,
    getUserDisplayName,
    
    // Re-initialize auth (useful for refresh)
    refreshAuth: initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC for protecting routes
export const withAuth = (Component, requiredRole = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasRole, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Insufficient Permissions
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Component for protecting admin routes
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Admin Access Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Component for protecting customer routes
export const CustomerRoute = ({ children }) => {
  const { isAuthenticated, isCustomer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isCustomer()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Customer Access Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in as a customer to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Customer Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthContext;
