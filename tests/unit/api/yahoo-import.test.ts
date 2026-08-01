// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/import/yahoo/route';
import { loadYahooCredentials, saveYahooCredentials } from '@/lib/yahoo/credentials';
import { syncYahooLeague } from '@/lib/yahoo/sync';
import { createAdminClient } from '@/lib/supabase/server';

const cookieGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

vi.mock('@/lib/yahoo/credentials', () => ({
  loadYahooCredentials: vi.fn(),
  saveYahooCredentials: vi.fn(),
}));

vi.mock('@/lib/yahoo/sync', () => ({
  syncYahooLeague: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

const storedTokens = {
  access_token: 'stored-access-token',
  refresh_token: 'stored-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
};

describe('Yahoo manual import route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockImplementation((name: string) =>
      name === 'league_access' ? { value: 'granted' } : undefined,
    );
  });

  it('syncs with durable server credentials instead of a browser token', async () => {
    vi.mocked(loadYahooCredentials).mockResolvedValue(storedTokens);
    vi.mocked(createAdminClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'league-1' } }),
        })),
      })),
    } as never);
    vi.mocked(syncYahooLeague).mockResolvedValue({
      success: true,
      teamsImported: 14,
      matchupsImported: 0,
      tradesImported: 0,
    });

    const response = await POST(new NextRequest(
      'https://modfantasyleague.com/api/import/yahoo',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ leagueKey: '475.l.123' }),
      },
    ));

    expect(saveYahooCredentials).toHaveBeenCalledWith('league-1', storedTokens);
    expect(syncYahooLeague).toHaveBeenCalledWith(expect.objectContaining({
      leagueKey: '475.l.123',
      mode: 'full',
      tokens: storedTokens,
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      teamsImported: 14,
      matchupsImported: 0,
      tradesImported: 0,
    });
  });
});
