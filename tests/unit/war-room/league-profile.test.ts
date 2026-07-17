import { describe, expect, it } from 'vitest';

import { leagueProfile } from '@/lib/war-room/league-profile';

describe('2026 league profile', () => {
  it('captures the active lineup and reserve constraints from Yahoo', () => {
    expect(leagueProfile.roster.active).toEqual({
      QB: 1,
      WR: 2,
      RB: 2,
      TE: 1,
      FLEX: 2,
      K: 1,
      DEF: 1,
    });
    expect(leagueProfile.roster.activeSlots).toBe(10);
    expect(leagueProfile.roster.bench).toBe(4);
    expect(leagueProfile.roster.injuredReserve).toBe(2);
    expect(leagueProfile.roster.draftableSlots).toBe(14);
  });

  it('captures the scoring rules that materially change draft values', () => {
    expect(leagueProfile.scoring.passing.touchdown).toBe(4);
    expect(leagueProfile.scoring.passing.interception).toBe(-1);
    expect(leagueProfile.scoring.receiving.reception).toBe(1);
    expect(leagueProfile.scoring.bigPlayBonuses).toEqual({
      passingTouchdown40Plus: 1,
      rushingTouchdown40Plus: 2,
      receivingTouchdown40Plus: 1,
    });
    expect(leagueProfile.scoring.defense.pointsAllowed).toEqual({
      shutout: 10,
      oneToSix: 7,
      sevenToThirteen: 5,
      fourteenToTwenty: 2,
      twentyOneToTwentySeven: 0,
      twentyEightToThirtyFour: -2,
      thirtyFivePlus: -5,
    });
    expect(leagueProfile.scoring.defense.blockedKick).toBe(5);
  });
});
