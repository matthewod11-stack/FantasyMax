import { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

function createRequest(pathname: string, cookie?: string) {
  const headers = new Headers();

  if (cookie) {
    headers.set('cookie', cookie);
  }

  return new NextRequest(new URL(pathname, 'https://modfantasyleague.com'), {
    headers,
  });
}

describe('league password middleware', () => {
  it('allows the Yahoo cron route through without a league cookie', async () => {
    const response = await updateSession(createRequest('/api/cron/yahoo-sync'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects cron subpaths without a league cookie', async () => {
    const response = await updateSession(createRequest('/api/cron/yahoo-sync/extra'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://modfantasyleague.com/gate?redirect=%2Fapi%2Fcron%2Fyahoo-sync%2Fextra'
    );
  });

  it('redirects protected API routes without a league cookie', async () => {
    const response = await updateSession(createRequest('/api/admin/sync-yahoo'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://modfantasyleague.com/gate?redirect=%2Fapi%2Fadmin%2Fsync-yahoo'
    );
  });
});
