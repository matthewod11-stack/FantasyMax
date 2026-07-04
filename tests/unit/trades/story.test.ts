import { describe, expect, it } from 'vitest';
import { formatTradeChampionshipImpact } from '@/lib/trades/story';

describe('trade storytelling helpers', () => {
  it('describes when one side later won the season title', () => {
    expect(
      formatTradeChampionshipImpact({
        seasonYear: 2024,
        team1MemberName: 'Garrett C',
        team2MemberName: 'PJ M',
        team1IsChampion: true,
        team2IsChampion: false,
      }),
    ).toBe('Garrett C won the 2024 championship after this deal.');
  });

  it('omits championship impact when neither side won the title', () => {
    expect(
      formatTradeChampionshipImpact({
        seasonYear: 2024,
        team1MemberName: 'Garrett C',
        team2MemberName: 'PJ M',
        team1IsChampion: false,
        team2IsChampion: false,
      }),
    ).toBeNull();
  });
});
