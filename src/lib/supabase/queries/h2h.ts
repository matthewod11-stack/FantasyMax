/**
 * Head-to-Head Query Functions
 * Agent B: Data Layer
 *
 * These functions query the mv_h2h_matrix materialized view and related matchup data.
 * Contract: Returns H2HMatrixRow and related types from src/types/contracts/queries.ts
 *
 * NOTE: The mv_h2h_matrix view is created by migration but not yet in
 * database.types.ts (auto-generated). Once migrations run and types are
 * regenerated, remove the type assertions.
 */

import { createAdminClient } from '../server';
import type {
  H2HMatrixRow,
  MatchupWithDetails,
  RivalryData,
} from '@/types/contracts/queries';
import type { Member } from '@/types/database.types';
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
 * Get the full H2H matrix for all member pairs
 *
 * @returns Array of H2H records between all member pairs
 *
 * @example
 * const matrix = await getH2HMatrix();
 * // Each row represents one rivalry (member_1_id < member_2_id)
 */
export async function getH2HMatrix(): Promise<H2HMatrixRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_h2h_matrix')
    .select('*')
    .order('total_matchups', { ascending: false });

  if (error) {
    console.error('[getH2HMatrix] Error fetching H2H matrix:', error);
    throw new Error(`Failed to fetch H2H matrix: ${error.message}`);
  }

  return data as H2HMatrixRow[];
}

/**
 * Get H2H record between two specific members
 *
 * The view stores pairs with member_1_id < member_2_id, so we need to
 * check both orderings and potentially swap the result.
 *
 * @param member1Id - UUID of first member
 * @param member2Id - UUID of second member
 * @returns H2H record from member1's perspective, or null if they haven't played
 */
export async function getH2HBetweenMembers(
  member1Id: string,
  member2Id: string
): Promise<H2HMatrixRow | null> {
  const supabase = await getUntypedClient();

  // Determine which is "lower" to match our view's ordering
  const [lowerId, higherId] =
    member1Id < member2Id ? [member1Id, member2Id] : [member2Id, member1Id];

  const { data, error } = await supabase
    .from('mv_h2h_matrix')
    .select('*')
    .eq('member_1_id', lowerId)
    .eq('member_2_id', higherId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No matchups between these members
    }
    console.error('[getH2HBetweenMembers] Error fetching H2H:', error);
    throw new Error(`Failed to fetch H2H between members: ${error.message}`);
  }

  // If member1 is the "higher" ID, swap the perspective
  if (member1Id > member2Id) {
    return {
      member_1_id: member1Id,
      member_2_id: member2Id,
      member_1_wins: data.member_2_wins,
      member_2_wins: data.member_1_wins,
      ties: data.ties,
      member_1_points: data.member_2_points,
      member_2_points: data.member_1_points,
      total_matchups: data.total_matchups,
      last_matchup_date: data.last_matchup_date,
      member_1_streak: -data.member_1_streak, // Invert streak perspective
    };
  }

  return data as H2HMatrixRow;
}

/**
 * Get all matchups between two members with full details
 *
 * @param member1Id - UUID of first member
 * @param member2Id - UUID of second member
 * @returns Array of matchups with team and season details
 */
export async function getH2HMatchups(
  member1Id: string,
  member2Id: string
): Promise<MatchupWithDetails[]> {
  const supabase = await createAdminClient();

  // Get all matchups where either member was home or away against the other
  const { data, error } = await supabase
    .from('matchups')
    .select(`
      *,
      home_team:teams!matchups_home_team_id_fkey(*, member:members(*)),
      away_team:teams!matchups_away_team_id_fkey(*, member:members(*)),
      season:seasons(*)
    `)
    .eq('status', 'final')
    .or(
      `and(home_team.member_id.eq.${member1Id},away_team.member_id.eq.${member2Id}),` +
      `and(home_team.member_id.eq.${member2Id},away_team.member_id.eq.${member1Id})`
    )
    .order('season(year)', { ascending: false })
    .order('week', { ascending: false });

  if (error) {
    console.error('[getH2HMatchups] Error fetching matchups:', error);
    throw new Error(`Failed to fetch H2H matchups: ${error.message}`);
  }

  // Transform to MatchupWithDetails shape
  return (data || []).map((row) => ({
    ...row,
    home_team: row.home_team,
    away_team: row.away_team,
    home_member: row.home_team?.member,
    away_member: row.away_team?.member,
    season: row.season,
  })) as MatchupWithDetails[];
}

/**
 * Get rivalry data for a specific member (nemesis, victim, etc.)
 *
 * @param memberId - UUID of the member
 * @returns Array of rivalry data sorted by total matchups
 */
export async function getMemberRivalries(memberId: string): Promise<RivalryData[]> {
  const supabase = await getUntypedClient();

  // Get all H2H records involving this member
  const { data: h2hData, error: h2hError } = await supabase
    .from('mv_h2h_matrix')
    .select('*')
    .or(`member_1_id.eq.${memberId},member_2_id.eq.${memberId}`)
    .order('total_matchups', { ascending: false });

  if (h2hError) {
    console.error('[getMemberRivalries] Error fetching H2H data:', h2hError);
    throw new Error(`Failed to fetch rivalries: ${h2hError.message}`);
  }

  if (!h2hData || h2hData.length === 0) {
    return [];
  }

  // Get opponent member details
  const opponentIds = h2hData.map((row: H2HMatrixRow) =>
    row.member_1_id === memberId ? row.member_2_id : row.member_1_id
  );

  const typedSupabase = await createAdminClient();
  const { data: members, error: membersError } = await typedSupabase
    .from('members')
    .select('*')
    .in('id', opponentIds);

  if (membersError) {
    console.error('[getMemberRivalries] Error fetching members:', membersError);
    throw new Error(`Failed to fetch member details: ${membersError.message}`);
  }

  const memberMap = new Map(members?.map((m) => [m.id, m]) || []);

  // Transform to RivalryData
  return h2hData.map((row: H2HMatrixRow) => {
    const isFirstMember = row.member_1_id === memberId;
    const opponentId = isFirstMember ? row.member_2_id : row.member_1_id;
    const wins = isFirstMember ? row.member_1_wins : row.member_2_wins;
    const losses = isFirstMember ? row.member_2_wins : row.member_1_wins;

    // Determine rivalry type
    let rivalryType: RivalryData['rivalry_type'];
    if (wins > losses + 2) {
      rivalryType = 'victim';
    } else if (losses > wins + 2) {
      rivalryType = 'nemesis';
    } else if (Math.abs(wins - losses) <= 1 && row.total_matchups >= 5) {
      rivalryType = 'rival';
    } else {
      rivalryType = 'even';
    }

    return {
      opponent: memberMap.get(opponentId) as Member,
      wins,
      losses,
      ties: row.ties,
      rivalry_type: rivalryType,
      total_matchups: row.total_matchups,
      last_matchup_date: row.last_matchup_date,
    };
  });
}

/**
 * Get a member's top nemesis (opponent they lose to most)
 *
 * @param memberId - UUID of the member
 * @returns RivalryData for their biggest nemesis, or null if none
 */
export async function getTopNemesis(memberId: string): Promise<RivalryData | null> {
  const rivalries = await getMemberRivalries(memberId);

  // Find opponent with worst record against (most losses, fewer wins)
  const nemesis = rivalries
    .filter((r) => r.losses > r.wins)
    .sort((a, b) => (b.losses - b.wins) - (a.losses - a.wins))[0];

  return nemesis || null;
}

/**
 * Get a member's top victim (opponent they beat most)
 *
 * @param memberId - UUID of the member
 * @returns RivalryData for their biggest victim, or null if none
 */
export async function getTopVictim(memberId: string): Promise<RivalryData | null> {
  const rivalries = await getMemberRivalries(memberId);

  // Find opponent with best record against (most wins, fewer losses)
  const victim = rivalries
    .filter((r) => r.wins > r.losses)
    .sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses))[0];

  return victim || null;
}

/**
 * Get biggest rivalries (most matchups with close records)
 *
 * @param limit - Maximum number of rivalries to return
 * @returns Array of H2H records for the closest, most-played rivalries
 */
export async function getBiggestRivalries(limit: number = 5): Promise<H2HMatrixRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('mv_h2h_matrix')
    .select('*')
    .gte('total_matchups', 5) // Must have played at least 5 times
    .order('total_matchups', { ascending: false })
    .limit(limit * 3); // Get more than needed to filter

  if (error) {
    console.error('[getBiggestRivalries] Error fetching rivalries:', error);
    throw new Error(`Failed to fetch biggest rivalries: ${error.message}`);
  }

  // Filter to close records (within 3 games) and take top N
  return ((data || []) as H2HMatrixRow[])
    .filter((row) => Math.abs(row.member_1_wins - row.member_2_wins) <= 3)
    .slice(0, limit);
}
