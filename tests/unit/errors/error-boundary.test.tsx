/**
 * Error Boundary Tests
 *
 * Tests for error handling components and utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ErrorBoundary,
  DefaultErrorFallback,
  DataErrorFallback,
  InlineErrorFallback,
} from '@/lib/errors/error-boundary';
import {
  AppError,
  DatabaseError,
  TimeoutError,
  AuthError,
  NotFoundError,
  ValidationError,
  isAppError,
  toAppError,
} from '@/lib/errors/types';

// Suppress console.error during tests (expected errors)
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

// =====================================
// Error Type Tests
// =====================================

describe('Error Types', () => {
  describe('AppError', () => {
    it('should create error with defaults', () => {
      const error = new AppError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('APP_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should accept custom options', () => {
      const error = new AppError('Custom error', {
        code: 'CUSTOM_CODE',
        statusCode: 418,
        requestId: 'req-123',
        context: { key: 'value' },
      });
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(418);
      expect(error.requestId).toBe('req-123');
      expect(error.context).toEqual({ key: 'value' });
    });

    it('should preserve cause chain', () => {
      const cause = new Error('Original error');
      const error = new AppError('Wrapped error', { cause });
      expect(error.cause).toBe(cause);
    });
  });

  describe('Specialized Errors', () => {
    it('should create DatabaseError', () => {
      const error = new DatabaseError('Query failed', {
        table: 'members',
        query: 'SELECT * FROM members',
      });
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.context?.table).toBe('members');
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Operation timed out', {
        operation: 'fetchMembers',
        timeoutMs: 5000,
      });
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(504);
      expect(error.context?.timeoutMs).toBe(5000);
    });

    it('should create AuthError', () => {
      const error = new AuthError('Not authorized', {
        requiredRole: 'commissioner',
      });
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError('Member not found', {
        resource: 'member',
        id: '123',
      });
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should create ValidationError with fields', () => {
      const error = new ValidationError('Invalid input', {
        fields: {
          email: 'Invalid email format',
          name: 'Name is required',
        },
      });
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.fields.email).toBe('Invalid email format');
    });
  });

  describe('isAppError', () => {
    it('should identify AppError', () => {
      expect(isAppError(new AppError('test'))).toBe(true);
      expect(isAppError(new DatabaseError('test'))).toBe(true);
      expect(isAppError(new Error('test'))).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe('toAppError', () => {
    it('should pass through AppError', () => {
      const appError = new AppError('test');
      expect(toAppError(appError)).toBe(appError);
    });

    it('should wrap Error in AppError', () => {
      const error = new Error('Original');
      const appError = toAppError(error, 'req-123');
      expect(appError.message).toBe('Original');
      expect(appError.requestId).toBe('req-123');
      expect(appError.cause).toBe(error);
    });

    it('should handle non-Error values', () => {
      const appError = toAppError('String error');
      expect(appError.message).toBe('String error');
    });
  });
});

// =====================================
// Error Boundary Component Tests
// =====================================

describe('ErrorBoundary', () => {
  // Component that throws on render
  function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>Success</div>;
  }

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should use custom fallback component', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('should use function fallback with props', () => {
    render(
      <ErrorBoundary
        fallback={({ error, resetErrorBoundary }) => (
          <div>
            <p>Error: {error.message}</p>
            <button onClick={resetErrorBoundary}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('should call onError callback', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    const firstCall = onError.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall) {
      expect(firstCall[0]).toBeInstanceOf(Error);
    }
  });

  it('should reset when Try Again is clicked', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Error');
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click reset
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render to pick up the new shouldThrow value
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

// =====================================
// Fallback Component Tests
// =====================================

describe('DefaultErrorFallback', () => {
  it('should display error message', () => {
    const error = new Error('Something broke');
    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={() => {}} />
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
  });

  it('should display request ID for AppError', () => {
    const error = new AppError('Test error', { requestId: 'req-abc-123' });
    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={() => {}} />
    );

    expect(screen.getByText(/Request ID: req-abc-123/)).toBeInTheDocument();
  });

  it('should show 404 for NotFoundError', () => {
    const error = new NotFoundError('Not found');
    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={() => {}} />
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });

  it('should show 500 for generic errors', () => {
    const error = new Error('Generic error');
    render(
      <DefaultErrorFallback error={error} resetErrorBoundary={() => {}} />
    );

    expect(screen.getByText('500')).toBeInTheDocument();
  });
});

describe('DataErrorFallback', () => {
  it('should display retry button', () => {
    const reset = vi.fn();
    render(
      <DataErrorFallback
        error={new DatabaseError('Query failed')}
        resetErrorBoundary={reset}
      />
    );

    expect(screen.getByText('Failed to Load Data')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(reset).toHaveBeenCalled();
  });
});

describe('InlineErrorFallback', () => {
  it('should display inline error message', () => {
    const reset = vi.fn();
    render(
      <InlineErrorFallback
        error={new Error('Minor error')}
        resetErrorBoundary={reset}
      />
    );

    // The message should contain the error
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
