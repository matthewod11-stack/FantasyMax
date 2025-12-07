/**
 * Stat Calculator Tests
 *
 * Unit tests for the stat calculation utilities.
 * Uses fixtures to verify calculations against known data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateWinPercentage,
  formatWinPercentage,
  aggregateRecords,
  calculateH2HRecord,
  classifyRivalry,
  calculateCurrentStreak,
  calculatePointsStats,
  calculateAchievements,
  calculateMargin,
  isBlowout,
  isCloseGame,
  type Record,
  type H2HRecord,
} from '@/lib/stats/calculators';
import {
  MIKE_TEAMS,
  JOHN_TEAMS,
  MIKE_TEAM_2024,
  DAVID_TEAM_2024,
  ALL_TEAMS,
  TEAM_IDS,
} from '../../fixtures/teams';
import {
  MIKE_VS_JOHN_MATCHUPS,
  MATCHUP_2024_W8_JOHN_DAVID,
  MATCHUP_2024_W12_MIKE_JOHN,
  ALL_MATCHUPS,
} from '../../fixtures/matchups';
import { MEMBER_IDS } from '../../fixtures/members';
import { createMatchup } from '../../fixtures/factory';

// Helper to create team-to-member map from fixtures
function createTeamToMemberMap(): Map<string, string> {
  const map = new Map<string, string>();
  ALL_TEAMS.forEach((team) => {
    map.set(team.id, team.member_id);
  });
  return map;
}

describe('Win Percentage Calculations', () => {
  describe('calculateWinPercentage', () => {
    it('should calculate simple win percentage', () => {
      const record: Record = { wins: 10, losses: 4, ties: 0 };
      expect(calculateWinPercentage(record)).toBeCloseTo(0.714, 3);
    });

    it('should handle perfect record', () => {
      const record: Record = { wins: 14, losses: 0, ties: 0 };
      expect(calculateWinPercentage(record)).toBe(1);
    });

    it('should handle winless record', () => {
      const record: Record = { wins: 0, losses: 14, ties: 0 };
      expect(calculateWinPercentage(record)).toBe(0);
    });

    it('should count ties as half a win', () => {
      const record: Record = { wins: 6, losses: 6, ties: 2 };
      // (6 + 1) / 14 = 0.5
      expect(calculateWinPercentage(record)).toBeCloseTo(0.5, 3);
    });

    it('should handle all ties', () => {
      const record: Record = { wins: 0, losses: 0, ties: 10 };
      expect(calculateWinPercentage(record)).toBe(0.5);
    });

    it('should return 0 for no games', () => {
      const record: Record = { wins: 0, losses: 0, ties: 0 };
      expect(calculateWinPercentage(record)).toBe(0);
    });

    it('should calculate correctly using Mike 2024 fixture', () => {
      const record: Record = {
        wins: MIKE_TEAM_2024.final_record_wins ?? 0,
        losses: MIKE_TEAM_2024.final_record_losses ?? 0,
        ties: MIKE_TEAM_2024.final_record_ties ?? 0,
      };
      // 11-3-0 = 11/14 = 0.786
      expect(calculateWinPercentage(record)).toBeCloseTo(0.786, 3);
    });
  });

  describe('formatWinPercentage', () => {
    it('should format as baseball-style (.714)', () => {
      expect(formatWinPercentage(0.714)).toBe('.714');
    });

    it('should handle 1.000 (perfect)', () => {
      expect(formatWinPercentage(1)).toBe('1.000');
    });

    it('should handle 0.000 (winless)', () => {
      expect(formatWinPercentage(0)).toBe('.000');
    });

    it('should handle 0.500 (even)', () => {
      expect(formatWinPercentage(0.5)).toBe('.500');
    });
  });

  describe('aggregateRecords', () => {
    it('should aggregate Mike career from team fixtures', () => {
      const career = aggregateRecords(MIKE_TEAMS);
      // 11+12+8+10 = 41 wins, 3+2+6+3 = 14 losses (from fixture tests)
      expect(career.wins).toBe(41);
      expect(career.losses).toBe(14);
      expect(career.ties).toBe(0);
    });

    it('should handle empty teams array', () => {
      const career = aggregateRecords([]);
      expect(career).toEqual({ wins: 0, losses: 0, ties: 0 });
    });

    it('should aggregate John career from team fixtures', () => {
      const career = aggregateRecords(JOHN_TEAMS);
      // 9+10+11+9 = 39 wins, 5+4+3+4 = 16 losses
      expect(career.wins).toBe(39);
      expect(career.losses).toBe(16);
    });
  });
});

describe('Head-to-Head Calculations', () => {
  let teamToMember: Map<string, string>;

  beforeEach(() => {
    teamToMember = createTeamToMemberMap();
  });

  describe('calculateH2HRecord', () => {
    it('should calculate Mike vs John H2H correctly', () => {
      const h2h = calculateH2HRecord(
        MIKE_VS_JOHN_MATCHUPS,
        teamToMember,
        MEMBER_IDS.MIKE,
        MEMBER_IDS.JOHN
      );

      // Based on fixtures: Mike 6-4 over John
      expect(h2h.member1Wins).toBe(6); // Mike wins
      expect(h2h.member2Wins).toBe(4); // John wins
      expect(h2h.ties).toBe(0);
      expect(h2h.totalMatchups).toBe(10);
    });

    it('should calculate total points scored', () => {
      const h2h = calculateH2HRecord(
        MIKE_VS_JOHN_MATCHUPS,
        teamToMember,
        MEMBER_IDS.MIKE,
        MEMBER_IDS.JOHN
      );

      expect(h2h.member1Points).toBeGreaterThan(0);
      expect(h2h.member2Points).toBeGreaterThan(0);
    });

    it('should handle empty matchups', () => {
      const h2h = calculateH2HRecord([], teamToMember, 'member1', 'member2');

      expect(h2h.totalMatchups).toBe(0);
      expect(h2h.member1Wins).toBe(0);
      expect(h2h.member2Wins).toBe(0);
    });

    it('should handle members with no matchups against each other', () => {
      // Mike vs David - limited matchups in our fixtures
      const h2h = calculateH2HRecord(
        ALL_MATCHUPS,
        teamToMember,
        MEMBER_IDS.MIKE,
        MEMBER_IDS.DAVID
      );

      // These members don't have matchups in our sample
      expect(h2h.totalMatchups).toBe(0);
    });
  });

  describe('classifyRivalry', () => {
    it('should classify Mike as having John as rival (6-4)', () => {
      const h2h: H2HRecord = {
        member1Wins: 6,
        member2Wins: 4,
        ties: 0,
        member1Points: 1500,
        member2Points: 1400,
        totalMatchups: 10,
      };

      // Mike wins 60% - close enough to be "rival", not dominant enough for "victim"
      // Victim requires 70%+ dominance (win diff / decided >= 0.4)
      expect(classifyRivalry(h2h)).toBe('rival');
    });

    it('should classify as victim when dominating (8-2)', () => {
      const h2h: H2HRecord = {
        member1Wins: 8,
        member2Wins: 2,
        ties: 0,
        member1Points: 1600,
        member2Points: 1200,
        totalMatchups: 10,
      };

      // 80% win rate = clear victim
      expect(classifyRivalry(h2h)).toBe('victim');
    });

    it('should classify as nemesis when losing significantly', () => {
      const h2h: H2HRecord = {
        member1Wins: 2,
        member2Wins: 8,
        ties: 0,
        member1Points: 1200,
        member2Points: 1600,
        totalMatchups: 10,
      };

      // Member1 wins only 20%, so member2 is their nemesis
      expect(classifyRivalry(h2h)).toBe('nemesis');
    });

    it('should classify as even for tied record', () => {
      const h2h: H2HRecord = {
        member1Wins: 5,
        member2Wins: 5,
        ties: 0,
        member1Points: 1400,
        member2Points: 1400,
        totalMatchups: 10,
      };

      expect(classifyRivalry(h2h)).toBe('even');
    });

    it('should classify as rival for close but not even', () => {
      const h2h: H2HRecord = {
        member1Wins: 6,
        member2Wins: 5,
        ties: 0,
        member1Points: 1400,
        member2Points: 1350,
        totalMatchups: 11,
      };

      // 54.5% win rate - close enough to be a "rival"
      expect(classifyRivalry(h2h)).toBe('rival');
    });

    it('should handle no matchups', () => {
      const h2h: H2HRecord = {
        member1Wins: 0,
        member2Wins: 0,
        ties: 0,
        member1Points: 0,
        member2Points: 0,
        totalMatchups: 0,
      };

      expect(classifyRivalry(h2h)).toBe('even');
    });
  });
});

describe('Streak Calculations', () => {
  let teamToMember: Map<string, string>;

  beforeEach(() => {
    teamToMember = createTeamToMemberMap();
  });

  describe('calculateCurrentStreak', () => {
    it('should calculate winning streak', () => {
      // Create matchups where Mike wins the last 3
      const matchups = [
        createMatchup({
          home_team_id: TEAM_IDS.MIKE_2024,
          away_team_id: TEAM_IDS.JOHN_2024,
          home_score: 150,
          away_score: 120,
          winner_team_id: TEAM_IDS.MIKE_2024,
        }),
        createMatchup({
          home_team_id: TEAM_IDS.JOHN_2024,
          away_team_id: TEAM_IDS.MIKE_2024,
          home_score: 100,
          away_score: 130,
          winner_team_id: TEAM_IDS.MIKE_2024,
        }),
        createMatchup({
          home_team_id: TEAM_IDS.MIKE_2024,
          away_team_id: TEAM_IDS.JOHN_2024,
          home_score: 140,
          away_score: 110,
          winner_team_id: TEAM_IDS.MIKE_2024,
        }),
      ];

      const streak = calculateCurrentStreak(matchups, teamToMember, MEMBER_IDS.MIKE);
      expect(streak).toBe(3); // 3-game winning streak
    });

    it('should calculate losing streak as negative', () => {
      const matchups = [
        createMatchup({
          home_team_id: TEAM_IDS.JOHN_2024,
          away_team_id: TEAM_IDS.MIKE_2024,
          home_score: 150,
          away_score: 120,
          winner_team_id: TEAM_IDS.JOHN_2024,
        }),
        createMatchup({
          home_team_id: TEAM_IDS.MIKE_2024,
          away_team_id: TEAM_IDS.JOHN_2024,
          home_score: 100,
          away_score: 130,
          winner_team_id: TEAM_IDS.JOHN_2024,
        }),
      ];

      const streak = calculateCurrentStreak(matchups, teamToMember, MEMBER_IDS.MIKE);
      expect(streak).toBe(-2); // 2-game losing streak
    });

    it('should handle empty matchups', () => {
      const streak = calculateCurrentStreak([], teamToMember, MEMBER_IDS.MIKE);
      expect(streak).toBe(0);
    });
  });
});

describe('Points Calculations', () => {
  let teamToMember: Map<string, string>;

  beforeEach(() => {
    teamToMember = createTeamToMemberMap();
  });

  describe('calculatePointsStats', () => {
    it('should calculate points stats from matchups', () => {
      const stats = calculatePointsStats(
        MIKE_VS_JOHN_MATCHUPS,
        teamToMember,
        MEMBER_IDS.MIKE
      );

      expect(stats.gamesPlayed).toBe(10);
      expect(stats.totalPoints).toBeGreaterThan(0);
      expect(stats.averagePoints).toBeGreaterThan(0);
      expect(stats.highScore).toBeGreaterThanOrEqual(stats.averagePoints);
      expect(stats.lowScore).toBeLessThanOrEqual(stats.averagePoints);
    });

    it('should handle member with no matchups', () => {
      const stats = calculatePointsStats([], teamToMember, MEMBER_IDS.MIKE);

      expect(stats.gamesPlayed).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.averagePoints).toBe(0);
    });
  });
});

describe('Achievement Calculations', () => {
  describe('calculateAchievements', () => {
    it('should calculate Mike achievements correctly', () => {
      const achievements = calculateAchievements(MIKE_TEAMS);

      // Mike has 3 championships in fixtures (2024, 2023, 2019)
      expect(achievements.championships).toBe(3);
      expect(achievements.playoffAppearances).toBeGreaterThanOrEqual(3);
      expect(achievements.lastPlaceFinishes).toBe(0);
    });

    it('should calculate David achievements correctly', () => {
      // David has 1 last place finish in fixtures (2024)
      const davidTeams = ALL_TEAMS.filter((t) => t.member_id === MEMBER_IDS.DAVID);
      const achievements = calculateAchievements(davidTeams);

      expect(achievements.lastPlaceFinishes).toBe(1);
      expect(achievements.championships).toBe(0);
    });

    it('should handle empty teams', () => {
      const achievements = calculateAchievements([]);

      expect(achievements.championships).toBe(0);
      expect(achievements.playoffAppearances).toBe(0);
      expect(achievements.lastPlaceFinishes).toBe(0);
    });
  });
});

describe('Margin & Blowout Analysis', () => {
  describe('calculateMargin', () => {
    it('should calculate positive margin for home win', () => {
      const margin = calculateMargin(MATCHUP_2024_W8_JOHN_DAVID);
      // John (home) 145.6 - David (away) 89.2 = 56.4
      expect(margin).toBeCloseTo(56.4, 1);
    });

    it('should calculate negative margin for away win', () => {
      const matchup = createMatchup({
        home_score: 100,
        away_score: 120,
      });
      expect(calculateMargin(matchup)).toBe(-20);
    });

    it('should return 0 for tie', () => {
      const matchup = createMatchup({
        home_score: 110,
        away_score: 110,
      });
      expect(calculateMargin(matchup)).toBe(0);
    });
  });

  describe('isBlowout', () => {
    it('should identify blowout (56.4 point margin)', () => {
      expect(isBlowout(MATCHUP_2024_W8_JOHN_DAVID)).toBe(true);
    });

    it('should not classify close game as blowout', () => {
      expect(isBlowout(MATCHUP_2024_W12_MIKE_JOHN)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const matchup = createMatchup({
        home_score: 130,
        away_score: 100,
      });
      expect(isBlowout(matchup, 30)).toBe(true);
      expect(isBlowout(matchup, 40)).toBe(false);
    });
  });

  describe('isCloseGame', () => {
    it('should identify close game (3.7 point margin)', () => {
      expect(isCloseGame(MATCHUP_2024_W12_MIKE_JOHN)).toBe(true);
    });

    it('should not classify blowout as close', () => {
      expect(isCloseGame(MATCHUP_2024_W8_JOHN_DAVID)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const matchup = createMatchup({
        home_score: 120,
        away_score: 115,
      });
      expect(isCloseGame(matchup, 5)).toBe(false);
      expect(isCloseGame(matchup, 10)).toBe(true);
    });
  });
});
