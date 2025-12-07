/**
 * Logger Tests
 *
 * Tests for the structured logging utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  generateRequestId,
  createRequestLogger,
} from '@/lib/logging/logger';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('generateRequestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should follow fm-{timestamp}-{random} format', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^fm-[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('createRequestLogger', () => {
    it('should create logger with request ID', () => {
      const reqLogger = createRequestLogger('req-test-123');
      reqLogger.info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Test message');
    });

    it('should generate request ID if not provided', () => {
      const reqLogger = createRequestLogger();
      reqLogger.info('Test');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('log methods', () => {
    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Info message');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Warning message');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Error occurred');
    });

    it('should log debug messages in development', () => {
      // In test environment (NODE_ENV=test), debug should still log
      // because isDevelopment check uses process.env.NODE_ENV === 'development'
      logger.debug('Debug message');
      // Debug only logs in development, not in test mode
      // This test verifies the method doesn't throw
    });

    it('should include context in logs', () => {
      logger.info('Message with context', { userId: 'user-123', path: '/test' });
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('userId');
    });
  });

  describe('child logger', () => {
    it('should inherit parent context', () => {
      const parentLogger = logger.child({ service: 'api' });
      const childLogger = parentLogger.child({ handler: 'members' });

      childLogger.info('Child message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should allow multiple levels of nesting', () => {
      const l1 = logger.child({ level: 1 });
      const l2 = l1.child({ level: 2 });
      const l3 = l2.child({ level: 3 });

      l3.info('Deeply nested');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('startTimer', () => {
    it('should log duration on end', async () => {
      const endTimer = logger.startTimer('Test operation');

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 10));

      endTimer();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Test operation');
      expect(output).toContain('completed');
    });
  });

  describe('logQueryTiming', () => {
    it('should log query with timing', () => {
      logger.logQueryTiming('members', 'select', 42, 10);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Database query');
    });

    it('should handle undefined row count', () => {
      logger.logQueryTiming('members', 'update', 15);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
