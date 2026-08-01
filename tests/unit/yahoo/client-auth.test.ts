import { afterEach, describe, expect, it } from 'vitest';
import { YahooFantasyClient } from '@/lib/yahoo/client';

describe('YahooFantasyClient.getAuthUrl', () => {
  const originalClientId = process.env.YAHOO_CLIENT_ID;

  afterEach(() => {
    if (originalClientId === undefined) {
      delete process.env.YAHOO_CLIENT_ID;
    } else {
      process.env.YAHOO_CLIENT_ID = originalClientId;
    }
  });

  it('uses Yahoo app permissions and forces a fresh consent grant', () => {
    process.env.YAHOO_CLIENT_ID = 'test-client-id';

    const authUrl = new URL(
      YahooFantasyClient.getAuthUrl(
        'https://modfantasyleague.com/api/auth/yahoo/callback',
        'test-state',
      ),
    );

    expect(authUrl.origin + authUrl.pathname).toBe(
      'https://api.login.yahoo.com/oauth2/request_auth',
    );
    expect(authUrl.searchParams.get('client_id')).toBe('test-client-id');
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://modfantasyleague.com/api/auth/yahoo/callback',
    );
    expect(authUrl.searchParams.get('response_type')).toBe('code');
    expect(authUrl.searchParams.get('prompt')).toBe('consent');
    expect(authUrl.searchParams.get('state')).toBe('test-state');
    expect(authUrl.searchParams.has('scope')).toBe(false);
  });
});
