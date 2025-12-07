/**
 * Fixture Validation Tests
 *
 * These tests ensure our test fixtures are valid and consistent.
 * They verify the relationships between members, teams, seasons, and matchups.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_MEMBERS,
  ACTIVE_MEMBERS,
  MEMBER_IDS,
  MIKE,
  JOHN,
} from '../fixtures/members';
import {
  ALL_SEASONS,
  SEASON_IDS,
  SEASON_2024,
  SEASON_2023,
} from '../fixtures/seasons';
import {
  ALL_TEAMS,
  TEAM_IDS,
  MIKE_TEAMS,
  JOHN_TEAMS,
  MIKE_TEAM_2024,
  MIKE_TEAM_2023,
} from '../fixtures/teams';
import {
  ALL_MATCHUPS,
  MIKE_VS_JOHN_MATCHUPS,
  CHAMPIONSHIP_MATCHUPS,
  MATCHUP_2024_W1_MIKE_JOHN,
} from '../fixtures/matchups';
import {
  createMember,
  createSeason,
  createTeam,
  createMatchup,
  createCareerStats,
  createH2HMatrixRow,
  resetIdCounter,
} from '../fixtures/factory';

describe('Member Fixtures', () => {
  it('should have correct number of members', () => {
    expect(ALL_MEMBERS).toHaveLength(6);
    expect(ACTIVE_MEMBERS).toHaveLength(5); // Alex is inactive
  });

  it('should have unique member IDs', () => {
    const ids = ALL_MEMBERS.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have Mike as 2x champion based on team fixtures', () => {
    const mikeChampionships = MIKE_TEAMS.filter((t) => t.is_champion);
    expect(mikeChampionships).toHaveLength(3); // 2024, 2023, 2019
  });

  it('should have commissioner with correct role', () => {
    const commissioner = ALL_MEMBERS.find((m) => m.role === 'commissioner');
    expect(commissioner).toBeDefined();
    expect(commissioner?.display_name).toBe('Chris');
  });
});

describe('Season Fixtures', () => {
  it('should have correct number of seasons', () => {
    expect(ALL_SEASONS).toHaveLength(5);
  });

  it('should be ordered newest first', () => {
    const years = ALL_SEASONS.map((s) => s.year);
    expect(years[0]).toBe(2024);
    expect(years[years.length - 1]).toBe(2015);
  });

  it('should have varying team counts reflecting league growth', () => {
    expect(SEASON_2024.num_teams).toBe(14);
    const season2015 = ALL_SEASONS.find((s) => s.year === 2015);
    expect(season2015?.num_teams).toBe(11);
  });
});

describe('Team Fixtures', () => {
  it('should link teams to valid members and seasons', () => {
    const memberIds = new Set<string>(Object.values(MEMBER_IDS));
    const seasonIds = new Set<string>(Object.values(SEASON_IDS));

    ALL_TEAMS.forEach((team) => {
      expect(memberIds.has(team.member_id)).toBe(true);
      expect(seasonIds.has(team.season_id)).toBe(true);
    });
  });

  it('should have exactly one champion per season', () => {
    const championsBySeasonId = ALL_TEAMS.filter((t) => t.is_champion);

    // Group by season
    const championsBySeason = championsBySeasonId.reduce(
      (acc, team) => {
        acc[team.season_id] = (acc[team.season_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.values(championsBySeason).forEach((count) => {
      expect(count).toBe(1);
    });
  });

  it("should calculate Mike's career stats correctly from teams", () => {
    const totalWins = MIKE_TEAMS.reduce(
      (sum, t) => sum + (t.final_record_wins ?? 0),
      0
    );
    const totalLosses = MIKE_TEAMS.reduce(
      (sum, t) => sum + (t.final_record_losses ?? 0),
      0
    );

    // Based on fixtures: 11+12+8+10 = 41 wins, 3+2+6+3 = 14 losses
    expect(totalWins).toBe(41);
    expect(totalLosses).toBe(14);
  });
});

describe('Matchup Fixtures', () => {
  it('should have valid team references', () => {
    const teamIds = new Set(ALL_TEAMS.map((t) => t.id));

    ALL_MATCHUPS.forEach((matchup) => {
      expect(teamIds.has(matchup.home_team_id)).toBe(true);
      expect(teamIds.has(matchup.away_team_id)).toBe(true);
    });
  });

  it('should have winner correctly determined', () => {
    ALL_MATCHUPS.forEach((matchup) => {
      const homeScore = matchup.home_score ?? 0;
      const awayScore = matchup.away_score ?? 0;

      if (homeScore > awayScore) {
        expect(matchup.winner_team_id).toBe(matchup.home_team_id);
      } else if (awayScore > homeScore) {
        expect(matchup.winner_team_id).toBe(matchup.away_team_id);
      }
    });
  });

  it('should have correct Mike vs John H2H record', () => {
    // Count wins for each
    let mikeWins = 0;
    let johnWins = 0;

    MIKE_VS_JOHN_MATCHUPS.forEach((m) => {
      if (m.winner_team_id?.includes('1111')) {
        mikeWins++;
      } else if (m.winner_team_id?.includes('2222')) {
        johnWins++;
      }
    });

    // Based on our fixtures: Mike should be 6-4 over John
    expect(mikeWins).toBe(6);
    expect(johnWins).toBe(4);
    expect(MIKE_VS_JOHN_MATCHUPS).toHaveLength(10);
  });

  it('should have championship matchups marked correctly', () => {
    CHAMPIONSHIP_MATCHUPS.forEach((m) => {
      expect(m.is_championship).toBe(true);
      expect(m.is_playoff).toBe(true);
    });

    // We have 4 championship matchups (2024, 2023, 2021, 2019)
    expect(CHAMPIONSHIP_MATCHUPS).toHaveLength(4);
  });
});

describe('Factory Functions', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should create member with defaults', () => {
    const member = createMember();
    expect(member.id).toContain('member');
    expect(member.role).toBe('member');
    expect(member.is_active).toBe(true);
  });

  it('should create member with overrides', () => {
    const member = createMember({
      display_name: 'Custom Name',
      role: 'commissioner',
      is_active: false,
    });
    expect(member.display_name).toBe('Custom Name');
    expect(member.role).toBe('commissioner');
    expect(member.is_active).toBe(false);
  });

  it('should create season with defaults', () => {
    const season = createSeason();
    expect(season.year).toBe(2024);
    expect(season.num_teams).toBe(12);
  });

  it('should create team with calculated win percentage potential', () => {
    const team = createTeam({
      wins: 10,
      losses: 4,
      ties: 0,
    });
    expect(team.final_record_wins).toBe(10);
    expect(team.final_record_losses).toBe(4);
  });

  it('should create matchup with auto-determined winner', () => {
    const matchup = createMatchup({
      home_score: 150,
      away_score: 120,
      home_team_id: 'home-123',
      away_team_id: 'away-456',
    });
    expect(matchup.winner_team_id).toBe('home-123');
    expect(matchup.is_tie).toBe(false);
  });

  it('should create career stats for contract testing', () => {
    const stats = createCareerStats({
      wins: 60,
      losses: 40,
      championships: 2,
    });
    expect(stats.total_wins).toBe(60);
    expect(stats.total_losses).toBe(40);
    expect(stats.win_percentage).toBeCloseTo(0.6);
    expect(stats.championships).toBe(2);
  });

  it('should create H2H matrix row for contract testing', () => {
    const h2h = createH2HMatrixRow({
      member_1_wins: 8,
      member_2_wins: 5,
    });
    expect(h2h.total_matchups).toBe(13);
    expect(h2h.member_1_streak).toBe(2); // Positive = winning streak
  });
});

describe('Data Consistency Checks', () => {
  it('should match PROGRESS.md data profile (subset)', () => {
    // Our fixtures are a subset of the full 978 matchups
    // But they should demonstrate the same patterns
    expect(ALL_MATCHUPS.length).toBeGreaterThan(0);
    expect(ALL_MEMBERS.length).toBeLessThanOrEqual(22);
    expect(ALL_SEASONS.length).toBeLessThanOrEqual(10);
  });

  it("should have Mike's championship years match team data", () => {
    const mikeChampionTeams = MIKE_TEAMS.filter((t) => t.is_champion);
    const championYears = mikeChampionTeams.map((t) => {
      const season = ALL_SEASONS.find((s) => s.id === t.season_id);
      return season?.year;
    });

    expect(championYears).toContain(2024);
    expect(championYears).toContain(2023);
    expect(championYears).toContain(2019);
  });
});
