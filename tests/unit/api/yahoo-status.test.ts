// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/import/yahoo/status/route';
import { getYahooClient } from '@/lib/yahoo/client';
import { loadYahooCredentials, saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';

vi.mock('@/lib/yahoo/client', () => ({
  getYahooClient: vi.fn(),
}));

vi.mock('@/lib/yahoo/credentials', () => ({
  loadYahooCredentials: vi.fn(),
  saveYahooCredentials: vi.fn(),
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

describe('Yahoo connection status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports connected from durable server credentials without a browser token', async () => {
    vi.mocked(loadYahooCredentials).mockResolvedValue(storedTokens);
    vi.mocked(getYahooClient).mockReturnValue({
      getAllUserLeagues: vi.fn().mockResolvedValue([
        { league_key: '475.l.123', name: '2026 League', season: '2026', num_teams: 14 },
      ]),
      getTokens: vi.fn().mockReturnValue(storedTokens),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      connected: true,
      leagues: [
        { league_key: '475.l.123', name: '2026 League', season: '2026', num_teams: 14 },
      ],
    });
    expect(saveYahooCredentials).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('reports disconnected when neither cookie nor stored credentials exist', async () => {
    vi.mocked(loadYahooCredentials).mockResolvedValue(null);

    const response = await GET();

    expect(await response.json()).toEqual({ connected: false });
    expect(getYahooClient).not.toHaveBeenCalled();
  });

  it('reports Yahoo Fantasy authorization failures without exposing the upstream response', async () => {
    vi.mocked(loadYahooCredentials).mockResolvedValue(storedTokens);
    vi.mocked(getYahooClient).mockReturnValue({
      getAllUserLeagues: vi
        .fn()
        .mockRejectedValue(
          new Error('Yahoo API error: 403 - This application is not authorized to perform this action.'),
        ),
    } as never);

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      connected: false,
      code: 'yahoo_fantasy_api_unavailable',
      error:
        'Yahoo accepted the account connection, but is not authorizing Fantasy Sports API access for this application.',
    });
  });
});
