import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State management
  const [verificationState, setVerificationState] = useState('loading'); // 'loading', 'success', 'error', 'expired'
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Extract tokens from URL
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');

  // Verify email on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if we have the required parameters
        if (!token_hash || !type) {
          setVerificationState('error');
          setMessage('Invalid verification link. Missing required parameters.');
          return;
        }

        // Verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type || 'email'
        });

        if (error) {
          console.error('Email verification error:', error);
          
          // Handle specific error types
          if (error.message.includes('expired')) {
            setVerificationState('expired');
            setMessage('This verification link has expired. Please request a new one.');
          } else if (error.message.includes('invalid')) {
            setVerificationState('error');
            setMessage('Invalid verification link. Please try again or request a new one.');
          } else {
            setVerificationState('error');
            setMessage(error.message || 'Email verification failed. Please try again.');
          }
          return;
        }

        // Success case
        if (data?.user) {
          setVerificationState('success');
          setUserEmail(data.user.email || '');
          setMessage('Email verified successfully! You can now sign in to your account.');
          
          // Start countdown for automatic redirect
          startCountdown();
        } else {
          setVerificationState('error');
          setMessage('Verification completed but user data is missing. Please try signing in.');
        }

      } catch (error) {
        console.error('Unexpected verification error:', error);
        setVerificationState('error');
        setMessage('An unexpected error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token_hash, type]);

  // Countdown for automatic redirect
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirectToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // Handle redirect to login
  const handleRedirectToLogin = () => {
    setIsRedirecting(true);
    navigate('/login', { 
      state: { 
        message: 'Email verified successfully! You can now sign in.',
        email: userEmail 
      }
    });
  };

  // Handle manual navigation to login
  const handleManualRedirect = () => {
    setIsRedirecting(true);
    navigate('/login', { 
      state: { 
        message: verificationState === 'success' 
          ? 'Email verified successfully! You can now sign in.'
          : 'Please sign in to your account.',
        email: userEmail 
      }
    });
  };

  // Handle resend verification (redirect to signup)
  const handleResendVerification = () => {
    navigate('/signup', {
      state: {
        message: 'Please enter your email to resend verification.',
        resendMode: true
      }
    });
  };

  // Render different states
  const renderContent = () => {
    switch (verificationState) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email
            </h3>
            <p className="text-gray-600 mb-6">
              Please wait while we verify your email address...
            </p>
            <div className="animate-pulse bg-gray-200 h-4 rounded mb-4"></div>
            <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4 mx-auto"></div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Email verified successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Your email address has been confirmed.
            </p>
            {userEmail && (
              <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
                {userEmail}
              </p>
            )}
            
            {/* Countdown display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                Redirecting to login in <span className="font-bold">{countdown}</span> seconds...
              </p>
            </div>

            {/* Manual redirect button */}
            <button
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className={`w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                isRedirecting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>Go to Login</span>
                </>
              )}
            </button>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Verification link expired
            </h3>
            <p className="text-gray-600 mb-6">
              This verification link has expired. Please request a new one.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                <span>Request new verification</span>
              </button>
              
              <button
                onClick={handleManualRedirect}
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-all duration-200"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Go to Login</span>
              </button>
            </div>
          </motion.div>
        );

      case 'error':
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Verification failed
            </h3>
            <p className="text-gray-600 mb-6">
              {message || 'There was an error verifying your email address.'}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-left">
                <h4 className="font-semibold text-red-900 mb-2">What you can do:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Check if you clicked the correct verification link</li>
                  <li>• Request a new verification email</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                <span>Request new verification</span>
              </button>
              
              <button
                onClick={handleManualRedirect}
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-all duration-200"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Go to Login</span>
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo/Brand */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Its My Choicee</span>
          </Link>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Confirming your email address
        </p>
      </motion.div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
          
          {/* Back to Store Link */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center space-x-1"
            >
              <span>← Back to store</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
