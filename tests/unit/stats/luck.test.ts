/**
 * Luck Calculator Tests
 *
 * Unit tests for expected wins, luck index, and schedule strength calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateExpectedWins,
  calculateActualWins,
  calculateLuckIndex,
  calculateScheduleStrength,
  calculateLuckStats,
  formatLuckIndex,
  classifyLuck,
  getLuckDescription,
  formatScheduleStrength,
  classifySchedule,
  type WeeklyScore,
  type OpponentRecord,
} from '@/lib/stats/luck';

// =====================================
// Test Data Helpers
// =====================================

function createWeeklyScore(
  week: number,
  score: number,
  actualWin: boolean,
  teamId = 'team-1',
  memberId = 'member-1',
  seasonId = 'season-1',
  isPlayoff = false
): WeeklyScore {
  return { seasonId, week, teamId, memberId, score, actualWin, isPlayoff };
}

function createOpponentRecord(
  memberId: string,
  wins: number,
  losses: number,
  ties = 0
): OpponentRecord {
  return { memberId, wins, losses, ties };
}

// =====================================
// Expected Wins Tests
// =====================================

describe('calculateExpectedWins', () => {
  it('should calculate expected wins when outscoring all opponents', () => {
    // Member scores 150, all others score 100
    const memberScores = [createWeeklyScore(1, 150, true)];
    const allScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1'),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2'),
      createWeeklyScore(1, 100, false, 'team-3', 'member-3'),
      createWeeklyScore(1, 100, false, 'team-4', 'member-4'),
    ];

    // Beat 3 teams out of 3 = 1.0 expected wins
    const expected = calculateExpectedWins(memberScores, allScores);
    expect(expected).toBe(1);
  });

  it('should calculate expected wins when outscoring half', () => {
    const memberScores = [createWeeklyScore(1, 110, true)];
    const allScores = [
      createWeeklyScore(1, 110, true, 'team-1', 'member-1'),
      createWeeklyScore(1, 120, false, 'team-2', 'member-2'),
      createWeeklyScore(1, 105, false, 'team-3', 'member-3'),
      createWeeklyScore(1, 100, false, 'team-4', 'member-4'),
    ];

    // Beat 2 out of 3 opponents = 2/3 ≈ 0.667 expected wins
    const expected = calculateExpectedWins(memberScores, allScores);
    expect(expected).toBeCloseTo(0.667, 2);
  });

  it('should handle ties as half wins', () => {
    const memberScores = [createWeeklyScore(1, 100, true)];
    const allScores = [
      createWeeklyScore(1, 100, true, 'team-1', 'member-1'),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2'), // tie
      createWeeklyScore(1, 90, false, 'team-3', 'member-3'),  // beat
    ];

    // 1 win + 0.5 tie = 1.5 / 2 opponents = 0.75
    const expected = calculateExpectedWins(memberScores, allScores);
    expect(expected).toBeCloseTo(0.75, 2);
  });

  it('should sum expected wins across multiple weeks', () => {
    const memberScores = [
      createWeeklyScore(1, 150, true),
      createWeeklyScore(2, 90, false),
    ];
    const allScores = [
      // Week 1: member beats everyone
      createWeeklyScore(1, 150, true, 'team-1', 'member-1'),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2'),
      // Week 2: member loses to everyone
      createWeeklyScore(2, 90, false, 'team-1', 'member-1'),
      createWeeklyScore(2, 120, true, 'team-2', 'member-2'),
    ];

    // Week 1: beat 1 of 1 = 1.0, Week 2: beat 0 of 1 = 0.0
    // Total expected = 1.0
    const expected = calculateExpectedWins(memberScores, allScores);
    expect(expected).toBe(1);
  });

  it('should exclude playoff weeks by default', () => {
    const memberScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1', 'season-1', false),
      createWeeklyScore(2, 150, true, 'team-1', 'member-1', 'season-1', true), // playoff
    ];
    const allScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1', 'season-1', false),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2', 'season-1', false),
      createWeeklyScore(2, 150, true, 'team-1', 'member-1', 'season-1', true),
      createWeeklyScore(2, 100, false, 'team-2', 'member-2', 'season-1', true),
    ];

    // Only week 1 counted (not playoff)
    const expected = calculateExpectedWins(memberScores, allScores, false);
    expect(expected).toBe(1);
  });

  it('should include playoff weeks when specified', () => {
    const memberScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1', 'season-1', false),
      createWeeklyScore(2, 150, true, 'team-1', 'member-1', 'season-1', true),
    ];
    const allScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1', 'season-1', false),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2', 'season-1', false),
      createWeeklyScore(2, 150, true, 'team-1', 'member-1', 'season-1', true),
      createWeeklyScore(2, 100, false, 'team-2', 'member-2', 'season-1', true),
    ];

    // Both weeks counted
    const expected = calculateExpectedWins(memberScores, allScores, true);
    expect(expected).toBe(2);
  });
});

// =====================================
// Actual Wins Tests
// =====================================

describe('calculateActualWins', () => {
  it('should count actual wins', () => {
    const scores = [
      createWeeklyScore(1, 100, true),
      createWeeklyScore(2, 100, true),
      createWeeklyScore(3, 100, false),
    ];
    expect(calculateActualWins(scores)).toBe(2);
  });

  it('should exclude playoff weeks by default', () => {
    const scores = [
      createWeeklyScore(1, 100, true, 'team-1', 'member-1', 'season-1', false),
      createWeeklyScore(2, 100, true, 'team-1', 'member-1', 'season-1', true), // playoff
    ];
    expect(calculateActualWins(scores, false)).toBe(1);
  });
});

// =====================================
// Luck Index Tests
// =====================================

describe('calculateLuckIndex', () => {
  it('should return positive for lucky player', () => {
    expect(calculateLuckIndex(10, 8.5)).toBeCloseTo(1.5, 1);
  });

  it('should return negative for unlucky player', () => {
    expect(calculateLuckIndex(6, 8.5)).toBeCloseTo(-2.5, 1);
  });

  it('should return zero for neutral luck', () => {
    expect(calculateLuckIndex(8, 8)).toBe(0);
  });
});

// =====================================
// Schedule Strength Tests
// =====================================

describe('calculateScheduleStrength', () => {
  it('should calculate average opponent win percentage', () => {
    const opponents = [
      createOpponentRecord('opp-1', 10, 4), // .714
      createOpponentRecord('opp-2', 7, 7),  // .500
    ];
    // Average = (.714 + .500) / 2 = .607
    expect(calculateScheduleStrength(opponents)).toBeCloseTo(0.607, 2);
  });

  it('should handle ties in opponent records', () => {
    const opponents = [
      createOpponentRecord('opp-1', 6, 6, 2), // (6+1)/14 = .500
    ];
    expect(calculateScheduleStrength(opponents)).toBeCloseTo(0.5, 2);
  });

  it('should return 0 for no opponents', () => {
    expect(calculateScheduleStrength([])).toBe(0);
  });

  it('should skip opponents with zero games', () => {
    const opponents = [
      createOpponentRecord('opp-1', 10, 4), // .714
      createOpponentRecord('opp-2', 0, 0),  // skip
    ];
    expect(calculateScheduleStrength(opponents)).toBeCloseTo(0.714, 2);
  });
});

// =====================================
// Combined Stats Tests
// =====================================

describe('calculateLuckStats', () => {
  it('should calculate complete luck stats', () => {
    const memberScores = [
      createWeeklyScore(1, 150, true),  // Won, beat everyone
      createWeeklyScore(2, 90, false),  // Lost, beat no one
    ];
    const allScores = [
      createWeeklyScore(1, 150, true, 'team-1', 'member-1'),
      createWeeklyScore(1, 100, false, 'team-2', 'member-2'),
      createWeeklyScore(2, 90, false, 'team-1', 'member-1'),
      createWeeklyScore(2, 120, true, 'team-2', 'member-2'),
    ];
    const opponents = [
      createOpponentRecord('member-2', 7, 7), // .500
    ];

    const stats = calculateLuckStats(memberScores, allScores, opponents, false);

    expect(stats.actualWins).toBe(1);
    expect(stats.expectedWins).toBe(1); // Week 1: 1.0, Week 2: 0.0
    expect(stats.luckIndex).toBe(0);
    expect(stats.scheduleStrength).toBeCloseTo(0.5, 2);
    expect(stats.weeksPlayed).toBe(2);
  });
});

// =====================================
// Formatting Tests
// =====================================

describe('formatLuckIndex', () => {
  it('should format positive with plus sign', () => {
    expect(formatLuckIndex(2.3)).toBe('+2.3');
  });

  it('should format negative with minus sign', () => {
    expect(formatLuckIndex(-1.5)).toBe('-1.5');
  });

  it('should format zero with plus sign', () => {
    expect(formatLuckIndex(0)).toBe('+0.0');
  });
});

describe('classifyLuck', () => {
  it('should classify very lucky', () => {
    expect(classifyLuck(2.5)).toBe('very_lucky');
  });

  it('should classify lucky', () => {
    expect(classifyLuck(1.0)).toBe('lucky');
  });

  it('should classify neutral', () => {
    expect(classifyLuck(0.2)).toBe('neutral');
  });

  it('should classify unlucky', () => {
    expect(classifyLuck(-1.0)).toBe('unlucky');
  });

  it('should classify very unlucky', () => {
    expect(classifyLuck(-2.5)).toBe('very_unlucky');
  });
});

describe('getLuckDescription', () => {
  it('should return human-readable descriptions', () => {
    expect(getLuckDescription('very_lucky')).toBe('Very Lucky');
    expect(getLuckDescription('lucky')).toBe('Lucky');
    expect(getLuckDescription('neutral')).toBe('About Average');
    expect(getLuckDescription('unlucky')).toBe('Unlucky');
    expect(getLuckDescription('very_unlucky')).toBe('Very Unlucky');
  });
});

describe('formatScheduleStrength', () => {
  it('should format as percentage', () => {
    expect(formatScheduleStrength(0.52)).toBe('52%');
  });

  it('should round to whole number', () => {
    expect(formatScheduleStrength(0.5267)).toBe('53%');
  });
});

describe('classifySchedule', () => {
  it('should classify schedule difficulty', () => {
    expect(classifySchedule(0.60)).toBe('very_hard');
    expect(classifySchedule(0.53)).toBe('hard');
    expect(classifySchedule(0.50)).toBe('average');
    expect(classifySchedule(0.46)).toBe('easy');
    expect(classifySchedule(0.40)).toBe('very_easy');
  });
});
