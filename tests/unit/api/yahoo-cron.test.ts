import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/cron/yahoo-sync/route';
import { syncCurrentSeason } from '@/lib/yahoo/sync';

vi.mock('@/lib/yahoo/sync', () => ({
  syncCurrentSeason: vi.fn(),
}));

function createRequest(authorization?: string) {
  const headers = new Headers();

  if (authorization) {
    headers.set('authorization', authorization);
  }

  return new NextRequest('https://modfantasyleague.com/api/cron/yahoo-sync', {
    headers,
  });
}

describe('Yahoo cron route auth', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.clearAllMocks();
  });

  it('returns 401 when CRON_SECRET is missing', async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(syncCurrentSeason).not.toHaveBeenCalled();
  });

  it('returns 401 when the bearer token is wrong', async () => {
    process.env.CRON_SECRET = 'test-cron-secret';

    const response = await GET(createRequest('Bearer wrong-secret'));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(syncCurrentSeason).not.toHaveBeenCalled();
  });
});
