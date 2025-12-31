/**
 * Test Data Factory
 *
 * Factory functions for creating test data with sensible defaults.
 * Use these when you need custom fixtures beyond the sample data.
 */

import type {
  Member,
  Season,
  Team,
  Matchup,
} from '@/types/database.types';
import {
  CareerStatsRow,
  H2HMatrixRow,
  SeasonStandingsRow,
} from '@/types/contracts/queries';

// =====================================
// ID Generators
// =====================================

let idCounter = 0;

/**
 * Generate a unique UUID-like string for testing
 */
export function generateTestId(prefix = 'test'): string {
  idCounter++;
  return `${prefix}-${String(idCounter).padStart(8, '0')}-test-id`;
}

/**
 * Reset the ID counter (useful between test suites)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

// =====================================
// Member Factory
// =====================================

export interface CreateMemberOptions {
  id?: string;
  display_name?: string;
  email?: string;
  role?: 'commissioner' | 'president' | 'treasurer' | 'member';
  is_active?: boolean;
  joined_year?: number;
}

export function createMember(options: CreateMemberOptions = {}): Member {
  const id = options.id ?? generateTestId('member');
  return {
    id,
    display_name: options.display_name ?? `Member ${id.slice(-4)}`,
    email: options.email ?? `member-${id.slice(-4)}@test.com`,
    avatar_url: null,
    role: options.role ?? 'member',
    is_active: options.is_active ?? true,
    joined_year: options.joined_year ?? 2020,
    user_id: null,
    yahoo_manager_id: null,
    invite_token: null,
    invite_sent_at: null,
    merged_into_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =====================================
// Season Factory
// =====================================

export interface CreateSeasonOptions {
  id?: string;
  league_id?: string;
  year?: number;
  num_teams?: number;
  num_weeks?: number;
}

export function createSeason(options: CreateSeasonOptions = {}): Season {
  const id = options.id ?? generateTestId('season');
  const year = options.year ?? 2024;
  return {
    id,
    league_id: options.league_id ?? 'test-league-id',
    year,
    name: `Season ${year}`,
    num_teams: options.num_teams ?? 12,
    num_weeks: options.num_weeks ?? 14,
    playoff_weeks: 3,
    champion_team_id: null,
    last_place_team_id: null,
    yahoo_league_key: null,
    data_source: 'test',
    import_status: 'complete',
    last_sync_at: null,
    recap_title: null,
    recap_content: null,
    recap_published_at: null,
    ai_review: null,
    ai_review_generated_at: null,
    ai_review_model: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =====================================
// Team Factory
// =====================================

export interface CreateTeamOptions {
  id?: string;
  season_id?: string;
  member_id?: string;
  team_name?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  points_for?: number;
  points_against?: number;
  final_rank?: number;
  is_champion?: boolean;
  is_last_place?: boolean;
  made_playoffs?: boolean;
}

export function createTeam(options: CreateTeamOptions = {}): Team {
  const id = options.id ?? generateTestId('team');
  return {
    id,
    season_id: options.season_id ?? 'test-season-id',
    member_id: options.member_id ?? 'test-member-id',
    team_name: options.team_name ?? `Team ${id.slice(-4)}`,
    final_rank: options.final_rank ?? 1,
    final_record_wins: options.wins ?? 7,
    final_record_losses: options.losses ?? 7,
    final_record_ties: options.ties ?? 0,
    total_points_for: options.points_for ?? 1500,
    total_points_against: options.points_against ?? 1450,
    is_champion: options.is_champion ?? false,
    is_last_place: options.is_last_place ?? false,
    made_playoffs: options.made_playoffs ?? false,
    is_regular_season_champ: false,
    is_highest_scorer: false,
    playoff_seed: null,
    logo_url: null,
    yahoo_team_id: null,
    yahoo_team_key: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =====================================
// Matchup Factory
// =====================================

export interface CreateMatchupOptions {
  id?: string;
  season_id?: string;
  week?: number;
  home_team_id?: string;
  away_team_id?: string;
  home_score?: number;
  away_score?: number;
  winner_team_id?: string;
  is_playoff?: boolean;
  is_championship?: boolean;
}

export function createMatchup(options: CreateMatchupOptions = {}): Matchup {
  const id = options.id ?? generateTestId('matchup');
  const homeScore = options.home_score ?? 120;
  const awayScore = options.away_score ?? 110;
  const homeTeamId = options.home_team_id ?? 'home-team-id';
  const awayTeamId = options.away_team_id ?? 'away-team-id';

  return {
    id,
    season_id: options.season_id ?? 'test-season-id',
    week: options.week ?? 1,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: homeScore,
    away_score: awayScore,
    winner_team_id:
      options.winner_team_id ??
      (homeScore > awayScore
        ? homeTeamId
        : homeScore < awayScore
          ? awayTeamId
          : null),
    is_tie: homeScore === awayScore,
    is_playoff: options.is_playoff ?? false,
    is_championship: options.is_championship ?? false,
    is_consolation: false,
    status: 'complete',
    yahoo_matchup_key: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =====================================
// Contract Type Factories
// =====================================

export interface CreateCareerStatsOptions {
  member_id?: string;
  display_name?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  points_for?: number;
  points_against?: number;
  seasons_played?: number;
  championships?: number;
}

export function createCareerStats(
  options: CreateCareerStatsOptions = {}
): CareerStatsRow {
  const wins = options.wins ?? 50;
  const losses = options.losses ?? 50;
  const ties = options.ties ?? 0;
  const totalGames = wins + losses + ties;

  return {
    member_id: options.member_id ?? generateTestId('member'),
    display_name: options.display_name ?? 'Test Member',
    total_wins: wins,
    total_losses: losses,
    total_ties: ties,
    win_percentage: totalGames > 0 ? wins / totalGames : 0,
    total_points_for: options.points_for ?? 10000,
    total_points_against: options.points_against ?? 9500,
    seasons_played: options.seasons_played ?? 5,
    championships: options.championships ?? 0,
    playoff_appearances: 3,
    last_place_finishes: 0,
    best_season_year: 2023,
    worst_season_year: 2020,
    first_season_year: 2020,
    last_season_year: 2024,
  };
}

export interface CreateH2HMatrixRowOptions {
  member_1_id?: string;
  member_2_id?: string;
  member_1_wins?: number;
  member_2_wins?: number;
  ties?: number;
}

export function createH2HMatrixRow(
  options: CreateH2HMatrixRowOptions = {}
): H2HMatrixRow {
  const m1Wins = options.member_1_wins ?? 5;
  const m2Wins = options.member_2_wins ?? 3;
  const ties = options.ties ?? 0;

  return {
    member_1_id: options.member_1_id ?? generateTestId('member'),
    member_2_id: options.member_2_id ?? generateTestId('member'),
    member_1_wins: m1Wins,
    member_2_wins: m2Wins,
    ties,
    member_1_points: 1200,
    member_2_points: 1150,
    total_matchups: m1Wins + m2Wins + ties,
    last_matchup_date: '2024-12-01',
    member_1_streak: m1Wins > m2Wins ? 2 : -1,
  };
}

export function createSeasonStandingsRow(
  options: Partial<SeasonStandingsRow> = {}
): SeasonStandingsRow {
  return {
    season_id: options.season_id ?? generateTestId('season'),
    season_year: options.season_year ?? 2024,
    team_id: options.team_id ?? generateTestId('team'),
    member_id: options.member_id ?? generateTestId('member'),
    display_name: options.display_name ?? 'Test Member',
    team_name: options.team_name ?? 'Test Team',
    wins: options.wins ?? 7,
    losses: options.losses ?? 7,
    ties: options.ties ?? 0,
    points_for: options.points_for ?? 1500,
    points_against: options.points_against ?? 1450,
    final_rank: options.final_rank ?? 6,
    is_champion: options.is_champion ?? false,
    is_last_place: options.is_last_place ?? false,
    made_playoffs: options.made_playoffs ?? false,
  };
}

// =====================================
// Batch Generators
// =====================================

/**
 * Generate a complete season worth of matchups for round-robin
 */
export function generateSeasonMatchups(
  seasonId: string,
  teamIds: string[],
  weeks: number = 14
): Matchup[] {
  const matchups: Matchup[] = [];

  for (let week = 1; week <= weeks; week++) {
    // Simple pairing: team[0] vs team[1], team[2] vs team[3], etc
    for (let i = 0; i < teamIds.length - 1; i += 2) {
      const homeTeamId = teamIds[i];
      const awayTeamId = teamIds[i + 1];
      if (!homeTeamId || !awayTeamId) continue;

      matchups.push(
        createMatchup({
          season_id: seasonId,
          week,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          home_score: 100 + Math.floor(Math.random() * 80),
          away_score: 100 + Math.floor(Math.random() * 80),
        })
      );
    }
  }

  return matchups;
}
