/**
 * Query Contracts
 *
 * These interfaces define the return types for database queries and views.
 * ALL AGENTS must use these exact interfaces - changes require coordination.
 *
 * Agent B (Data Layer) IMPLEMENTS these query functions
 * Agent C (Features) CONSUMES these queries
 */

import type { Member, Team, Season, Matchup } from '../database.types';

// =====================================
// Materialized View Types
// =====================================

/**
 * Career stats for a member across all seasons
 * Agent B: Create as materialized view `mv_career_stats`
 */
export interface CareerStatsRow {
  member_id: string;
  display_name: string;
  total_wins: number;
  total_losses: number;
  total_ties: number;
  win_percentage: number;
  total_points_for: number;
  total_points_against: number;
  seasons_played: number;
  championships: number;
  playoff_appearances: number;
  last_place_finishes: number;
  best_season_year: number | null;
  worst_season_year: number | null;
  first_season_year: number;
  last_season_year: number;
}

/**
 * H2H matrix cell data
 * Agent B: Create as materialized view `mv_h2h_matrix`
 */
export interface H2HMatrixRow {
  member_1_id: string;
  member_2_id: string;
  member_1_wins: number;
  member_2_wins: number;
  ties: number;
  member_1_points: number;
  member_2_points: number;
  total_matchups: number;
  last_matchup_date: string | null;
  member_1_streak: number; // positive = winning streak, negative = losing
}

/**
 * Season standings with rankings
 * Agent B: Create as view `v_season_standings`
 */
export interface SeasonStandingsRow {
  season_id: string;
  season_year: number;
  team_id: string;
  member_id: string;
  display_name: string;
  team_name: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  final_rank: number;
  is_champion: boolean;
  is_last_place: boolean;
  made_playoffs: boolean;
}

/**
 * League-wide records (all-time bests/worsts)
 * Agent B: Create as view `v_league_records`
 */
export interface LeagueRecordRow {
  record_type: RecordType;
  category: RecordCategory;
  value: number;
  holder_member_id: string;
  holder_display_name: string;
  season_year: number | null;
  week: number | null;
  matchup_id: string | null;
  description: string;
}

export type RecordType =
  | 'highest_single_week_score'
  | 'lowest_single_week_score'
  | 'biggest_blowout_margin'
  | 'closest_game_margin'
  | 'most_season_wins'
  | 'most_season_points'
  | 'best_season_record'
  | 'worst_season_record'
  | 'career_wins'
  | 'career_points'
  | 'longest_win_streak'
  | 'most_championships'
  | 'most_last_places';

export type RecordCategory = 'single_week' | 'season' | 'career' | 'playoff' | 'dubious';

// =====================================
// Query Function Signatures
// =====================================

/**
 * Query functions that Agent B must implement.
 * These will be in src/lib/supabase/queries/
 */

export interface QueryFunctions {
  // Career stats
  getCareerStats(): Promise<CareerStatsRow[]>;
  getCareerStatsForMember(memberId: string): Promise<CareerStatsRow | null>;

  // H2H data
  getH2HMatrix(): Promise<H2HMatrixRow[]>;
  getH2HBetweenMembers(member1Id: string, member2Id: string): Promise<H2HMatrixRow | null>;
  getH2HMatchups(member1Id: string, member2Id: string): Promise<MatchupWithDetails[]>;

  // Season data
  getSeasonStandings(seasonId: string): Promise<SeasonStandingsRow[]>;
  getAllSeasonStandings(): Promise<SeasonStandingsRow[]>;

  // Records
  getLeagueRecords(): Promise<LeagueRecordRow[]>;
  getRecordsByCategory(category: RecordCategory): Promise<LeagueRecordRow[]>;
  getRecordsForMember(memberId: string): Promise<LeagueRecordRow[]>;

  // Dashboard specific
  getMemberRivalries(memberId: string): Promise<RivalryData[]>;
  getUpcomingMatchup(memberId: string): Promise<UpcomingMatchup | null>;
  getThisWeekInHistory(memberId: string, week: number): Promise<HistoricalEvent[]>;
}

// =====================================
// Composite Query Types
// =====================================

export interface MatchupWithDetails extends Matchup {
  home_team: Team;
  away_team: Team;
  home_member: Member;
  away_member: Member;
  season: Season;
}

export interface RivalryData {
  opponent: Member;
  wins: number;
  losses: number;
  ties: number;
  rivalry_type: 'nemesis' | 'victim' | 'rival' | 'even';
  total_matchups: number;
  last_matchup_date: string | null;
}

export interface UpcomingMatchup {
  opponent: Member;
  h2h_record: [number, number]; // [your wins, their wins]
  last_three_results: ('W' | 'L' | 'T')[];
  rivalry_type: 'nemesis' | 'victim' | 'rival' | 'even' | 'first_meeting';
}

export interface HistoricalEvent {
  event_type: 'high_score' | 'low_score' | 'championship' | 'playoff' | 'blowout' | 'upset';
  description: string;
  season_year: number;
  week: number;
  value?: number;
  matchup_id?: string;
}

// =====================================
// Dashboard Widget Data
// =====================================

export interface DashboardData {
  member: Member;
  careerStats: CareerStatsRow;
  topNemesis: RivalryData | null;
  topVictim: RivalryData | null;
  upcomingMatchup: UpcomingMatchup | null;
  thisWeekInHistory: HistoricalEvent[];
  championships: {
    years: number[];
    total: number;
  };
  recordsHeld: LeagueRecordRow[];
}

// =====================================
// Writeup Types (Sprint 2.4)
// =====================================

/**
 * Writeup type enum matching database enum
 */
export type WriteupType =
  | 'weekly_recap'
  | 'playoff_preview'
  | 'season_recap'
  | 'draft_notes'
  | 'standings_update'
  | 'power_rankings'
  | 'announcement'
  | 'other';

/**
 * Writeup status for publishing workflow
 */
export type WriteupStatus = 'draft' | 'published' | 'archived';

/**
 * Base writeup from database
 */
export interface Writeup {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  season_id: string | null;
  week: number | null;
  writeup_type: WriteupType;
  author_id: string;
  status: WriteupStatus;
  published_at: string | null;
  is_featured: boolean;
  imported_from: string | null;
  original_order: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Writeup with joined data for display
 */
export interface WriteupWithDetails extends Writeup {
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  season: {
    id: string;
    year: number;
  } | null;
}

/**
 * Writeups grouped by season for archive view
 */
export interface WriteupsBySeason {
  season_year: number;
  season_id: string;
  writeups: WriteupWithDetails[];
}

/**
 * Search result from full-text search
 */
export interface WriteupSearchResult {
  id: string;
  title: string;
  excerpt: string | null;
  season_year: number | null;
  writeup_type: WriteupType;
  published_at: string | null;
  rank: number;
}

/**
 * Member mention in a writeup
 */
export interface WriteupMention {
  id: string;
  writeup_id: string;
  member_id: string;
  mention_context: string | null;
  created_at: string;
}

/**
 * Query functions for writeups
 */
export interface WriteupQueryFunctions {
  // Fetch writeups
  getAllWriteups(): Promise<WriteupWithDetails[]>;
  getWriteupById(id: string): Promise<WriteupWithDetails | null>;
  getWriteupsBySeason(seasonId: string): Promise<WriteupWithDetails[]>;
  getWriteupsByYear(year: number): Promise<WriteupWithDetails[]>;
  getWriteupsGroupedBySeason(): Promise<WriteupsBySeason[]>;
  getFeaturedWriteups(limit?: number): Promise<WriteupWithDetails[]>;

  // Search
  searchWriteups(query: string): Promise<WriteupSearchResult[]>;

  // Member-specific
  getWriteupsMentioningMember(memberId: string): Promise<WriteupWithDetails[]>;
  getWriteupsByAuthor(authorId: string): Promise<WriteupWithDetails[]>;
}
