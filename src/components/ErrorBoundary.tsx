'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    // In a real app, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ErrorBoundary;

// Data-specific error boundary for components that fetch data
export const DataErrorBoundary = ({ children, onRetry }: { children: ReactNode, onRetry?: () => void }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-[300px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Data Loading Error
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't load the data right now. This might be a temporary network issue.
          </p>
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('Data loading error:', error, errorInfo);
      // Could send to error reporting service
    }}
  >
    {children}
  </ErrorBoundary>
);

// Form-specific error boundary for form components
export const FormErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-[250px] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Form Error
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Something went wrong with the form. Please refresh and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('Form error:', error, errorInfo);
      // Could send to error reporting service
    }}
  >
    {children}
  </ErrorBoundary>
);

// Network-specific error boundary
export const NetworkErrorBoundary = ({ children, onRetry }: { children: ReactNode, onRetry?: () => void }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-[300px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🌐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Connection Error
          </h3>
          <p className="text-gray-600 mb-6">
            Unable to connect to our servers. Please check your internet connection and try again.
          </p>
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('Network error:', error, errorInfo);
      // Could check if it's a network error and handle differently
    }}
  >
    {children}
  </ErrorBoundary>
);

// Suspense wrapper with error boundary
export const SuspenseWithErrorBoundary = ({ 
  children, 
  fallback, 
  errorFallback 
}: { 
  children: ReactNode, 
  fallback: ReactNode,
  errorFallback?: ReactNode 
}) => (
  <ErrorBoundary fallback={errorFallback}>
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

// Error reporting utility
export const reportError = (error: Error, context?: string, userId?: string) => {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    context,
    userId,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  console.error('Error Report:', errorReport);

  // In production, you would send this to an error reporting service
  // Example: Sentry, LogRocket, Bugsnag, etc.
  // if (process.env.NODE_ENV === 'production') {
  //   errorReportingService.captureException(error, { extra: errorReport });
  // }

  // For now, store in localStorage for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
    existingReports.push(errorReport);
    localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-10))); // Keep last 10
  }
};

// Hook for error handling in functional components
export const useErrorReporting = () => {
  const reportErrorWithContext = (error: Error, context?: string) => {
    reportError(error, context);
  };

  return { reportError: reportErrorWithContext };
};
