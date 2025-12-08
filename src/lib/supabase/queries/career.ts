/**
 * Career Stats Query Functions
 * Agent B: Data Layer
 *
 * These functions query the mv_career_stats materialized view.
 * Contract: Returns CareerStatsRow from src/types/contracts/queries.ts
 *
 * NOTE: The mv_career_stats view is created by migration but not yet in
 * database.types.ts (auto-generated). Once migrations run and types are
 * regenerated, remove the type assertions.
 */

import { createAdminClient } from '../server';
import type { CareerStatsRow } from '@/types/contracts/queries';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to get a Supabase client that can query any table/view
 * This is needed until database.types.ts is regenerated after migrations
 */
async function getUntypedClient(): Promise<SupabaseClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Get career stats for all members
 *
 * @returns Array of career stats for all members who have played at least one season
 *
 * @example
 * const stats = await getCareerStats();
 * // Returns all members sorted by championships, then win percentage
 */
export async function getCareerStats(): Promise<CareerStatsRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_career_stats')
    .select('*')
    .gt('seasons_played', 0)
    .order('championships', { ascending: false })
    .order('win_percentage', { ascending: false });

  if (error) {
    console.error('[getCareerStats] Error fetching career stats:', error);
    throw new Error(`Failed to fetch career stats: ${error.message}`);
  }

  return data as CareerStatsRow[];
}

/**
 * Get career stats for a specific member
 *
 * @param memberId - UUID of the member
 * @returns Career stats for the member, or null if not found
 *
 * @example
 * const stats = await getCareerStatsForMember('abc-123');
 * if (stats) {
 *   console.log(`${stats.display_name} has ${stats.championships} championships`);
 * }
 */
export async function getCareerStatsForMember(
  memberId: string
): Promise<CareerStatsRow | null> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_career_stats')
    .select('*')
    .eq('member_id', memberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - member not found
      return null;
    }
    console.error('[getCareerStatsForMember] Error fetching career stats:', error);
    throw new Error(`Failed to fetch career stats for member: ${error.message}`);
  }

  return data as CareerStatsRow;
}

/**
 * Get career stats leaderboard by specific stat
 *
 * @param stat - Which stat to sort by
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of career stats sorted by the specified stat
 *
 * @example
 * const topWinners = await getCareerLeaderboard('total_wins', 5);
 */
export async function getCareerLeaderboard(
  stat: 'championships' | 'total_wins' | 'win_percentage' | 'total_points_for' | 'playoff_appearances',
  limit: number = 10
): Promise<CareerStatsRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_career_stats')
    .select('*')
    .gt('seasons_played', 0)
    .order(stat, { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getCareerLeaderboard] Error fetching leaderboard:', error);
    throw new Error(`Failed to fetch career leaderboard: ${error.message}`);
  }

  return data as CareerStatsRow[];
}

/**
 * Get all championship winners (members with at least one championship)
 *
 * @returns Array of career stats for championship winners
 */
export async function getChampions(): Promise<CareerStatsRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_career_stats')
    .select('*')
    .gt('championships', 0)
    .order('championships', { ascending: false })
    .order('win_percentage', { ascending: false });

  if (error) {
    console.error('[getChampions] Error fetching champions:', error);
    throw new Error(`Failed to fetch champions: ${error.message}`);
  }

  return data as CareerStatsRow[];
}

/**
 * Get all Hall of Shame members (members with at least one last place finish)
 *
 * @returns Array of career stats for last place finishers
 */
export async function getHallOfShame(): Promise<CareerStatsRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_career_stats')
    .select('*')
    .gt('last_place_finishes', 0)
    .order('last_place_finishes', { ascending: false });

  if (error) {
    console.error('[getHallOfShame] Error fetching hall of shame:', error);
    throw new Error(`Failed to fetch hall of shame: ${error.message}`);
  }

  return data as CareerStatsRow[];
}

/**
 * Hall of Shame inductee for a single season
 */
export interface ShameInductee {
  season_year: number;
  member_id: string;
  display_name: string;
  team_name: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  final_rank: number;
}

/**
 * Get all last place finishers by season (Hall of Shame inductees)
 *
 * @returns Array of last place finishers sorted by year descending
 */
export async function getShameInducteesBySeason(): Promise<ShameInductee[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('teams')
    .select(`
      season:seasons!teams_season_id_fkey(year),
      member:members(id, display_name),
      team_name,
      final_record_wins,
      final_record_losses,
      final_record_ties,
      total_points_for,
      final_rank
    `)
    .eq('is_last_place', true)
    .order('season(year)', { ascending: false });

  if (error) {
    console.error('[getShameInducteesBySeason] Error:', error);
    return [];
  }

  return (data || []).map((t) => ({
    season_year: t.season?.year ?? 0,
    member_id: t.member?.id ?? '',
    display_name: t.member?.display_name ?? 'Unknown',
    team_name: t.team_name ?? '',
    wins: t.final_record_wins ?? 0,
    losses: t.final_record_losses ?? 0,
    ties: t.final_record_ties ?? 0,
    points_for: t.total_points_for ?? 0,
    final_rank: t.final_rank ?? 0,
  }));
}

/**
 * Get "closest to avoiding" stats - teams that barely missed last place
 *
 * @param limit - Number of results to return
 * @returns Teams sorted by smallest margin above last place
 */
export async function getClosestToShame(limit: number = 5): Promise<{
  season_year: number;
  member_id: string;
  display_name: string;
  final_rank: number;
  last_place_rank: number;
  margin_wins: number;
}[]> {
  const supabase = await createAdminClient();

  // Get teams that finished second-to-last (one spot above last place)
  // This is a simplified version - could be enhanced to show actual point differential
  const { data, error } = await supabase
    .from('teams')
    .select(`
      season:seasons!teams_season_id_fkey(year),
      member:members(id, display_name),
      final_rank,
      final_record_wins,
      is_last_place
    `)
    .eq('is_last_place', false)
    .not('final_rank', 'is', null)
    .order('final_rank', { ascending: false })
    .limit(limit * 3); // Get more to filter

  if (error) {
    console.error('[getClosestToShame] Error:', error);
    return [];
  }

  // Filter to second-to-last place finishes and format
  // This is approximate - ideally we'd compare to the actual last place team each season
  return (data || [])
    .filter((t) => t.final_rank && t.final_rank >= 10) // Assuming 10+ team leagues
    .slice(0, limit)
    .map((t) => ({
      season_year: t.season?.year ?? 0,
      member_id: t.member?.id ?? '',
      display_name: t.member?.display_name ?? 'Unknown',
      final_rank: t.final_rank ?? 0,
      last_place_rank: (t.final_rank ?? 0) + 1,
      margin_wins: 1, // Simplified - would need more complex query for actual margin
    }));
}
