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
