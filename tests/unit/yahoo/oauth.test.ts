import { afterEach, describe, expect, it } from 'vitest';

import { getCanonicalAppUrl, getYahooRedirectUri } from '@/lib/yahoo/oauth';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalRedirectUri = process.env.YAHOO_REDIRECT_URI;

describe('Yahoo OAuth URL configuration', () => {
  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;

    if (originalRedirectUri === undefined) delete process.env.YAHOO_REDIRECT_URI;
    else process.env.YAHOO_REDIRECT_URI = originalRedirectUri;
  });

  it('uses the custom production domain as the canonical app origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://modfantasyleague.com/some-path';

    expect(getCanonicalAppUrl()).toBe('https://modfantasyleague.com');
  });

  it('prefers the explicit Yahoo callback URI', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://fantasymax.vercel.app';
    process.env.YAHOO_REDIRECT_URI =
      'https://modfantasyleague.com/api/auth/yahoo/callback';

    expect(getYahooRedirectUri()).toBe(
      'https://modfantasyleague.com/api/auth/yahoo/callback',
    );
  });

  it('derives the callback from the canonical app URL when no override exists', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://modfantasyleague.com';
    delete process.env.YAHOO_REDIRECT_URI;

    expect(getYahooRedirectUri()).toBe(
      'https://modfantasyleague.com/api/auth/yahoo/callback',
    );
  });

  it('rejects a callback on an unexpected path', () => {
    process.env.YAHOO_REDIRECT_URI = 'https://modfantasyleague.com/not-the-callback';

    expect(() => getYahooRedirectUri()).toThrow(
      'YAHOO_REDIRECT_URI must end with /api/auth/yahoo/callback',
    );
  });
});
