import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLatestWeeklyDigestForAdmin, getWeeklyDigest } from '@/lib/supabase/queries/weekly-digest';

const maybeSingle = vi.hoisted(() => vi.fn());
const eq = vi.hoisted(() => vi.fn());
const order = vi.hoisted(() => vi.fn());
const limit = vi.hoisted(() => vi.fn());
const select = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());

const chain = vi.hoisted(() => ({
  select,
  eq,
  order,
  limit,
  maybeSingle,
}));

vi.mock('@/lib/supabase/server', () => ({
  getUntypedAdminClient: vi.fn(async () => ({ from })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue(chain);
  select.mockReturnValue(chain);
  eq.mockReturnValue(chain);
  order.mockReturnValue(chain);
  limit.mockReturnValue(chain);
});

describe('weekly digest queries', () => {
  it('only returns published digests for the member dashboard', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const digest = await getWeeklyDigest('season-1', 4);

    expect(digest).toBeNull();
    expect(from).toHaveBeenCalledWith('weekly_digests');
    expect(eq).toHaveBeenCalledWith('season_id', 'season-1');
    expect(eq).toHaveBeenCalledWith('week', 4);
    expect(eq).toHaveBeenCalledWith('status', 'published');
  });

  it('maps published digest fields for dashboard rendering', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'digest-1',
        season_id: 'season-1',
        week: 4,
        highlights: [{ type: 'closest', title: 'Nail-Biter', description: 'Won by 0.4' }],
        email_subject: 'Week 4',
        email_body: 'Body copy',
        generated_at: '2026-09-29T12:00:00.000Z',
        status: 'published',
        commissioner_note: 'Stop leaving points on the bench.',
        published_at: '2026-09-29T13:00:00.000Z',
        published_title: 'Week 4 Dispatch',
        seasons: { year: 2026 },
      },
      error: null,
    });

    const digest = await getWeeklyDigest('season-1', 4);

    expect(digest).toMatchObject({
      id: 'digest-1',
      week: 4,
      seasonYear: 2026,
      emailSubject: 'Week 4',
      emailBody: 'Body copy',
      status: 'published',
      commissionerNote: 'Stop leaving points on the bench.',
      publishedAt: '2026-09-29T13:00:00.000Z',
      publishedTitle: 'Week 4 Dispatch',
    });
    expect(digest?.highlights).toHaveLength(1);
  });

  it('lets the admin page fetch the latest draft or published digest', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'digest-2',
        season_id: 'season-1',
        week: 5,
        highlights: {},
        email_subject: 'Week 5',
        email_body: 'Draft body',
        generated_at: '2026-10-06T12:00:00.000Z',
        status: 'draft',
        commissioner_note: null,
        published_at: null,
        published_title: null,
        seasons: { year: 2026 },
      },
      error: null,
    });

    const digest = await getLatestWeeklyDigestForAdmin('season-1');

    expect(digest).toMatchObject({
      id: 'digest-2',
      seasonId: 'season-1',
      week: 5,
      status: 'draft',
      publishedTitle: 'Week 5 League Dispatch',
    });
    expect(digest?.highlights).toEqual([]);
    expect(eq).not.toHaveBeenCalledWith('status', 'published');
  });
});
