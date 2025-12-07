'use client';

/**
 * Error Boundary Components
 *
 * React error boundaries for catching and displaying errors gracefully.
 * These work with Next.js App Router's error.tsx convention.
 */

import { Component, type ReactNode } from 'react';
import { AppError, isAppError } from './types';

// =====================================
// Types
// =====================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// =====================================
// Error Boundary Class Component
// =====================================

/**
 * Generic error boundary for wrapping components that might throw.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <ComponentThatMightThrow />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      const { error } = this.state;

      // Function fallback receives props
      if (typeof fallback === 'function') {
        return fallback({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      // ReactNode fallback
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// =====================================
// Default Error Fallback UI
// =====================================

/**
 * Default error fallback with reset capability.
 * Styled to match the FantasyMax dark theme.
 */
export function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const appError = isAppError(error) ? error : null;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-6xl">
        {appError?.statusCode === 404 ? '404' : '500'}
      </div>
      <h2 className="mb-2 text-xl font-bold text-white">
        {getErrorTitle(error)}
      </h2>
      <p className="mb-6 max-w-md text-gray-400">{getErrorMessage(error)}</p>

      <div className="flex gap-4">
        <button
          onClick={resetErrorBoundary}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          Go Home
        </button>
      </div>

      {/* Show request ID for support in production */}
      {appError?.requestId && (
        <p className="mt-8 text-xs text-gray-500">
          Request ID: {appError.requestId}
        </p>
      )}

      {/* Show stack trace in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 max-w-2xl text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            Technical Details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-900 p-4 text-xs text-red-400">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

// =====================================
// Specialized Error Fallbacks
// =====================================

/**
 * Error fallback for data loading errors.
 * Shows a retry button and suggests the user wait.
 */
export function DataErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 p-8 text-center">
      <div className="mb-4 text-4xl">
        <svg
          className="h-12 w-12 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        Failed to Load Data
      </h3>
      <p className="mb-4 text-sm text-gray-400">
        {getErrorMessage(error)}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Minimal inline error for non-critical components.
 */
export function InlineErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-2 rounded border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">
      <span>Error: {getErrorMessage(error)}</span>
      <button
        onClick={resetErrorBoundary}
        className="text-red-300 underline hover:text-red-200"
      >
        Retry
      </button>
    </div>
  );
}

// =====================================
// Helper Functions
// =====================================

function getErrorTitle(error: Error): string {
  if (isAppError(error)) {
    switch (error.code) {
      case 'NOT_FOUND':
        return 'Not Found';
      case 'AUTH_ERROR':
        return 'Access Denied';
      case 'TIMEOUT_ERROR':
        return 'Request Timeout';
      case 'DATABASE_ERROR':
        return 'Database Error';
      case 'VALIDATION_ERROR':
        return 'Invalid Data';
      default:
        return 'Something Went Wrong';
    }
  }
  return 'Something Went Wrong';
}

function getErrorMessage(error: Error): string {
  if (isAppError(error)) {
    // In production, don't expose internal error messages
    if (process.env.NODE_ENV === 'production') {
      switch (error.code) {
        case 'NOT_FOUND':
          return "We couldn't find what you're looking for.";
        case 'AUTH_ERROR':
          return "You don't have permission to access this.";
        case 'TIMEOUT_ERROR':
          return 'The request took too long. Please try again.';
        case 'DATABASE_ERROR':
          return "We're having trouble connecting. Please try again later.";
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    return error.message;
  }

  // Generic error
  if (process.env.NODE_ENV === 'production') {
    return 'An unexpected error occurred. Please try again.';
  }
  return error.message;
}
