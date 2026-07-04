import { describe, expect, it } from 'vitest';
import type {
  WriteupType,
  WriteupWithDetails,
  WriteupsBySeason,
} from '@/types/contracts/queries';
import {
  filterWriteupSeasons,
  getWriteupFilterOptions,
  getWriteupLoreTopics,
} from '@/lib/writeups/lore';

function writeup(overrides: Partial<WriteupWithDetails>): WriteupWithDetails {
  return {
    id: overrides.id ?? 'writeup-1',
    title: overrides.title ?? '2024 Week 1 Recap',
    content: overrides.content ?? 'Week 1 recap content',
    excerpt: overrides.excerpt ?? 'Week 1 recap content',
    season_id: overrides.season_id ?? 'season-2024',
    week: overrides.week ?? 1,
    writeup_type: overrides.writeup_type ?? 'weekly_recap',
    author_id: overrides.author_id ?? 'author-1',
    status: overrides.status ?? 'published',
    published_at: overrides.published_at ?? '2024-09-10T00:00:00.000Z',
    is_featured: overrides.is_featured ?? false,
    imported_from: overrides.imported_from ?? 'alltimewriteups.md',
    original_order: overrides.original_order ?? 1,
    created_at: overrides.created_at ?? '2024-09-10T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2024-09-10T00:00:00.000Z',
    author: overrides.author ?? {
      id: 'author-1',
      display_name: 'Matt OD',
      avatar_url: null,
    },
    season: overrides.season ?? {
      id: 'season-2024',
      year: 2024,
    },
    mentions: overrides.mentions ?? [],
  };
}

const seasons: WriteupsBySeason[] = [
  {
    season_year: 2024,
    season_id: 'season-2024',
    ai_review: 'AI review should not appear in filtered lore views',
    ai_review_generated_at: '2026-07-04T00:00:00.000Z',
    writeups: [
      writeup({
        id: 'draft-2024',
        title: '2024 Vegas Draft Planning',
        content: 'Vegas draft weekend, suite booked, custom draft board has arrived.',
        writeup_type: 'draft_notes',
        week: null,
        mentions: [
          {
            id: 'mention-1',
            writeup_id: 'draft-2024',
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
      }),
      writeup({
        id: 'trade-2024',
        title: '2024 Trade Drama',
        content: 'Trade block drama and deadline panic hit the league.',
        writeup_type: 'announcement',
        week: null,
      }),
    ],
  },
  {
    season_year: 2023,
    season_id: 'season-2023',
    ai_review: null,
    ai_review_generated_at: null,
    writeups: [
      writeup({
        id: 'championship-2023',
        title: '2023 Championship Recap',
        content: 'Championship recap after the title game and playoff bracket collapse.',
        writeup_type: 'season_recap',
        season_id: 'season-2023',
        season: {
          id: 'season-2023',
          year: 2023,
        },
      }),
    ],
  },
];

describe('writeup lore topics and filters', () => {
  it.each([
    ['draft_notes' as WriteupType, 'Vegas draft weekend', ['draft']],
    ['announcement' as WriteupType, 'TRADE BLOCK and deadline drama', ['trade']],
    ['season_recap' as WriteupType, 'Championship recap and title game', ['playoffs', 'championship']],
    ['playoff_preview' as WriteupType, 'Final playoff seed scenarios', ['playoffs']],
  ])('derives lore topics for %s', (writeupType, content, expectedTopics) => {
    expect(
      getWriteupLoreTopics(
        writeup({
          writeup_type: writeupType,
          title: content,
          content,
        }),
      ),
    ).toEqual(expectedTopics);
  });

  it('filters grouped writeups by season, type, topic, and mentioned member', () => {
    const filtered = filterWriteupSeasons(seasons, {
      seasonYear: 2024,
      type: 'draft_notes',
      topic: 'draft',
      memberId: 'member-garrett',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.season_year).toBe(2024);
    expect(filtered[0]?.ai_review).toBeNull();
    expect(filtered[0]?.writeups.map((item) => item.id)).toEqual(['draft-2024']);
  });

  it('builds compact filter options from the loaded archive', () => {
    const options = getWriteupFilterOptions(seasons);

    expect(options.seasons).toEqual([2024, 2023]);
    expect(options.types).toEqual(['announcement', 'draft_notes', 'season_recap']);
    expect(options.topics).toEqual(['playoffs', 'draft', 'trade', 'championship']);
    expect(options.members).toEqual([
      {
        id: 'member-garrett',
        displayName: 'Garrett C',
        avatarUrl: null,
      },
    ]);
  });
});
