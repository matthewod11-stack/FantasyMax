/**
 * Structured Logger
 *
 * Provides structured logging with request IDs, timing, and context.
 * Outputs JSON in production, pretty-printed in development.
 */

// =====================================
// Types
// =====================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
}

// =====================================
// Request ID Generation
// =====================================

/**
 * Generate a unique request ID.
 * Format: fm-{timestamp}-{random}
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `fm-${timestamp}-${random}`;
}

// =====================================
// Logger Class
// =====================================

class Logger {
  private context: LogContext = {};
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...context };
    child.isDevelopment = this.isDevelopment;
    return child;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a timing helper that logs duration
   */
  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.info(`${operation} completed`, { duration, operation });
    };
  }

  /**
   * Log Supabase query timing
   */
  logQueryTiming(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    durationMs: number,
    rowCount?: number
  ): void {
    this.info('Database query', {
      table,
      operation,
      duration: durationMs,
      rowCount,
    });
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as { code?: string }).code,
      };
    }

    if (this.isDevelopment) {
      this.logDevelopment(entry);
    } else {
      this.logProduction(entry);
    }
  }

  private logDevelopment(entry: LogEntry): void {
    const color = this.getColor(entry.level);
    const prefix = `${color}[${entry.level.toUpperCase()}]${RESET}`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    let output = `${DIM}${timestamp}${RESET} ${prefix} ${entry.message}`;

    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${DIM}${JSON.stringify(entry.context)}${RESET}`;
    }

    // Add duration if present
    if (entry.duration !== undefined) {
      output += ` ${CYAN}(${entry.duration}ms)${RESET}`;
    }

    console.log(output);

    // Log error stack separately
    if (entry.error?.stack) {
      console.log(`${RED}${entry.error.stack}${RESET}`);
    }
  }

  private logProduction(entry: LogEntry): void {
    // Clean up context for production (remove undefined values)
    if (entry.context) {
      entry.context = Object.fromEntries(
        Object.entries(entry.context).filter(([, v]) => v !== undefined)
      ) as LogContext;
    }

    // Output as JSON for log aggregators
    console.log(JSON.stringify(entry));
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return DIM;
      case 'info':
        return BLUE;
      case 'warn':
        return YELLOW;
      case 'error':
        return RED;
    }
  }
}

// =====================================
// ANSI Color Codes
// =====================================

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// =====================================
// Singleton Export
// =====================================

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId?: string): Logger {
  return logger.child({ requestId: requestId ?? generateRequestId() });
}
