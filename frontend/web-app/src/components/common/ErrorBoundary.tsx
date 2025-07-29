/**
 * 🛡️ ULTRA PROFESSIONAL ERROR BOUNDARY
 * UltraMarket Frontend Error Management
 * 
 * Professional error handling with:
 * - User-friendly error display
 * - Error reporting to monitoring service
 * - Recovery mechanisms
 * - Performance impact minimal
 * - TypeScript safety
 * 
 * @author UltraMarket Frontend Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ChevronDownIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Professional TypeScript interfaces
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  enableRecovery?: boolean;
  enableReporting?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isReporting: boolean;
  lastErrorTime: number;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  retryCount: number;
  errorId: string;
  level: 'page' | 'component' | 'critical';
}

/**
 * Ultra Professional Error Boundary
 */
export class UltraProfessionalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isReporting: false,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    
    // Update state with error info
    this.setState({
      errorInfo,
      isReporting: enableReporting
    });

    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Professional error reporting
    if (enableReporting) {
      this.reportError(error, errorInfo);
    }

    // Performance monitoring
    this.trackErrorMetrics(error, errorInfo);

    // Log error for debugging
    this.logError(error, errorInfo);
  }

  /**
   * Report error to monitoring services
   */
  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.REACT_APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'development'
      };

      // Report to Sentry if available
      if (window.Sentry) {
        window.Sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', true);
          scope.setTag('level', this.props.level || 'component');
          scope.setContext('errorInfo', errorInfo);
          scope.setLevel('error');
          window.Sentry.captureException(error);
        });
      }

      // Report to custom endpoint
      if (process.env.REACT_APP_ERROR_REPORTING_URL) {
        await fetch(process.env.REACT_APP_ERROR_REPORTING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        }).catch((reportingError) => {
          console.error('Failed to report error:', reportingError);
        });
      }

      // Report to Google Analytics if available
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: `${error.name}: ${error.message}`,
          fatal: this.props.level === 'critical',
          error_id: this.state.errorId
        });
      }

    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  /**
   * Track error metrics for performance monitoring
   */
  private trackErrorMetrics(error: Error, errorInfo: ErrorInfo): void {
    try {
      // Performance API
      if ('performance' in window && 'mark' in window.performance) {
        window.performance.mark(`error-boundary-${this.state.errorId}`);
      }

      // Custom metrics
      const metrics = {
        errorType: error.name,
        errorLevel: this.props.level,
        componentDepth: this.getComponentDepth(errorInfo.componentStack),
        retryCount: this.state.retryCount,
        timeSinceLastError: Date.now() - this.state.lastErrorTime
      };

      // Send to analytics
      if (window.analytics) {
        window.analytics.track('Error Boundary Triggered', metrics);
      }

    } catch (metricsError) {
      console.error('Error metrics tracking failed:', metricsError);
    }
  }

  /**
   * Professional error logging
   */
  private logError(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      errorId: this.state.errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      level: this.props.level,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Enhanced console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.table(errorData);
      console.groupEnd();
    } else {
      // Production logging (structured)
      console.error('ErrorBoundary:', JSON.stringify(errorData));
    }
  }

  /**
   * Reset error state and attempt recovery
   */
  private resetError = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      // Max retries reached, redirect to error page or reload
      if (this.props.level === 'critical') {
        window.location.reload();
      }
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
      isReporting: false
    });

    // Track recovery attempt
    this.trackRecoveryAttempt();
  };

  /**
   * Auto recovery with delay
   */
  private autoRecover = (): void => {
    if (!this.props.enableRecovery) return;

    const timeout = setTimeout(() => {
      this.resetError();
    }, this.retryDelay * (this.state.retryCount + 1));

    this.retryTimeouts.push(timeout);
  };

  /**
   * Track recovery attempts
   */
  private trackRecoveryAttempt(): void {
    try {
      if (window.analytics) {
        window.analytics.track('Error Recovery Attempted', {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount,
          level: this.props.level
        });
      }
    } catch (error) {
      console.error('Recovery tracking failed:', error);
    }
  }

  /**
   * Helper methods
   */
  private getUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string | null {
    try {
      return sessionStorage.getItem('sessionId');
    } catch {
      return null;
    }
  }

  private getComponentDepth(componentStack: string | null | undefined): number {
    if (!componentStack) return 0;
    return componentStack.split('\n').filter(line => line.trim().startsWith('in ')).length;
  }

  componentWillUnmount() {
    // Clear any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
          errorId={this.state.errorId}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError, 
  retryCount, 
  errorId, 
  level 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return 'Kritik xatolik yuz berdi';
      case 'page':
        return 'Sahifa yuklanmadi';
      case 'component':
      default:
        return 'Nimadir noto\'g\'ri ketdi';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'critical':
        return 'Tizimda jiddiy xatolik aniqlandi. Sahifani yangilang yoki administrator bilan bog\'laning.';
      case 'page':
        return 'Sahifa to\'liq yuklanmadi. Iltimos, qaytadan urinib ko\'ring.';
      case 'component':
      default:
        return 'Sahifaning bir qismi to\'g\'ri ishlamayapti. Qaytadan urinib ko\'ring.';
    }
  };

  const canRetry = retryCount < 3;

  return (
    <div className={`
      flex flex-col items-center justify-center p-6 rounded-lg border
      ${level === 'critical' 
        ? 'bg-red-50 border-red-200 text-red-900' 
        : level === 'page'
        ? 'bg-orange-50 border-orange-200 text-orange-900'
        : 'bg-yellow-50 border-yellow-200 text-yellow-900'
      }
    `}>
      <div className="flex items-center mb-4">
        <ExclamationTriangleIcon className={`
          h-8 w-8 mr-3
          ${level === 'critical' ? 'text-red-600' : level === 'page' ? 'text-orange-600' : 'text-yellow-600'}
        `} />
        <h2 className="text-xl font-semibold">{getErrorTitle()}</h2>
      </div>

      <p className="text-center mb-4 max-w-md">
        {getErrorDescription()}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {canRetry && (
          <button
            onClick={resetError}
            className={`
              flex items-center px-4 py-2 rounded-md font-medium transition-colors
              ${level === 'critical'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : level === 'page'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }
            `}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Qaytadan urinish {retryCount > 0 && `(${retryCount}/3)`}
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
        >
          Sahifani yangilash
        </button>

        {level === 'critical' && (
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Bosh sahifaga o'tish
          </button>
        )}
      </div>

      {/* Error Details (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-2"
          >
            <ChevronDownIcon 
              className={`h-4 w-4 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
            />
            Texnik ma'lumotlar
          </button>

          {showDetails && (
            <div className="bg-gray-100 rounded-md p-4 text-xs overflow-auto max-h-64">
              <div className="mb-2">
                <strong>Error ID:</strong> {errorId}
              </div>
              {error && (
                <div className="mb-2">
                  <strong>Error:</strong> {error.name}: {error.message}
                </div>
              )}
              {error?.stack && (
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error ID for support */}
      <div className="text-xs text-gray-500 mt-2">
        Xatolik ID: {errorId}
      </div>
    </div>
  );
};

/**
 * Hook for functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError, hasError: !!error };
};

/**
 * HOC for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <UltraProfessionalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </UltraProfessionalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Specialized error boundaries for different contexts
 */
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <UltraProfessionalErrorBoundary 
    level="page" 
    enableRecovery={true} 
    enableReporting={true}
  >
    {children}
  </UltraProfessionalErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <UltraProfessionalErrorBoundary 
    level="component" 
    enableRecovery={true} 
    enableReporting={false}
  >
    {children}
  </UltraProfessionalErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <UltraProfessionalErrorBoundary 
    level="critical" 
    enableRecovery={false} 
    enableReporting={true}
  >
    {children}
  </UltraProfessionalErrorBoundary>
);

// Type declarations for global objects
declare global {
  interface Window {
    Sentry?: any;
    gtag?: any;
    analytics?: any;
  }
}

export default UltraProfessionalErrorBoundary; 