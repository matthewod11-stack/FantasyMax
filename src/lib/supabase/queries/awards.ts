/**
 * Awards Query Functions
 * Sprint 2.3: Awards System
 *
 * These functions query the awards and award_types tables.
 * Awards are end-of-season recognitions like MVP, Best Trade, etc.
 */

import { createAdminClient } from '../server';

/**
 * Award type definition (from award_types table)
 */
export interface AwardType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_positive: boolean | null;
}

/**
 * Award with full details including recipient and season info
 */
export interface AwardWithDetails {
  id: string;
  award_type_id: string;
  award_type_name: string;
  award_type_icon: string | null;
  award_type_description: string | null;
  is_positive: boolean;
  season_id: string;
  season_year: number;
  member_id: string;
  member_display_name: string;
  member_avatar_url: string | null;
  team_name: string | null;
  value: string | null;
  notes: string | null;
  created_at: string | null;
}

/**
 * Awards grouped by season year
 */
export interface AwardsBySeason {
  year: number;
  season_id: string;
  awards: AwardWithDetails[];
}

/**
 * Awards grouped by member
 */
export interface AwardsByMember {
  member_id: string;
  display_name: string;
  avatar_url: string | null;
  awards: AwardWithDetails[];
  total_positive: number;
  total_negative: number;
}

/**
 * Get all award types
 *
 * @returns Array of award types sorted by positive first, then name
 */
export async function getAwardTypes(): Promise<AwardType[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('award_types')
    .select('id, name, description, icon, is_positive')
    .order('is_positive', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('[getAwardTypes] Error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all awards with full details
 *
 * @returns Array of awards sorted by year descending, then award name
 */
export async function getAllAwards(): Promise<AwardWithDetails[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('awards')
    .select(`
      id,
      award_type_id,
      season_id,
      member_id,
      team_id,
      value,
      notes,
      created_at,
      award_type:award_types(name, icon, description, is_positive),
      season:seasons(year),
      member:members(display_name, avatar_url),
      team:teams(team_name)
    `)
    .order('season(year)', { ascending: false });

  if (error) {
    console.error('[getAllAwards] Error:', error);
    return [];
  }

  return (data || []).map((a) => ({
    id: a.id,
    award_type_id: a.award_type_id,
    award_type_name: a.award_type?.name ?? 'Unknown',
    award_type_icon: a.award_type?.icon ?? null,
    award_type_description: a.award_type?.description ?? null,
    is_positive: a.award_type?.is_positive ?? true,
    season_id: a.season_id,
    season_year: a.season?.year ?? 0,
    member_id: a.member_id,
    member_display_name: a.member?.display_name ?? 'Unknown',
    member_avatar_url: a.member?.avatar_url ?? null,
    team_name: a.team?.team_name ?? null,
    value: a.value,
    notes: a.notes,
    created_at: a.created_at,
  }));
}

/**
 * Get awards grouped by season
 *
 * @returns Array of seasons with their awards
 */
export async function getAwardsBySeason(): Promise<AwardsBySeason[]> {
  const awards = await getAllAwards();

  // Group by season year
  const byYear = new Map<number, AwardsBySeason>();

  for (const award of awards) {
    const existing = byYear.get(award.season_year);
    if (existing) {
      existing.awards.push(award);
    } else {
      byYear.set(award.season_year, {
        year: award.season_year,
        season_id: award.season_id,
        awards: [award],
      });
    }
  }

  // Convert to array and sort by year descending
  return Array.from(byYear.values()).sort((a, b) => b.year - a.year);
}

/**
 * Get awards for a specific season
 *
 * @param year - Season year
 * @returns Array of awards for that season
 */
export async function getAwardsForSeason(year: number): Promise<AwardWithDetails[]> {
  const supabase = await createAdminClient();

  // First get the season ID
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', year)
    .single();

  if (!season) {
    return [];
  }

  const { data, error } = await supabase
    .from('awards')
    .select(`
      id,
      award_type_id,
      season_id,
      member_id,
      team_id,
      value,
      notes,
      created_at,
      award_type:award_types(name, icon, description, is_positive),
      season:seasons(year),
      member:members(display_name, avatar_url),
      team:teams(team_name)
    `)
    .eq('season_id', season.id)
    .order('award_type(is_positive)', { ascending: false })
    .order('award_type(name)', { ascending: true });

  if (error) {
    console.error('[getAwardsForSeason] Error:', error);
    return [];
  }

  return (data || []).map((a) => ({
    id: a.id,
    award_type_id: a.award_type_id,
    award_type_name: a.award_type?.name ?? 'Unknown',
    award_type_icon: a.award_type?.icon ?? null,
    award_type_description: a.award_type?.description ?? null,
    is_positive: a.award_type?.is_positive ?? true,
    season_id: a.season_id,
    season_year: a.season?.year ?? 0,
    member_id: a.member_id,
    member_display_name: a.member?.display_name ?? 'Unknown',
    member_avatar_url: a.member?.avatar_url ?? null,
    team_name: a.team?.team_name ?? null,
    value: a.value,
    notes: a.notes,
    created_at: a.created_at,
  }));
}

/**
 * Get awards for a specific member
 *
 * @param memberId - Member UUID
 * @returns Array of awards for that member
 */
export async function getAwardsForMember(memberId: string): Promise<AwardWithDetails[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('awards')
    .select(`
      id,
      award_type_id,
      season_id,
      member_id,
      team_id,
      value,
      notes,
      created_at,
      award_type:award_types(name, icon, description, is_positive),
      season:seasons(year),
      member:members(display_name, avatar_url),
      team:teams(team_name)
    `)
    .eq('member_id', memberId)
    .order('season(year)', { ascending: false });

  if (error) {
    console.error('[getAwardsForMember] Error:', error);
    return [];
  }

  return (data || []).map((a) => ({
    id: a.id,
    award_type_id: a.award_type_id,
    award_type_name: a.award_type?.name ?? 'Unknown',
    award_type_icon: a.award_type?.icon ?? null,
    award_type_description: a.award_type?.description ?? null,
    is_positive: a.award_type?.is_positive ?? true,
    season_id: a.season_id,
    season_year: a.season?.year ?? 0,
    member_id: a.member_id,
    member_display_name: a.member?.display_name ?? 'Unknown',
    member_avatar_url: a.member?.avatar_url ?? null,
    team_name: a.team?.team_name ?? null,
    value: a.value,
    notes: a.notes,
    created_at: a.created_at,
  }));
}

/**
 * Get award leaderboard (members with most awards)
 *
 * @param limit - Maximum number of members to return
 * @returns Array of members sorted by total positive awards
 */
export async function getAwardLeaderboard(limit: number = 10): Promise<AwardsByMember[]> {
  const awards = await getAllAwards();

  // Group by member
  const byMember = new Map<string, AwardsByMember>();

  for (const award of awards) {
    const existing = byMember.get(award.member_id);
    if (existing) {
      existing.awards.push(award);
      if (award.is_positive) {
        existing.total_positive++;
      } else {
        existing.total_negative++;
      }
    } else {
      byMember.set(award.member_id, {
        member_id: award.member_id,
        display_name: award.member_display_name,
        avatar_url: award.member_avatar_url,
        awards: [award],
        total_positive: award.is_positive ? 1 : 0,
        total_negative: award.is_positive ? 0 : 1,
      });
    }
  }

  // Convert to array, sort by positive awards, and limit
  return Array.from(byMember.values())
    .sort((a, b) => b.total_positive - a.total_positive || a.total_negative - b.total_negative)
    .slice(0, limit);
}

/**
 * Get the most recent awards (latest season)
 *
 * @returns Awards from the most recent season
 */
export async function getLatestSeasonAwards(): Promise<AwardsBySeason | null> {
  const seasons = await getAwardsBySeason();
  return seasons[0] ?? null;
}

/**
 * Get award counts by type (for stats display)
 *
 * @returns Map of award type name to count
 */
export async function getAwardCounts(): Promise<Map<string, number>> {
  const awards = await getAllAwards();
  const counts = new Map<string, number>();

  for (const award of awards) {
    const current = counts.get(award.award_type_name) || 0;
    counts.set(award.award_type_name, current + 1);
  }

  return counts;
}

/**
 * Get unique seasons that have awards
 *
 * @returns Array of years with awards
 */
export async function getSeasonsWithAwards(): Promise<number[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('awards')
    .select('season:seasons(year)')
    .order('season(year)', { ascending: false });

  if (error) {
    console.error('[getSeasonsWithAwards] Error:', error);
    return [];
  }

  // Extract unique years
  const years = new Set<number>();
  for (const row of data || []) {
    if (row.season?.year) {
      years.add(row.season.year);
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}
