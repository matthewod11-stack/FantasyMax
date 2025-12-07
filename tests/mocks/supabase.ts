/**
 * Supabase Mock Utilities
 *
 * Provides mock implementations for Supabase client methods.
 * Use these to test data layer code without hitting the real database.
 */

import { vi } from 'vitest';

type MockData = Record<string, unknown[]>;

/**
 * Creates a chainable mock for Supabase query builders.
 *
 * Example usage:
 * ```ts
 * const mockClient = createMockSupabaseClient({
 *   members: [MIKE, JOHN],
 *   teams: [MIKE_TEAM_2024, JOHN_TEAM_2024],
 * });
 *
 * vi.mock('@/lib/supabase/server', () => ({
 *   createClient: () => mockClient,
 * }));
 * ```
 */
export function createMockSupabaseClient(data: MockData = {}) {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  // Chain state to track which table we're querying
  let currentTable: string | null = null;
  let currentFilters: Record<string, unknown> = {};

  // Reset chain state
  const resetChain = () => {
    currentFilters = {};
  };

  // Get filtered data based on current state
  const getFilteredData = () => {
    if (!currentTable || !data[currentTable]) {
      return [];
    }

    const tableData = data[currentTable];
    let result = tableData ? [...tableData] : [];

    // Apply filters
    Object.entries(currentFilters).forEach(([key, value]) => {
      result = result.filter((item) => {
        const record = item as Record<string, unknown>;
        if (Array.isArray(value)) {
          return value.includes(record[key]);
        }
        return record[key] === value;
      });
    });

    return result;
  };

  // Create the chainable response
  const createChainable = () => ({
    select: mockSelect.mockImplementation(() => createChainable()),
    insert: mockInsert.mockImplementation(() => createChainable()),
    update: mockUpdate.mockImplementation(() => createChainable()),
    delete: mockDelete.mockImplementation(() => createChainable()),
    eq: mockEq.mockImplementation((column: string, value: unknown) => {
      currentFilters[column] = value;
      return createChainable();
    }),
    in: mockIn.mockImplementation((column: string, values: unknown[]) => {
      currentFilters[column] = values;
      return createChainable();
    }),
    order: mockOrder.mockImplementation(() => createChainable()),
    limit: mockLimit.mockImplementation(() => createChainable()),
    single: mockSingle.mockImplementation(() => {
      const filtered = getFilteredData();
      resetChain();
      return Promise.resolve({
        data: filtered[0] ?? null,
        error: null,
      });
    }),
    maybeSingle: mockMaybeSingle.mockImplementation(() => {
      const filtered = getFilteredData();
      resetChain();
      return Promise.resolve({
        data: filtered[0] ?? null,
        error: null,
      });
    }),
    then: (resolve: (value: { data: unknown[]; error: null }) => void) => {
      const filtered = getFilteredData();
      resetChain();
      return Promise.resolve({
        data: filtered,
        error: null,
      }).then(resolve);
    },
  });

  // Main client mock
  const client = {
    from: vi.fn((table: string) => {
      currentTable = table;
      resetChain();
      return createChainable();
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    rpc: vi.fn((fnName: string) => {
      // Mock RPC calls - extend as needed
      if (fnName === 'get_current_member_id') {
        return Promise.resolve({ data: null, error: null });
      }
      if (fnName === 'is_commissioner') {
        return Promise.resolve({ data: false, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    // Expose mocks for assertions
    _mocks: {
      mockSelect,
      mockInsert,
      mockUpdate,
      mockDelete,
      mockEq,
      mockIn,
      mockOrder,
      mockLimit,
      mockSingle,
      mockMaybeSingle,
    },
  };

  return client;
}

/**
 * Creates a mock that simulates Supabase errors
 */
export function createMockSupabaseError(
  errorMessage: string,
  errorCode = 'PGRST301'
) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: errorMessage, code: errorCode },
          })
        ),
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve({
            data: null,
            error: { message: errorMessage, code: errorCode },
          }).then(resolve),
      })),
    })),
  };
}

/**
 * Type-safe wrapper for mocking the server Supabase client
 */
export function mockSupabaseServer(mockData: MockData = {}) {
  const mockClient = createMockSupabaseClient(mockData);

  return {
    mockClient,
    setupMock: () => {
      vi.mock('@/lib/supabase/server', () => ({
        createClient: vi.fn(() => mockClient),
        createAdminClient: vi.fn(() => mockClient),
      }));
    },
    resetMock: () => {
      vi.resetAllMocks();
    },
  };
}
