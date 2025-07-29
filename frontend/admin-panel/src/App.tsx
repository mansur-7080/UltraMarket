import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';

import { store, persistor } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeProvider';

// Layout Components
import AdminLayout from './components/layout/AdminLayout';
import AuthLayout from './components/layout/AuthLayout';

// Page Components
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import UserManagement from './pages/UserManagement';
import InventoryManagement from './pages/InventoryManagement';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import FinancialReports from './pages/FinancialReports';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Error Components
import ErrorFallback from './components/common/ErrorFallback';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy loaded components for code splitting
const ReviewManagement = React.lazy(() => import('./pages/ReviewManagement'));
const PromotionManagement = React.lazy(() => import('./pages/PromotionManagement'));
const ContentManagement = React.lazy(() => import('./pages/ContentManagement'));
const SystemMonitoring = React.lazy(() => import('./pages/SystemMonitoring'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', 'ultramarket.com'],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// Admin Routes Component
const AdminRoutes: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* E-commerce Management */}
        <Route path="/products/*" element={<ProductManagement />} />
        <Route path="/orders/*" element={<OrderManagement />} />
        <Route path="/inventory/*" element={<InventoryManagement />} />
        <Route
          path="/reviews/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ReviewManagement />
            </Suspense>
          }
        />
        <Route
          path="/promotions/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <PromotionManagement />
            </Suspense>
          }
        />

        {/* User Management */}
        <Route path="/users/*" element={<UserManagement />} />

        {/* Content Management */}
        <Route
          path="/content/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ContentManagement />
            </Suspense>
          }
        />

        {/* Analytics & Reports */}
        <Route path="/analytics/*" element={<AnalyticsDashboard />} />
        <Route path="/reports/*" element={<FinancialReports />} />

        {/* System Management */}
        <Route
          path="/monitoring/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SystemMonitoring />
            </Suspense>
          }
        />
        <Route
          path="/audit-logs/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuditLogs />
            </Suspense>
          }
        />
        <Route path="/settings/*" element={<SettingsPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

// Auth Routes Component
const AuthRoutes: React.FC = () => {
  return (
    <AuthLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthLayout>
  );
};

// Main App Component
const App: React.FC = () => {
  useEffect(() => {
    // Set up global error handling with Sentry
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      Sentry.captureException(event.reason, {
        tags: {
          type: 'unhandled_promise_rejection',
        },
        extra: {
          reason: event.reason,
        },
      });

      // Error is already captured by Sentry
      // Additional logging can be configured in monitoring service
    };

    const handleError = (event: ErrorEvent) => {
      Sentry.captureException(event.error, {
        tags: {
          type: 'global_error',
        },
        extra: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });

      // Error is already captured by Sentry
      // Additional logging can be configured in monitoring service
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        Sentry.captureException(error, {
          tags: {
            type: 'react_error_boundary',
          },
          extra: {
            errorInfo,
          },
        });

        // Error is already captured by Sentry
        // Additional debugging can be configured for development
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
            <ConfigProvider
              theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                  colorPrimary: '#1890ff',
                  colorSuccess: '#52c41a',
                  colorWarning: '#faad14',
                  colorError: '#ff4d4f',
                  colorInfo: '#1890ff',
                  borderRadius: 6,
                  wireframe: false,
                },
                components: {
                  Layout: {
                    headerBg: '#001529',
                    siderBg: '#001529',
                  },
                  Menu: {
                    darkItemBg: '#001529',
                    darkSubMenuItemBg: '#000c17',
                  },
                  Button: {
                    borderRadius: 6,
                  },
                  Card: {
                    borderRadius: 8,
                  },
                  Table: {
                    borderRadius: 8,
                  },
                },
              }}
            >
              <AntdApp>
                <ThemeProvider>
                  <AuthProvider>
                    <NotificationProvider>
                      <Router>
                        <Routes>
                          {/* Auth Routes */}
                          <Route path="/auth/*" element={<AuthRoutes />} />

                          {/* Protected Admin Routes */}
                          <Route
                            path="/*"
                            element={
                              <ProtectedRoute>
                                <AdminRoutes />
                              </ProtectedRoute>
                            }
                          />
                        </Routes>
                      </Router>
                    </NotificationProvider>
                  </AuthProvider>
                </ThemeProvider>
              </AntdApp>
            </ConfigProvider>
          </PersistGate>
        </Provider>

        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
