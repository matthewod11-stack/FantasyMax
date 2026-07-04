import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllWriteups } from '@/lib/supabase/queries/writeups';

const eq = vi.hoisted(() => vi.fn());
const order = vi.hoisted(() => vi.fn());
const select = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());

const chain = vi.hoisted(() => ({
  select,
  eq,
  order,
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({ from })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue(chain);
  select.mockReturnValue(chain);
  eq.mockReturnValue(chain);
});

describe('writeup queries', () => {
  it('loads member mentions with each writeup for lore filtering', async () => {
    order.mockResolvedValueOnce({
      data: [
        {
          id: 'writeup-1',
          title: '2024 Vegas Draft Planning',
          content: 'Garrett is confirmed for Vegas.',
          excerpt: 'Garrett is confirmed for Vegas.',
          season_id: 'season-2024',
          week: null,
          writeup_type: 'draft_notes',
          author_id: 'author-1',
          status: 'published',
          published_at: '2024-08-01T00:00:00.000Z',
          is_featured: false,
          imported_from: 'alltimewriteups.md',
          original_order: 1,
          created_at: '2024-08-01T00:00:00.000Z',
          updated_at: '2024-08-01T00:00:00.000Z',
          author: {
            id: 'author-1',
            display_name: 'Matt OD',
            avatar_url: null,
          },
          season: {
            id: 'season-2024',
            year: 2024,
          },
          mentions: [
            {
              id: 'mention-1',
              writeup_id: 'writeup-1',
              member_id: 'member-garrett',
              mention_context: 'Garrett is confirmed for Vegas.',
              created_at: '2024-08-01T00:00:00.000Z',
              member: {
                id: 'member-garrett',
                display_name: 'Garrett C',
                avatar_url: null,
              },
            },
          ],
        },
      ],
      error: null,
    });

    const writeups = await getAllWriteups();

    expect(select).toHaveBeenCalledWith(expect.stringContaining('mentions:writeup_mentions'));
    expect(writeups[0]?.mentions).toEqual([
      {
        id: 'mention-1',
        writeup_id: 'writeup-1',
        member_id: 'member-garrett',
        mention_context: 'Garrett is confirmed for Vegas.',
        created_at: '2024-08-01T00:00:00.000Z',
        member: {
          id: 'member-garrett',
          display_name: 'Garrett C',
          avatar_url: null,
        },
      },
    ]);
  });
});
