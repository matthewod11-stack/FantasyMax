// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/yahoo/disconnect/route';
import { deleteYahooCredentials } from '@/lib/yahoo/credentials';

const cookieDelete = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ delete: cookieDelete })),
}));

vi.mock('@/lib/yahoo/credentials', () => ({
  deleteYahooCredentials: vi.fn(),
}));

describe('Yahoo disconnect route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes the durable credential as well as the legacy cookie', async () => {
    const response = await POST();

    expect(deleteYahooCredentials).toHaveBeenCalledOnce();
    expect(cookieDelete).toHaveBeenCalledWith('yahoo_tokens');
    expect(await response.json()).toEqual({ success: true });
  });
});
