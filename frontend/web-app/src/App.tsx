import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

// Layout Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Route Components
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/routing/ProtectedRoute';

// Pages (Lazy loaded with error boundaries)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductListPage = React.lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const OrderHistoryPage = React.lazy(() => import('./pages/OrderHistoryPage'));
const PCBuilderPage = React.lazy(() => import('./pages/pc-builder/index'));
const NASBuilderPage = React.lazy(() => import('./pages/NASBuilderPage'));
const MemoryFinderPage = React.lazy(() => import('./pages/MemoryFinderPage'));
const PCCompatibilityBuilder = React.lazy(() => import('./pages/PC-Compatibility-Builder'));
const AutoPartsCompatibility = React.lazy(() => import('./pages/AutoPartsCompatibility'));
const CompareProductsPage = React.lazy(() => import('./pages/CompareProductsPage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
const ShoppingToolsPage = React.lazy(() => import('./pages/ShoppingToolsPage'));
const GamingZonePage = React.lazy(() => import('./pages/GamingZonePage'));
const AIProductDetailExample = React.lazy(() => import('./pages/AIProductDetailExample'));
const TechHomePage = React.lazy(() => import('./pages/TechHomePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Store
import { Provider } from 'react-redux';
import { store } from './store';

// Styles
import './styles/globals.css';

// Create React Query client with professional configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount: number, error: any) => {
        // Don't retry for 4xx errors except 401 and 429
        if (error?.response?.status >= 400 && 
            error?.response?.status < 500 && 
            error?.response?.status !== 401 && 
            error?.response?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Professional Error Fallback Component
const AppErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg 
          className="w-10 h-10 text-red-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Xatolik yuz berdi</h2>
      <p className="text-gray-600 mb-6">
        Kechirasiz, ilovada muammo yuz berdi. Iltimos, qayta urinib ko'ring.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Qayta urinish
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductListPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/pc-builder" element={<PCBuilderPage />} />
                      <Route path="/nas-builder" element={<NASBuilderPage />} />
                      <Route path="/memory-finder" element={<MemoryFinderPage />} />
                      <Route path="/tech" element={<TechHomePage />} />
                      <Route path="/pc-compatibility" element={<PCCompatibilityBuilder />} />
                      <Route path="/auto-parts" element={<AutoPartsCompatibility />} />
                      <Route path="/compare" element={<CompareProductsPage />} />
                      <Route path="/shopping-tools" element={<ShoppingToolsPage />} />
                      <Route path="/gaming-zone" element={<GamingZonePage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/ai-product-example" element={<AIProductDetailExample />} />
                      
                      {/* Auth Routes */}
                      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                      
                      {/* Protected Routes */}
                      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
                      
                      {/* 404 Route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </div>
            </Router>
          </HelmetProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
