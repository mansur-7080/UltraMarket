/**
 * 🛡️ ULTRAMARKET PROFESSIONAL ERROR BOUNDARY
 * Enterprise-grade error handling with monitoring integration
 * @version 3.0.0
 * @author UltraMarket Frontend Team
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
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
interface ErrorMonitoringService {
    captureException(error: Error, context?: Record<string, any>): void;
    captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
    setUser(user: {
        id: string;
        email?: string;
    }): void;
    setTag(key: string, value: string): void;
    setContext(key: string, context: Record<string, any>): void;
}
export declare class UltraMarketErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private retryTimeouts;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly errorReportingService?;
    constructor(props: ErrorBoundaryProps);
    private initializeErrorReporting;
    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentDidUpdate(prevProps: ErrorBoundaryProps): void;
    componentWillUnmount(): void;
    private propsChanged;
    private reportError;
    private trackErrorMetrics;
    private logError;
    private getUserId;
    private getSessionId;
    private resetError;
    private handleRetry;
    render(): any;
}
export declare const withErrorBoundary: <P extends object>(Component: React.ComponentType<P>, errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">) => {
    (props: P): any;
    displayName: string;
};
export declare const useErrorHandler: () => {
    handleError: any;
    resetError: any;
    hasError: boolean;
};
export declare const setupGlobalErrorHandling: (errorService?: ErrorMonitoringService) => void;
export default UltraMarketErrorBoundary;
//# sourceMappingURL=ErrorBoundary.d.ts.map