/**
 * League Records Query Functions
 * Agent B: Data Layer
 *
 * These functions query the v_league_records view and related data.
 * Contract: Returns LeagueRecordRow from src/types/contracts/queries.ts
 *
 * NOTE: The v_league_records view is created by migration but not yet in
 * database.types.ts (auto-generated). Once migrations run and types are
 * regenerated, remove the type assertions.
 */

import { createAdminClient } from '../server';
import type {
  LeagueRecordRow,
  RecordCategory,
  RecordType,
} from '@/types/contracts/queries';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to get a Supabase client that can query any table/view
 */
async function getUntypedClient(): Promise<SupabaseClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Get all league records
 *
 * @returns Array of all league records across all categories
 *
 * @example
 * const records = await getLeagueRecords();
 * // Returns records grouped by category
 */
export async function getLeagueRecords(): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*');

  if (error) {
    console.error('[getLeagueRecords] Error fetching records:', error);
    throw new Error(`Failed to fetch league records: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get records by category
 *
 * @param category - Record category to filter by
 * @returns Array of records in the specified category
 *
 * @example
 * const singleWeekRecords = await getRecordsByCategory('single_week');
 */
export async function getRecordsByCategory(
  category: RecordCategory
): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error('[getRecordsByCategory] Error fetching records:', error);
    throw new Error(`Failed to fetch records by category: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get records held by a specific member
 *
 * @param memberId - UUID of the member
 * @returns Array of records held by the member
 */
export async function getRecordsForMember(
  memberId: string
): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('holder_member_id', memberId);

  if (error) {
    console.error('[getRecordsForMember] Error fetching records:', error);
    throw new Error(`Failed to fetch records for member: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get a specific record by type
 *
 * @param recordType - The type of record to fetch
 * @returns The record, or null if not found
 */
export async function getRecordByType(
  recordType: RecordType
): Promise<LeagueRecordRow | null> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('record_type', recordType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No record found
    }
    console.error('[getRecordByType] Error fetching record:', error);
    throw new Error(`Failed to fetch record: ${error.message}`);
  }

  return data as LeagueRecordRow;
}

/**
 * Get records grouped by category
 *
 * @returns Object with records organized by category
 */
export async function getRecordsGroupedByCategory(): Promise<
  Record<RecordCategory, LeagueRecordRow[]>
> {
  const allRecords = await getLeagueRecords();

  const grouped: Record<RecordCategory, LeagueRecordRow[]> = {
    single_week: [],
    season: [],
    career: [],
    playoff: [],
    dubious: [],
  };

  for (const record of allRecords) {
    const category = record.category as RecordCategory;
    if (grouped[category]) {
      grouped[category].push(record);
    }
  }

  return grouped;
}

/**
 * Check if a value would break an existing record
 *
 * @param recordType - The type of record to check
 * @param value - The value to compare
 * @returns Object with isRecord boolean and the current record (if exists)
 */
export async function checkIfRecordBreaking(
  recordType: RecordType,
  value: number
): Promise<{ isRecord: boolean; currentRecord: LeagueRecordRow | null }> {
  const currentRecord = await getRecordByType(recordType);

  if (!currentRecord) {
    return { isRecord: true, currentRecord: null };
  }

  // Determine if higher or lower is better based on record type
  const higherIsBetter = ![
    'lowest_single_week_score',
    'closest_game_margin',
    'worst_season_record',
    'most_last_places',
  ].includes(recordType);

  const isRecord = higherIsBetter
    ? value > currentRecord.value
    : value < currentRecord.value;

  return { isRecord, currentRecord };
}

/**
 * Get "dubious" records (hall of shame type records)
 *
 * @returns Array of dubious/negative records
 */
export async function getDubiousRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('dubious');
}

/**
 * Get single week records (highest/lowest scores, margins)
 *
 * @returns Array of single week records
 */
export async function getSingleWeekRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('single_week');
}

/**
 * Get career records (total wins, championships, etc.)
 *
 * @returns Array of career records
 */
export async function getCareerRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('career');
}

/**
 * Get season records (best record, most points, etc.)
 *
 * @returns Array of season records
 */
export async function getSeasonRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('season');
}

// =====================================
// Top N Record Functions
// These query the raw tables to get multiple entries
// =====================================

/**
 * Top N entry for leaderboard display
 */
export interface TopNEntry {
  rank: number;
  member_id: string;
  display_name: string;
  value: number;
  season_year: number | null;
  week: number | null;
  matchup_id: string | null;
  context: string; // e.g., "Week 5, 2023" or "2022 Season"
}

/**
 * Options for top N queries
 */
export interface TopNOptions {
  limit?: number;
  activeOnly?: boolean;
}

/**
 * Get top N highest single week scores
 * @param options - Query options including limit and activeOnly filter
 */
export async function getTopHighestScores(options: number | TopNOptions = 10): Promise<TopNEntry[]> {
  // Support both old signature (limit: number) and new (options object)
  const { limit = 10, activeOnly = false } = typeof options === 'number'
    ? { limit: options }
    : options;

  const supabase = await createAdminClient();

  // Get all scores (both home and away) from matchups
  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      home_team:teams!matchups_home_team_id_fkey(member_id, member:members(display_name, is_active)),
      away_team:teams!matchups_away_team_id_fkey(member_id, member:members(display_name, is_active)),
      season:seasons(year)
    `)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (error) {
    console.error('[getTopHighestScores] Error:', error);
    return [];
  }

  // Flatten to individual scores
  const scores: { score: number; member_id: string; display_name: string; week: number; year: number; matchup_id: string }[] = [];

  for (const m of matchups || []) {
    if (m.home_score != null && m.home_team?.member_id && m.home_team?.member?.display_name) {
      // Skip inactive members if activeOnly is true
      if (activeOnly && !m.home_team.member.is_active) continue;
      scores.push({
        score: m.home_score,
        member_id: m.home_team.member_id,
        display_name: m.home_team.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
    if (m.away_score != null && m.away_team?.member_id && m.away_team?.member?.display_name) {
      // Skip inactive members if activeOnly is true
      if (activeOnly && !m.away_team.member.is_active) continue;
      scores.push({
        score: m.away_score,
        member_id: m.away_team.member_id,
        display_name: m.away_team.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
  }

  // Sort by score descending and take top N
  scores.sort((a, b) => b.score - a.score);
  const topN = scores.slice(0, limit);

  return topN.map((s, i) => ({
    rank: i + 1,
    member_id: s.member_id,
    display_name: s.display_name,
    value: s.score,
    season_year: s.year,
    week: s.week,
    matchup_id: s.matchup_id,
    context: `Week ${s.week}, ${s.year}`,
  }));
}

/**
 * Get top N lowest single week scores
 */
export async function getTopLowestScores(limit: number = 10): Promise<TopNEntry[]> {
  const supabase = await createAdminClient();

  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      home_team:teams!matchups_home_team_id_fkey(member_id, member:members(display_name)),
      away_team:teams!matchups_away_team_id_fkey(member_id, member:members(display_name)),
      season:seasons(year)
    `)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (error) {
    console.error('[getTopLowestScores] Error:', error);
    return [];
  }

  const scores: { score: number; member_id: string; display_name: string; week: number; year: number; matchup_id: string }[] = [];

  for (const m of matchups || []) {
    if (m.home_score != null && m.home_team?.member_id && m.home_team?.member?.display_name) {
      scores.push({
        score: m.home_score,
        member_id: m.home_team.member_id,
        display_name: m.home_team.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
    if (m.away_score != null && m.away_team?.member_id && m.away_team?.member?.display_name) {
      scores.push({
        score: m.away_score,
        member_id: m.away_team.member_id,
        display_name: m.away_team.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
  }

  // Sort by score ascending and take top N
  scores.sort((a, b) => a.score - b.score);
  const topN = scores.slice(0, limit);

  return topN.map((s, i) => ({
    rank: i + 1,
    member_id: s.member_id,
    display_name: s.display_name,
    value: s.score,
    season_year: s.year,
    week: s.week,
    matchup_id: s.matchup_id,
    context: `Week ${s.week}, ${s.year}`,
  }));
}

/**
 * Get top N biggest blowouts
 * @param options - Query options including limit and activeOnly filter
 */
export async function getTopBlowouts(options: number | TopNOptions = 10): Promise<TopNEntry[]> {
  const { limit = 10, activeOnly = false } = typeof options === 'number'
    ? { limit: options }
    : options;

  const supabase = await createAdminClient();

  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      winner_team_id,
      home_team_id,
      home_team:teams!matchups_home_team_id_fkey(member_id, member:members(display_name, is_active)),
      away_team:teams!matchups_away_team_id_fkey(member_id, member:members(display_name, is_active)),
      season:seasons(year)
    `)
    .eq('status', 'final')
    .eq('is_tie', false)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (error) {
    console.error('[getTopBlowouts] Error:', error);
    return [];
  }

  const blowouts: { margin: number; winner_id: string; winner_name: string; week: number; year: number; matchup_id: string }[] = [];

  for (const m of matchups || []) {
    if (m.home_score == null || m.away_score == null) continue;
    const margin = Math.abs(m.home_score - m.away_score);
    const isHomeWinner = m.winner_team_id === m.home_team_id;
    const winner = isHomeWinner ? m.home_team : m.away_team;

    if (winner?.member_id && winner?.member?.display_name) {
      // Skip inactive members if activeOnly is true
      if (activeOnly && !winner.member.is_active) continue;
      blowouts.push({
        margin,
        winner_id: winner.member_id,
        winner_name: winner.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
  }

  blowouts.sort((a, b) => b.margin - a.margin);
  const topN = blowouts.slice(0, limit);

  return topN.map((b, i) => ({
    rank: i + 1,
    member_id: b.winner_id,
    display_name: b.winner_name,
    value: b.margin,
    season_year: b.year,
    week: b.week,
    matchup_id: b.matchup_id,
    context: `Week ${b.week}, ${b.year}`,
  }));
}

/**
 * Get top N closest games
 * @param options - Query options including limit and activeOnly filter
 */
export async function getTopClosestGames(options: number | TopNOptions = 10): Promise<TopNEntry[]> {
  const { limit = 10, activeOnly = false } = typeof options === 'number'
    ? { limit: options }
    : options;

  const supabase = await createAdminClient();

  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      winner_team_id,
      home_team_id,
      home_team:teams!matchups_home_team_id_fkey(member_id, member:members(display_name, is_active)),
      away_team:teams!matchups_away_team_id_fkey(member_id, member:members(display_name, is_active)),
      season:seasons(year)
    `)
    .eq('status', 'final')
    .eq('is_tie', false)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (error) {
    console.error('[getTopClosestGames] Error:', error);
    return [];
  }

  const games: { margin: number; winner_id: string; winner_name: string; week: number; year: number; matchup_id: string }[] = [];

  for (const m of matchups || []) {
    if (m.home_score == null || m.away_score == null) continue;
    const margin = Math.abs(m.home_score - m.away_score);
    const isHomeWinner = m.winner_team_id === m.home_team_id;
    const winner = isHomeWinner ? m.home_team : m.away_team;

    if (winner?.member_id && winner?.member?.display_name) {
      // Skip inactive members if activeOnly is true
      if (activeOnly && !winner.member.is_active) continue;
      games.push({
        margin,
        winner_id: winner.member_id,
        winner_name: winner.member.display_name,
        week: m.week,
        year: m.season?.year ?? 0,
        matchup_id: m.id,
      });
    }
  }

  // Sort by margin ascending (smallest first)
  games.sort((a, b) => a.margin - b.margin);
  const topN = games.slice(0, limit);

  return topN.map((g, i) => ({
    rank: i + 1,
    member_id: g.winner_id,
    display_name: g.winner_name,
    value: g.margin,
    season_year: g.year,
    week: g.week,
    matchup_id: g.matchup_id,
    context: `Week ${g.week}, ${g.year}`,
  }));
}

/**
 * Get top N season performances by wins
 */
export async function getTopSeasonWins(limit: number = 10): Promise<TopNEntry[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      final_record_wins,
      member:members(id, display_name),
      season:seasons!teams_season_id_fkey(year)
    `)
    .not('final_record_wins', 'is', null)
    .order('final_record_wins', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getTopSeasonWins] Error:', error);
    return [];
  }

  return (data || []).map((t, i) => ({
    rank: i + 1,
    member_id: t.member?.id ?? '',
    display_name: t.member?.display_name ?? 'Unknown',
    value: t.final_record_wins ?? 0,
    season_year: t.season?.year ?? null,
    week: null,
    matchup_id: null,
    context: `${t.season?.year} Season`,
  }));
}

/**
 * Get top N season performances by points
 */
export async function getTopSeasonPoints(limit: number = 10): Promise<TopNEntry[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      total_points_for,
      member:members(id, display_name),
      season:seasons!teams_season_id_fkey(year)
    `)
    .not('total_points_for', 'is', null)
    .order('total_points_for', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getTopSeasonPoints] Error:', error);
    return [];
  }

  return (data || []).map((t, i) => ({
    rank: i + 1,
    member_id: t.member?.id ?? '',
    display_name: t.member?.display_name ?? 'Unknown',
    value: t.total_points_for ?? 0,
    season_year: t.season?.year ?? null,
    week: null,
    matchup_id: null,
    context: `${t.season?.year} Season`,
  }));
}

/**
 * Get top N for a specific record type
 * Routes to the appropriate function based on record type
 */
export async function getTopNForRecordType(
  recordType: RecordType,
  limit: number = 10
): Promise<TopNEntry[]> {
  switch (recordType) {
    case 'highest_single_week_score':
      return getTopHighestScores(limit);
    case 'lowest_single_week_score':
      return getTopLowestScores(limit);
    case 'biggest_blowout_margin':
      return getTopBlowouts(limit);
    case 'closest_game_margin':
      return getTopClosestGames(limit);
    case 'most_season_wins':
      return getTopSeasonWins(limit);
    case 'most_season_points':
      return getTopSeasonPoints(limit);
    default:
      // For record types without top N support, return empty array
      return [];
  }
}
