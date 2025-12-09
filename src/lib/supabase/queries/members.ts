/**
 * Member query functions
 * Handles member listing, merge operations, and related data
 */

import { createAdminClient } from '../server';

// Types for member data
export interface TeamNameHistory {
  year: number;
  team_name: string;
}

export interface MemberWithStats {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  yahoo_manager_id: string | null;
  is_active: boolean;
  joined_year: number;
  merged_into_id: string | null;
  team_count: number;
  seasons_played: number;
  years_active: number[];
  team_names: string[];
  team_name_history: TeamNameHistory[];
  current_team_name: string | null;
}

export interface MergeResult {
  success: boolean;
  teams_updated: number;
  awards_updated: number;
  merged_member_stats: {
    display_name: string;
    yahoo_manager_id: string | null;
    joined_year: number;
    team_count: number;
    team_names: string[];
  };
}

export interface MergeHistoryEntry {
  id: string;
  primary_member_id: string;
  merged_member_id: string;
  merged_by: string | null;
  merged_at: string;
  merged_member_stats: MergeResult['merged_member_stats'];
  notes: string | null;
  primary_member?: {
    display_name: string;
  };
  merged_member?: {
    display_name: string;
  };
}

/**
 * Get all members with their team stats
 * Excludes merged members by default
 */
export async function getMembersWithStats(
  includeMerged: boolean = false
): Promise<MemberWithStats[]> {
  // Use manual query (RPC function not in types yet)
  return getMembersWithStatsFallback(includeMerged);
}

/**
 * Fallback query when RPC isn't available
 */
async function getMembersWithStatsFallback(
  includeMerged: boolean
): Promise<MemberWithStats[]> {
  const client = await createAdminClient();

  // Get all members
  let query = client
    .from('members')
    .select('*')
    .order('display_name');

  if (!includeMerged) {
    query = query.is('merged_into_id', null);
  }

  const { data: members, error: membersError } = await query;

  if (membersError || !members) {
    console.error('Error fetching members:', membersError);
    return [];
  }

  // Get team data with season info
  const { data: teams, error: teamsError } = await client
    .from('teams')
    .select('member_id, team_name, season_id');

  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
  }

  // Get all seasons for year lookup
  const { data: seasons } = await client
    .from('seasons')
    .select('id, year');

  const seasonYearMap = new Map<string, number>();
  for (const s of seasons || []) {
    seasonYearMap.set(s.id, s.year);
  }

  // Aggregate team data by member
  const teamsByMember = new Map<string, {
    team_count: number;
    team_names: Set<string>;
    years: Set<number>;
    team_name_history: TeamNameHistory[];
  }>();

  for (const team of teams || []) {
    const memberId = team.member_id;
    if (!teamsByMember.has(memberId)) {
      teamsByMember.set(memberId, {
        team_count: 0,
        team_names: new Set(),
        years: new Set(),
        team_name_history: [],
      });
    }
    const stats = teamsByMember.get(memberId)!;
    stats.team_count++;
    stats.team_names.add(team.team_name);
    const year = seasonYearMap.get(team.season_id);
    if (year) {
      stats.years.add(year);
      stats.team_name_history.push({ year, team_name: team.team_name });
    }
  }

  // Sort team name history by year (descending - most recent first)
  for (const stats of teamsByMember.values()) {
    stats.team_name_history.sort((a, b) => b.year - a.year);
  }

  // Combine member data with team stats
  return members.map((member) => {
    const teamStats = teamsByMember.get(member.id);
    const sortedHistory = teamStats?.team_name_history || [];
    return {
      id: member.id,
      display_name: member.display_name,
      email: member.email,
      avatar_url: member.avatar_url,
      role: member.role,
      yahoo_manager_id: member.yahoo_manager_id,
      is_active: member.is_active ?? true,
      joined_year: member.joined_year,
      merged_into_id: (member as Record<string, unknown>).merged_into_id as string | null,
      team_count: teamStats?.team_count || 0,
      seasons_played: teamStats?.years.size || 0,
      years_active: teamStats ? Array.from(teamStats.years).sort() : [],
      team_names: teamStats ? Array.from(teamStats.team_names) : [],
      team_name_history: sortedHistory,
      current_team_name: sortedHistory.length > 0 ? sortedHistory[0]?.team_name ?? null : null,
    };
  });
}

/**
 * Get a single member by ID
 */
export async function getMemberById(id: string): Promise<MemberWithStats | null> {
  const members = await getMembersWithStats(true);
  return members.find((m) => m.id === id) || null;
}

/**
 * Merge one member into another using the database function
 */
export async function mergeMembers(
  primaryId: string,
  mergedId: string,
  mergedBy?: string,
  notes?: string
): Promise<MergeResult> {
  const client = await createAdminClient();

  // Use type assertion since merge_members RPC isn't in generated types yet
  const { data, error } = await (client as unknown as {
    rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  }).rpc('merge_members', {
    p_primary_id: primaryId,
    p_merged_id: mergedId,
    p_merged_by: mergedBy || null,
    p_notes: notes || null,
  });

  if (error) {
    console.error('Merge error:', error);
    throw new Error(error.message);
  }

  return data as MergeResult;
}

/**
 * Get merge history
 */
export async function getMergeHistory(): Promise<MergeHistoryEntry[]> {
  const client = await createAdminClient();

  // Use type assertion since member_merges table isn't in generated types yet
  const { data, error } = await (client as unknown as {
    from: (table: string) => {
      select: (query: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown[]; error: Error | null }>;
      };
    };
  }).from('member_merges')
    .select(`
      *,
      primary_member:members!member_merges_primary_member_id_fkey(display_name),
      merged_member:members!member_merges_merged_member_id_fkey(display_name)
    `)
    .order('merged_at', { ascending: false });

  if (error) {
    console.error('Error fetching merge history:', error);
    return [];
  }

  return (data || []) as MergeHistoryEntry[];
}

/**
 * Update member display name
 */
export async function updateMemberDisplayName(
  id: string,
  displayName: string
): Promise<void> {
  const client = await createAdminClient();

  const { error } = await client
    .from('members')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete a member (only if they have no teams/data)
 * Use merge for members with data!
 */
export async function deleteMember(id: string): Promise<void> {
  const client = await createAdminClient();

  // Check for teams first
  const { count } = await client
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', id);

  if (count && count > 0) {
    throw new Error('Cannot delete member with teams. Use merge instead.');
  }

  const { error } = await client.from('members').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
