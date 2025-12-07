/**
 * Supabase Query Wrapper
 *
 * Wraps Supabase queries with timing, logging, and timeout handling.
 */

import { logger, type LogContext } from './logger';
import { DatabaseError, TimeoutError } from '@/lib/errors/types';

// =====================================
// Types
// =====================================

interface QueryOptions {
  timeout?: number;
  context?: LogContext;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

// Default timeout: 10 seconds
const DEFAULT_TIMEOUT = 10000;

// =====================================
// Query Wrapper
// =====================================

/**
 * Execute a Supabase query with timing, logging, and timeout.
 *
 * @param queryFn - Async function that performs the Supabase query
 * @param table - Table name for logging
 * @param operation - Operation type (select, insert, update, delete)
 * @param options - Additional options (timeout, context)
 * @returns Query result with data or error
 *
 * @example
 * ```ts
 * const { data, error } = await executeQuery(
 *   () => supabase.from('members').select('*'),
 *   'members',
 *   'select'
 * );
 * ```
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>,
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const { timeout = DEFAULT_TIMEOUT, context = {} } = options;
  const start = performance.now();

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new TimeoutError(`Query timed out after ${timeout}ms`, {
            operation: `${operation} ${table}`,
            timeoutMs: timeout,
            requestId: context.requestId as string,
          })
        );
      }, timeout);
    });

    // Race query against timeout
    const result = await Promise.race([queryFn(), timeoutPromise]);

    const duration = Math.round(performance.now() - start);

    // Log query timing
    logger.logQueryTiming(
      table,
      operation,
      duration,
      Array.isArray(result.data) ? result.data.length : undefined
    );

    // Handle Supabase error
    if (result.error) {
      const dbError = new DatabaseError(result.error.message, {
        table,
        query: operation,
        requestId: context.requestId as string,
      });

      logger.error(`Query failed: ${table}`, dbError, {
        ...context,
        table,
        operation,
        duration,
      });

      return { data: null, error: dbError };
    }

    return { data: result.data, error: null };
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    // Already a TimeoutError from our race
    if (error instanceof TimeoutError) {
      logger.error(`Query timeout: ${table}`, error, {
        ...context,
        table,
        operation,
        duration,
      });
      return { data: null, error };
    }

    // Unexpected error
    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown database error',
      {
        table,
        query: operation,
        requestId: context.requestId as string,
        cause: error instanceof Error ? error : undefined,
      }
    );

    logger.error(`Query error: ${table}`, dbError, {
      ...context,
      table,
      operation,
      duration,
    });

    return { data: null, error: dbError };
  }
}

/**
 * Batch execute multiple queries with combined logging
 */
export async function executeBatchQueries<T extends Record<string, unknown>>(
  queries: {
    name: string;
    fn: () => Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
    table: string;
  }[],
  options: QueryOptions = {}
): Promise<{ results: Partial<T>; errors: Record<string, Error> }> {
  const results: Partial<T> = {};
  const errors: Record<string, Error> = {};
  const start = performance.now();

  await Promise.all(
    queries.map(async ({ name, fn, table }) => {
      const result = await executeQuery(fn, table, 'select', options);
      if (result.error) {
        errors[name] = result.error;
      } else {
        (results as Record<string, unknown>)[name] = result.data;
      }
    })
  );

  const duration = Math.round(performance.now() - start);
  const errorCount = Object.keys(errors).length;

  if (errorCount > 0) {
    logger.warn(`Batch query completed with ${errorCount} errors`, {
      ...options.context,
      duration,
      errorCount,
      queryCount: queries.length,
    });
  } else {
    logger.info('Batch query completed', {
      ...options.context,
      duration,
      queryCount: queries.length,
    });
  }

  return { results, errors };
}
