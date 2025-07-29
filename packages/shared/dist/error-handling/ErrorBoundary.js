"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGlobalErrorHandling = exports.useErrorHandler = exports.withErrorBoundary = exports.UltraMarketErrorBoundary = void 0;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * 🛡️ ULTRAMARKET PROFESSIONAL ERROR BOUNDARY
 * Enterprise-grade error handling with monitoring integration
 * @version 3.0.0
 * @author UltraMarket Frontend Team
 */
const react_1 = tslib_1.__importStar(require("react"));
// Professional Error Boundary Class
class UltraMarketErrorBoundary extends react_1.Component {
    retryTimeouts = [];
    maxRetries = 3;
    retryDelay = 1000;
    errorReportingService;
    constructor(props) {
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
    initializeErrorReporting() {
        // Check if Sentry is available
        if (typeof window !== 'undefined' && window.Sentry) {
            const Sentry = window.Sentry;
            return {
                captureException: (error, context) => {
                    Sentry.withScope((scope) => {
                        if (context) {
                            Object.entries(context).forEach(([_key, value]) => {
                                scope.setContext(_key, value);
                            });
                        }
                        Sentry.captureException(error);
                    });
                },
                captureMessage: (message, level = 'error') => {
                    if (level === 'warning') {
                        console.warn('Message captured:', message);
                    }
                    else if (level === 'info') {
                        console.info('Message captured:', message);
                    }
                    else {
                        console.error('Message captured:', message);
                    }
                },
                setUser: (user) => {
                    Sentry.setUser(user);
                },
                setTag: (key, value) => {
                    Sentry.setTag(key, value);
                },
                setContext: (key, context) => {
                    Sentry.setContext(key, context);
                },
            };
        }
        // Fallback to console logging
        return {
            captureException: (error, context) => {
                console.error('Error captured:', error, context);
            },
            captureMessage: (message, level = 'error') => {
                if (level === 'warning') {
                    console.warn('Message captured:', message);
                }
                else if (level === 'info') {
                    console.info('Message captured:', message);
                }
                else {
                    console.error('Message captured:', message);
                }
            },
            setUser: () => { },
            setTag: () => { },
            setContext: () => { },
        };
    }
    static getDerivedStateFromError(error) {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            hasError: true,
            error,
            errorId,
            lastErrorTime: Date.now(),
        };
    }
    componentDidCatch(error, errorInfo) {
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
            }
            catch (handlerError) {
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
    componentDidUpdate(prevProps) {
        const { resetKeys = [], resetOnPropsChange = false } = this.props;
        const { hasError } = this.state;
        if (hasError && !prevProps.hasError) {
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
    propsChanged(prevProps) {
        // Simple shallow comparison for key props
        const keysToCheck = ['children', 'level', 'resetKeys'];
        return keysToCheck.some((key) => prevProps[key] !== this.props[key]);
    }
    async reportError(error, errorInfo, level) {
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
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'exception', {
                    description: `${error.name}: ${error.message}`,
                    fatal: level === 'critical',
                    error_id: this.state.errorId
                });
            }
        }
        catch (reportingError) {
            console.error('Error reporting failed:', reportingError);
        }
        finally {
            this.setState({ isReporting: false });
        }
    }
    trackErrorMetrics(error, errorInfo) {
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
        }
        catch (metricsError) {
            console.error('Error tracking metrics:', metricsError);
        }
    }
    logError(error, errorInfo) {
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
    getUserId() {
        try {
            // Try to get user ID from localStorage or other sources
            return localStorage.getItem('user_id') || null;
        }
        catch {
            return null;
        }
    }
    getSessionId() {
        try {
            let sessionId = sessionStorage.getItem('session_id');
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('session_id', sessionId);
            }
            return sessionId;
        }
        catch {
            return `session_fallback_${Date.now()}`;
        }
    }
    resetError = () => {
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
    handleRetry = () => {
        const { retryCount } = this.state;
        if (retryCount >= this.maxRetries) {
            this.errorReportingService?.captureMessage(`Max retry attempts (${this.maxRetries}) reached for error ${this.state.errorId}`, 'warning');
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
            return ((0, jsx_runtime_1.jsx)(FallbackComponent, { error: this.state.error, errorInfo: this.state.errorInfo, resetError: this.resetError, retryCount: this.state.retryCount, errorId: this.state.errorId, level: this.props.level || 'component' }));
        }
        return this.props.children;
    }
}
exports.UltraMarketErrorBoundary = UltraMarketErrorBoundary;
// Default Error Fallback Component
const DefaultErrorFallback = ({ error, errorInfo, resetError, retryCount, errorId, level }) => {
    const [showDetails, setShowDetails] = react_1.default.useState(false);
    const getErrorTitle = () => {
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
    const getErrorDescription = () => {
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
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-[200px] p-6 bg-gray-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: getErrorTitle() }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6", children: getErrorDescription() }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [canRetry && ((0, jsx_runtime_1.jsx)("button", { onClick: resetError, className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors", disabled: retryCount >= 3, children: retryCount > 0 ? `Қайтадан уриниш (${retryCount}/3)` : 'Қайтадан уриниш' })), level === 'critical' && ((0, jsx_runtime_1.jsx)("button", { onClick: () => window.location.href = '/', className: "px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors", children: "\u0411\u043E\u0448 \u0441\u0430\u04B3\u0438\u0444\u0430\u0433\u0430 \u045E\u0442\u0438\u0448" }))] }), process.env.NODE_ENV === 'development' && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-6", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowDetails(!showDetails), className: "flex items-center text-sm text-gray-600 hover:text-gray-800 mx-auto", children: [(0, jsx_runtime_1.jsx)("svg", { className: `h-4 w-4 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }), "\u0422\u0435\u0445\u043D\u0438\u043A \u043C\u0430\u044A\u043B\u0443\u043C\u043E\u0442\u043B\u0430\u0440"] }), showDetails && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 bg-gray-100 rounded-md p-4 text-left text-xs overflow-auto max-h-64", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Error ID:" }), " ", errorId] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-2", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Error:" }), " ", error.name, ": ", error.message] })), error?.stack && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-2", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Stack:" }), (0, jsx_runtime_1.jsx)("pre", { className: "mt-1 whitespace-pre-wrap text-xs", children: error.stack })] })), errorInfo?.componentStack && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Component Stack:" }), (0, jsx_runtime_1.jsx)("pre", { className: "mt-1 whitespace-pre-wrap text-xs", children: errorInfo.componentStack })] }))] }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-gray-500 mt-4", children: ["\u0425\u0430\u0442\u043E\u043B\u0438\u043A ID: ", errorId] })] }) }));
};
// HOC for wrapping components with error boundary
const withErrorBoundary = (Component, errorBoundaryProps) => {
    const WrappedComponent = (props) => ((0, jsx_runtime_1.jsx)(UltraMarketErrorBoundary, { ...errorBoundaryProps, children: (0, jsx_runtime_1.jsx)(Component, { ...props }) }));
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
};
exports.withErrorBoundary = withErrorBoundary;
// Hook for functional components error handling
const useErrorHandler = () => {
    const [error, setError] = react_1.default.useState(null);
    const resetError = react_1.default.useCallback(() => {
        setError(null);
    }, []);
    const handleError = react_1.default.useCallback((error) => {
        setError(error);
    }, []);
    react_1.default.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);
    return { handleError, resetError, hasError: !!error };
};
exports.useErrorHandler = useErrorHandler;
// Global error handler setup
const setupGlobalErrorHandling = (errorService) => {
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
            const error = new Error(`Resource loading error: ${event.target?.src || 'unknown'}`);
            errorService?.captureException(error, {
                type: 'resource_error',
                element: event.target,
            });
        }
    }, true);
};
exports.setupGlobalErrorHandling = setupGlobalErrorHandling;
exports.default = UltraMarketErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map