/**
 * Configuration Verification Tests
 *
 * These tests verify that the test environment is correctly configured.
 * They should pass immediately after setting up Vitest.
 */

import { describe, it, expect } from 'vitest';

describe('Test Environment Setup', () => {
  it('should have vitest globals available', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have testing-library matchers available', () => {
    const element = document.createElement('div');
    element.textContent = 'Hello World';
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');

    document.body.removeChild(element);
  });

  it('should have path alias @ configured', async () => {
    // This will fail at compile time if alias is misconfigured
    const { cn } = await import('@/lib/utils');
    expect(cn).toBeDefined();
    expect(typeof cn).toBe('function');
  });

  it('should have ResizeObserver mock available', () => {
    expect(ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer.observe).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });

  it('should have matchMedia mock available', () => {
    const mq = window.matchMedia('(min-width: 768px)');
    expect(mq).toBeDefined();
    expect(mq.matches).toBe(false); // Default mock returns false
  });
});

describe('TypeScript Configuration', () => {
  it('should support modern TypeScript features', () => {
    // Optional chaining
    const obj: { nested?: { value: number } } = {};
    expect(obj?.nested?.value).toBeUndefined();

    // Nullish coalescing
    const nullVal: string | null = null;
    const val = nullVal ?? 'default';
    expect(val).toBe('default');

    // Array methods
    const arr = [1, 2, 3];
    expect(arr.at(-1)).toBe(3);
  });
});
