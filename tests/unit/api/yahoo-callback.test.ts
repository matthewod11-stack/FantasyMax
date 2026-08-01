// @vitest-environment node

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/yahoo/callback/route';
import { YahooFantasyClient } from '@/lib/yahoo/client';
import { saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';

const cookieGet = vi.fn();
const cookieDelete = vi.fn();
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalRedirectUri = process.env.YAHOO_REDIRECT_URI;

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet, delete: cookieDelete })),
}));

vi.mock('@/lib/yahoo/client', () => ({
  YahooFantasyClient: {
    exchangeCodeForTokens: vi.fn(),
  },
}));

vi.mock('@/lib/yahoo/credentials', () => ({
  saveYahooCredentials: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

const tokens = {
  access_token: 'new-access-token',
  refresh_token: 'new-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
};

function callbackRequest(state: string) {
  return new NextRequest(
    `https://modfantasyleague.com/api/auth/yahoo/callback?code=auth-code&state=${state}`,
  );
}

describe('Yahoo OAuth callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://modfantasyleague.com';
    process.env.YAHOO_REDIRECT_URI =
      'https://modfantasyleague.com/api/auth/yahoo/callback';
    cookieGet.mockReturnValue({ value: 'expected-state' });
  });

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;

    if (originalRedirectUri === undefined) delete process.env.YAHOO_REDIRECT_URI;
    else process.env.YAHOO_REDIRECT_URI = originalRedirectUri;
  });

  it('rejects a callback whose state does not match', async () => {
    const response = await GET(callbackRequest('wrong-state'));

    expect(response.headers.get('location')).toBe(
      'https://modfantasyleague.com/admin/import/yahoo?error=invalid_state',
    );
    expect(YahooFantasyClient.exchangeCodeForTokens).not.toHaveBeenCalled();
    expect(saveYahooCredentials).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith('yahoo_oauth_state');
  });

  it('stores refreshed credentials server-side and returns to the custom domain', async () => {
    vi.mocked(YahooFantasyClient.exchangeCodeForTokens).mockResolvedValue(tokens);
    vi.mocked(createAdminClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'league-1' } }),
        })),
      })),
    } as never);

    const response = await GET(callbackRequest('expected-state'));

    expect(YahooFantasyClient.exchangeCodeForTokens).toHaveBeenCalledWith(
      'auth-code',
      'https://modfantasyleague.com/api/auth/yahoo/callback',
    );
    expect(saveYahooCredentials).toHaveBeenCalledWith('league-1', tokens);
    expect(cookieDelete).toHaveBeenCalledWith('yahoo_oauth_state');
    expect(response.headers.get('location')).toBe(
      'https://modfantasyleague.com/admin/import/yahoo?success=true',
    );
  });
});
