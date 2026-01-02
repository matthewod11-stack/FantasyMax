/**
 * H2H Recaps Query Functions
 *
 * These functions query the h2h_recaps table for AI-generated rivalry recaps.
 * Contract: Returns H2HRecap and related types from src/types/contracts/queries.ts
 */

import { createAdminClient } from '../server';
import type { H2HRecap, H2HRecapWithRivalry } from '@/types/contracts/queries';
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
 * Get AI recap for a specific member pair
 *
 * The table stores pairs with member_1_id < member_2_id, so we normalize
 * the order before querying.
 *
 * @param member1Id - UUID of first member
 * @param member2Id - UUID of second member
 * @returns H2H recap or null if not generated yet
 */
export async function getH2HRecap(
  member1Id: string,
  member2Id: string
): Promise<H2HRecap | null> {
  const supabase = await getUntypedClient();

  // Normalize to match table ordering (member_1_id < member_2_id)
  const [lowerId, higherId] =
    member1Id < member2Id ? [member1Id, member2Id] : [member2Id, member1Id];

  const { data, error } = await supabase
    .from('h2h_recaps')
    .select('*')
    .eq('member_1_id', lowerId)
    .eq('member_2_id', higherId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No recap generated yet
    }
    console.error('[getH2HRecap] Error fetching recap:', error);
    throw new Error(`Failed to fetch H2H recap: ${error.message}`);
  }

  return data as H2HRecap;
}

/**
 * Get all AI recaps for a member's rivalries
 *
 * Returns recaps joined with H2H stats and opponent details.
 * Used for the Rivalries tab display.
 *
 * @param memberId - UUID of the member
 * @returns Array of recaps with rivalry data, sorted by total matchups
 */
export async function getH2HRecapsForMember(
  memberId: string
): Promise<H2HRecapWithRivalry[]> {
  const supabase = await getUntypedClient();
  const typedSupabase = await createAdminClient();

  // Get all recaps involving this member
  const { data: recaps, error: recapsError } = await supabase
    .from('h2h_recaps')
    .select('*')
    .or(`member_1_id.eq.${memberId},member_2_id.eq.${memberId}`);

  if (recapsError) {
    console.error('[getH2HRecapsForMember] Error fetching recaps:', recapsError);
    throw new Error(`Failed to fetch H2H recaps: ${recapsError.message}`);
  }

  if (!recaps || recaps.length === 0) {
    return [];
  }

  // Get H2H stats from materialized view
  const { data: h2hData, error: h2hError } = await supabase
    .from('mv_h2h_matrix')
    .select('*')
    .or(`member_1_id.eq.${memberId},member_2_id.eq.${memberId}`)
    .order('total_matchups', { ascending: false });

  if (h2hError) {
    console.error('[getH2HRecapsForMember] Error fetching H2H data:', h2hError);
    throw new Error(`Failed to fetch H2H data: ${h2hError.message}`);
  }

  // Get opponent member details
  const opponentIds = new Set<string>();
  recaps.forEach((recap: H2HRecap) => {
    if (recap.member_1_id === memberId) {
      opponentIds.add(recap.member_2_id);
    } else {
      opponentIds.add(recap.member_1_id);
    }
  });

  const { data: members, error: membersError } = await typedSupabase
    .from('members')
    .select('*')
    .in('id', Array.from(opponentIds));

  if (membersError) {
    console.error('[getH2HRecapsForMember] Error fetching members:', membersError);
    throw new Error(`Failed to fetch member details: ${membersError.message}`);
  }

  const memberMap = new Map(members?.map((m) => [m.id, m]) || []);

  // Create lookup maps
  const recapMap = new Map<string, H2HRecap>();
  recaps.forEach((recap: H2HRecap) => {
    // Key is always lowerId-higherId for consistency
    const key = `${recap.member_1_id}-${recap.member_2_id}`;
    recapMap.set(key, recap);
  });

  // Build result array from H2H data (to maintain matchup order)
  const results: H2HRecapWithRivalry[] = [];

  (h2hData || []).forEach((h2h: {
    member_1_id: string;
    member_2_id: string;
    member_1_wins: number;
    member_2_wins: number;
    ties: number;
    total_matchups: number;
    last_matchup_date: string | null;
    member_1_streak: number;
  }) => {
    const isFirstMember = h2h.member_1_id === memberId;
    const opponentId = isFirstMember ? h2h.member_2_id : h2h.member_1_id;
    const opponent = memberMap.get(opponentId);

    if (!opponent) return; // Skip if opponent not found

    // Get wins/losses from viewing member's perspective
    const wins = isFirstMember ? h2h.member_1_wins : h2h.member_2_wins;
    const losses = isFirstMember ? h2h.member_2_wins : h2h.member_1_wins;
    const streak = isFirstMember ? h2h.member_1_streak : -h2h.member_1_streak;

    // Determine rivalry type
    let rivalryType: 'nemesis' | 'victim' | 'rival' | 'even';
    if (wins > losses + 2) {
      rivalryType = 'victim';
    } else if (losses > wins + 2) {
      rivalryType = 'nemesis';
    } else if (Math.abs(wins - losses) <= 1 && h2h.total_matchups >= 5) {
      rivalryType = 'rival';
    } else {
      rivalryType = 'even';
    }

    // Get recap (may not exist)
    const recapKey = `${h2h.member_1_id}-${h2h.member_2_id}`;
    const recap = recapMap.get(recapKey);

    results.push({
      opponent,
      wins,
      losses,
      ties: h2h.ties,
      rivalry_type: rivalryType,
      total_matchups: h2h.total_matchups,
      last_matchup_date: h2h.last_matchup_date,
      streak,
      ai_recap: recap?.ai_recap ?? null,
      ai_recap_preview: recap?.ai_recap_preview ?? null,
      ai_recap_generated_at: recap?.ai_recap_generated_at ?? null,
      ai_recap_model: recap?.ai_recap_model ?? null,
    });
  });

  return results;
}

/**
 * Get all H2H recaps
 *
 * @returns Array of all H2H recaps
 */
export async function getAllH2HRecaps(): Promise<H2HRecap[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('h2h_recaps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllH2HRecaps] Error fetching recaps:', error);
    throw new Error(`Failed to fetch H2H recaps: ${error.message}`);
  }

  return (data || []) as H2HRecap[];
}

/**
 * Insert or update a H2H recap
 *
 * Used by the generation script to store AI-generated recaps.
 *
 * @param recap - Recap data to upsert
 */
export async function upsertH2HRecap(recap: {
  member_1_id: string;
  member_2_id: string;
  ai_recap: string;
  ai_recap_preview: string | null;
  ai_recap_model: string | null;
}): Promise<void> {
  const supabase = await getUntypedClient();

  // Ensure consistent ordering
  const [lowerId, higherId] =
    recap.member_1_id < recap.member_2_id
      ? [recap.member_1_id, recap.member_2_id]
      : [recap.member_2_id, recap.member_1_id];

  const { error } = await supabase.from('h2h_recaps').upsert(
    {
      member_1_id: lowerId,
      member_2_id: higherId,
      ai_recap: recap.ai_recap,
      ai_recap_preview: recap.ai_recap_preview,
      ai_recap_model: recap.ai_recap_model,
      ai_recap_generated_at: new Date().toISOString(),
    },
    {
      onConflict: 'member_1_id,member_2_id',
    }
  );

  if (error) {
    console.error('[upsertH2HRecap] Error upserting recap:', error);
    throw new Error(`Failed to upsert H2H recap: ${error.message}`);
  }
}

/**
 * Delete a H2H recap
 *
 * @param member1Id - UUID of first member
 * @param member2Id - UUID of second member
 */
export async function deleteH2HRecap(
  member1Id: string,
  member2Id: string
): Promise<void> {
  const supabase = await getUntypedClient();

  const [lowerId, higherId] =
    member1Id < member2Id ? [member1Id, member2Id] : [member2Id, member1Id];

  const { error } = await supabase
    .from('h2h_recaps')
    .delete()
    .eq('member_1_id', lowerId)
    .eq('member_2_id', higherId);

  if (error) {
    console.error('[deleteH2HRecap] Error deleting recap:', error);
    throw new Error(`Failed to delete H2H recap: ${error.message}`);
  }
}
