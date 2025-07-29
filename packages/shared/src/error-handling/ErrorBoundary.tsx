/**
 * 🛡️ ULTRAMARKET PROFESSIONAL ERROR BOUNDARY
 * Enterprise-grade error handling with monitoring integration
 * @version 3.0.0
 * @author UltraMarket Frontend Team
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Error Types
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  enableRecovery?: boolean;
  enableReporting?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

export interface ErrorBoundaryState {
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

// Error Monitoring Service Interface
interface ErrorMonitoringService {
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string }): void;
  setTag(key: string, value: string): void;
  setContext(key: string, context: Record<string, any>): void;
}

// Professional Error Boundary Class
export class UltraMarketErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly errorReportingService?: ErrorMonitoringService;

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

    // Initialize error reporting service
    this.errorReportingService = this.initializeErrorReporting();
  }

  private initializeErrorReporting(): ErrorMonitoringService | undefined {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      return {
        captureException: (error: Error, context?: Record<string, any>) => {
          Sentry.withScope((scope: any) => {
            if (context) {
              Object.entries(context).forEach(([_key, value]) => {
                scope.setContext(_key, value);
              });
            }
            Sentry.captureException(error);
          });
        },
        captureMessage: (message: string, level = 'error') => {
          if (level === 'warning') {
            console.warn('Message captured:', message);
          } else if (level === 'info') {
            console.info('Message captured:', message);
          } else {
            console.error('Message captured:', message);
          }
        },
        setUser: (user: { id: string; email?: string }) => {
          Sentry.setUser(user);
        },
        setTag: (key: string, value: string) => {
          Sentry.setTag(key, value);
        },
        setContext: (key: string, context: Record<string, any>) => {
          Sentry.setContext(key, context);
        },
      };
    }

    // Fallback to console logging
    return {
      captureException: (error: Error, context?: Record<string, any>) => {
        console.error('Error captured:', error, context);
      },
      captureMessage: (message: string, level = 'error') => {
        if (level === 'warning') {
          console.warn('Message captured:', message);
        } else if (level === 'info') {
          console.info('Message captured:', message);
        } else {
          console.error('Message captured:', message);
        }
      },
      setUser: () => {},
      setTag: () => {},
      setContext: () => {},
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true, level = 'component' } = this.props;
    
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
    if (enableReporting && this.errorReportingService) {
      this.reportError(error, errorInfo, level);
    }

    // Performance monitoring
    this.trackErrorMetrics(error, errorInfo);

    // Log error for debugging
    this.logError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys = [], resetOnPropsChange = false } = this.props;
    const { hasError } = this.state;

          if (hasError && !(prevProps as any).hasError) {
      // Error just occurred, already handled in componentDidCatch
      return;
    }

    if (hasError) {
      // Check if resetKeys changed
      if (resetKeys.length > 0 && 
          resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetError();
        return;
      }

      // Check if other props changed and resetOnPropsChange is enabled
      if (resetOnPropsChange && this.propsChanged(prevProps)) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    // Cleanup retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];
  }

  private propsChanged(prevProps: ErrorBoundaryProps): boolean {
    // Simple shallow comparison for key props
    const keysToCheck: (keyof ErrorBoundaryProps)[] = ['children', 'level', 'resetKeys'];
    return keysToCheck.some((key: any) => prevProps[key] !== (this as any).props[key]);
  }

  private async reportError(
    error: Error, 
    errorInfo: ErrorInfo, 
    level: 'page' | 'component' | 'critical'
  ): Promise<void> {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.REACT_APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'development'
      };

      // Report to monitoring service
      this.errorReportingService?.captureException(error, {
        errorBoundary: true,
        level,
        errorInfo,
        retryCount: this.state.retryCount,
      });

      // Set additional context
      this.errorReportingService?.setTag('errorBoundary', 'true');
      this.errorReportingService?.setTag('level', level);
      this.errorReportingService?.setContext('errorInfo', errorInfo);

      // Report to custom endpoint if available
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

      // Report to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: `${error.name}: ${error.message}`,
          fatal: level === 'critical',
          error_id: this.state.errorId
        });
      }

    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private trackErrorMetrics(error: Error, errorInfo: ErrorInfo): void {
    try {
      // Track performance impact
      if ('performance' in window && window.performance.mark) {
        window.performance.mark(`error-${this.state.errorId}-start`);
      }

      // Track error frequency
      const errorKey = `error_frequency_${error.name}`;
      const count = parseInt(sessionStorage.getItem(errorKey) || '0') + 1;
      sessionStorage.setItem(errorKey, count.toString());

      // Track component error rate
      const componentKey = `component_errors_${errorInfo.componentStack?.split('\n')[1]?.trim() || 'unknown'}`;
      const componentCount = parseInt(sessionStorage.getItem(componentKey) || '0') + 1;
      sessionStorage.setItem(componentKey, componentCount.toString());

    } catch (metricsError) {
      console.error('Error tracking metrics:', metricsError);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    const { level = 'component' } = this.props;
    
    console.group(`🚨 ${level.toUpperCase()} ERROR - ID: ${this.state.errorId}`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Props:', this.props);
    console.error('State:', this.state);
    console.error('User Agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.groupEnd();
  }

  private getUserId(): string | null {
    try {
      // Try to get user ID from localStorage or other sources
      return localStorage.getItem('user_id') || null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch {
      return `session_fallback_${Date.now()}`;
    }
  }

  private resetError = (): void => {
    // Clear retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isReporting: false,
      lastErrorTime: 0
    });
  };

  private handleRetry = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      this.errorReportingService?.captureMessage(
        `Max retry attempts (${this.maxRetries}) reached for error ${this.state.errorId}`,
        'warning'
      );
      return;
    }

    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, retryCount);
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }));
      
      this.resetError();
    }, delay);

    this.retryTimeouts.push(timeout);
  };

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

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError, 
  retryCount, 
  errorId, 
  level 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getErrorTitle = (): string => {
    switch (level) {
      case 'critical':
        return 'Критik хатолик юз берди';
      case 'page':
        return 'Саҳифа юкланмади';
      case 'component':
      default:
        return 'Нимадир нотўғри кетди';
    }
  };

  const getErrorDescription = (): string => {
    switch (level) {
      case 'critical':
        return 'Тизимда жиддий хатолик аниқланди. Саҳифани янгиланг ёки администратор билан боғланинг.';
      case 'page':
        return 'Саҳифа тўлиқ юкланмади. Илтимос, қайтадан уриниб кўринг.';
      case 'component':
      default:
        return 'Саҳифанинг бир қисми тўғри ишламаяпти. Қайтадан уриниб кўринг.';
    }
  };

  const canRetry = retryCount < 3;

  return (
    <div className="flex items-center justify-center min-h-[200px] p-6 bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getErrorTitle()}
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          {getErrorDescription()}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && (
            <button
              onClick={resetError}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              disabled={retryCount >= 3}
            >
              {retryCount > 0 ? `Қайтадан уриниш (${retryCount}/3)` : 'Қайтадан уриниш'}
            </button>
          )}

          {level === 'critical' && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
            >
              Бош саҳифага ўтиш
            </button>
          )}
        </div>

        {/* Error Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 mx-auto"
            >
              <svg 
                className={`h-4 w-4 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Техник маълумотлар
            </button>

            {showDetails && (
              <div className="mt-4 bg-gray-100 rounded-md p-4 text-left text-xs overflow-auto max-h-64">
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
                    <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error ID for support */}
        <div className="text-xs text-gray-500 mt-4">
          Хатолик ID: {errorId}
        </div>
      </div>
    </div>
  );
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <UltraMarketErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </UltraMarketErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for functional components error handling
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

// Global error handler setup
export const setupGlobalErrorHandling = (errorService?: ErrorMonitoringService) => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    errorService?.captureException(error, {
      type: 'unhandled_promise_rejection',
      reason: event.reason,
    });
    
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault(); // Prevent the default browser behavior
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    errorService?.captureException(error, {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    console.error('Global Error:', error);
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const error = new Error(`Resource loading error: ${(event.target as any)?.src || 'unknown'}`);
      errorService?.captureException(error, {
        type: 'resource_error',
        element: event.target,
      });
    }
  }, true);
};

export default UltraMarketErrorBoundary; 