/// <reference types="vitest/globals" />
/**
 * Vitest Setup File
 *
 * This file runs before each test file.
 * It configures the test environment with:
 * - Testing Library matchers (toBeInTheDocument, etc.)
 * - Global mocks (ResizeObserver, matchMedia)
 * - Supabase mock setup
 */

import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia (used by next-themes and responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Suppress console errors/warnings in tests unless explicitly testing them
// Uncomment if test output is too noisy:
// beforeAll(() => {
//   vi.spyOn(console, 'error').mockImplementation(() => {});
//   vi.spyOn(console, 'warn').mockImplementation(() => {});
// });
