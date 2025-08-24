import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = null }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  // Determine if this is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin/') && location.pathname !== '/admin/login';
  
  // Auto-detect admin requirement if not explicitly set
  const needsAdmin = requireAdmin !== null ? requireAdmin : isAdminRoute;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    const redirectPath = needsAdmin ? "/admin/login" : "/login";
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // For admin routes, check admin permissions
  if (needsAdmin) {
    if (!isAdmin()) {
      // User is authenticated but not admin - redirect to admin login with access denied
      return <Navigate to="/admin/login" state={{ accessDenied: true, from: location }} replace />;
    }
  }

  // User has proper permissions, render the protected content
  return children;
};

export default ProtectedRoute;
