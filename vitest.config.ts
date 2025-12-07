import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment for React components
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],

    // Include test files from tests directory
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Exclude node_modules and build outputs
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],

    // Enable globals (describe, it, expect) without imports
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**/*.tsx', // Exclude Next.js pages (tested via E2E)
        'src/components/ui/**', // Exclude shadcn components
        'src/types/**', // Exclude type definitions
      ],
      // Target 80% coverage for utilities per CLAUDE.md
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Timeout for async tests (Supabase queries may take time)
    testTimeout: 10000,

    // Pool configuration for better performance
    pool: 'threads',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
