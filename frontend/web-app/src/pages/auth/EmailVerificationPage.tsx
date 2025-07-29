/**
 * Email Verification Page
 * Displayed when user needs to verify their email address
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const EmailVerificationPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      // TODO: Call API to resend verification email
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setResendStatus('success');
    } catch (error) {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      await refreshUser();
      // If user is verified, they will be redirected automatically
    } catch (error) {
      console.error('Failed to check verification status');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 text-blue-500 mb-6">
            <EnvelopeIcon className="w-full h-full" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verify Your Email
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            We've sent a verification link to{' '}
            <span className="font-medium text-gray-900">
              {user?.email}
            </span>
            . Please check your inbox and click the link to verify your account.
          </p>
        </div>

        {/* Status Messages */}
        {resendStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <p className="text-sm text-green-800">
                Verification email sent! Please check your inbox.
              </p>
            </div>
          </div>
        )}

        {resendStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <p className="text-sm text-red-800">
                Failed to send verification email. Please try again.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleCheckVerification}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            I've Verified My Email
          </button>

          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Didn't receive the email? Check your spam folder.</p>
          <p>
            Need help?{' '}
            <Link 
              to="/contact" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Contact Support
            </Link>
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage; 