// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/yahoo/route';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalClientId = process.env.YAHOO_CLIENT_ID;
const originalRedirectUri = process.env.YAHOO_REDIRECT_URI;
const cookieSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: cookieSet })),
}));

describe('Yahoo auth route', () => {
  afterEach(() => {
    vi.clearAllMocks();
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;

    if (originalClientId === undefined) delete process.env.YAHOO_CLIENT_ID;
    else process.env.YAHOO_CLIENT_ID = originalClientId;

    if (originalRedirectUri === undefined) delete process.env.YAHOO_REDIRECT_URI;
    else process.env.YAHOO_REDIRECT_URI = originalRedirectUri;
  });

  it('sends Yahoo back to the custom production domain', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://modfantasyleague.com';
    process.env.YAHOO_CLIENT_ID = 'test-client-id';
    process.env.YAHOO_REDIRECT_URI =
      'https://modfantasyleague.com/api/auth/yahoo/callback';

    const response = await GET();
    const location = new URL(response.headers.get('location') ?? '');

    expect(response.status).toBe(307);
    expect(location.origin).toBe('https://api.login.yahoo.com');
    expect(location.searchParams.get('redirect_uri')).toBe(
      'https://modfantasyleague.com/api/auth/yahoo/callback',
    );
    expect(location.searchParams.get('state')).toMatch(/^[a-f0-9]{64}$/);
    expect(cookieSet).toHaveBeenCalledWith(
      'yahoo_oauth_state',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({ httpOnly: true, maxAge: 600 }),
    );
  });
});
