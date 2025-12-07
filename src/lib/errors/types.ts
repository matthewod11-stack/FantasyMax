/**
 * Error Types
 *
 * Defines typed error classes for better error handling across the app.
 * Each error type maps to a specific error boundary treatment.
 */

/**
 * Base application error with request tracking
 */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly requestId?: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      requestId?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'APP_ERROR';
    this.statusCode = options.statusCode ?? 500;
    this.requestId = options.requestId;
    this.context = options.context;
    this.cause = options.cause;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Database/Supabase query errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    options: {
      requestId?: string;
      query?: string;
      table?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'DATABASE_ERROR',
      statusCode: 503,
      requestId: options.requestId,
      context: {
        query: options.query,
        table: options.table,
      },
      cause: options.cause,
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Query timeout errors
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    options: {
      requestId?: string;
      operation?: string;
      timeoutMs?: number;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'TIMEOUT_ERROR',
      statusCode: 504,
      requestId: options.requestId,
      context: {
        operation: options.operation,
        timeoutMs: options.timeoutMs,
      },
      cause: options.cause,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Authentication/authorization errors
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    options: {
      requestId?: string;
      requiredRole?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'AUTH_ERROR',
      statusCode: 401,
      requestId: options.requestId,
      context: {
        requiredRole: options.requiredRole,
      },
      cause: options.cause,
    });
    this.name = 'AuthError';
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    options: {
      requestId?: string;
      resource?: string;
      id?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
      requestId: options.requestId,
      context: {
        resource: options.resource,
        id: options.id,
      },
      cause: options.cause,
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    options: {
      requestId?: string;
      fields?: Record<string, string>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      requestId: options.requestId,
      context: {
        fields: options.fields,
      },
      cause: options.cause,
    });
    this.name = 'ValidationError';
    this.fields = options.fields ?? {};
  }
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to an AppError
 */
export function toAppError(error: unknown, requestId?: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, {
      requestId,
      cause: error,
    });
  }

  return new AppError(String(error), { requestId });
}
