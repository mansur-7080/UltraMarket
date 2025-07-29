/**
 * Unauthorized Page
 * Displayed when user lacks required permissions
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto h-24 w-24 text-red-500">
          <ShieldExclamationIcon className="w-full h-full" />
        </div>

        {/* Content */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this resource. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-500">
          <p>Error Code: 403 - Forbidden</p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 