/**
 * Dashboard Query Functions
 * Agent B: Data Layer
 *
 * These functions aggregate data for dashboard widgets.
 * Contract: Returns DashboardData and related types from src/types/contracts/queries.ts
 *
 * NOTE: The v_season_standings view is created by migration but not yet in
 * database.types.ts (auto-generated). Once migrations run and types are
 * regenerated, remove the type assertions.
 */

import { createAdminClient } from '../server';
import type {
  DashboardData,
  HistoricalEvent,
  UpcomingMatchup,
} from '@/types/contracts/queries';
import type { Member } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCareerStatsForMember } from './career';
import { getTopNemesis, getTopVictim, getH2HBetweenMembers } from './h2h';
import { getRecordsForMember } from './records';

/**
 * Helper to get a Supabase client that can query any table/view
 */
async function getUntypedClient(): Promise<SupabaseClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Get complete dashboard data for a member
 *
 * Aggregates career stats, rivalries, upcoming matchups, and records
 * into a single response object.
 *
 * @param memberId - UUID of the member
 * @returns Complete dashboard data
 */
export async function getDashboardData(memberId: string): Promise<DashboardData | null> {
  const supabase = await createAdminClient();

  // Fetch member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    console.error('[getDashboardData] Member not found:', memberError);
    return null;
  }

  // Fetch all data in parallel
  const [careerStats, topNemesis, topVictim, recordsHeld, championships] =
    await Promise.all([
      getCareerStatsForMember(memberId),
      getTopNemesis(memberId),
      getTopVictim(memberId),
      getRecordsForMember(memberId),
      getChampionshipYears(memberId),
    ]);

  if (!careerStats) {
    console.error('[getDashboardData] Career stats not found for member');
    return null;
  }

  // Upcoming matchup is context-dependent (current week)
  // For now, return null - this would be implemented when we know current week
  const upcomingMatchup = null;

  // This week in history - also context-dependent
  const thisWeekInHistory: HistoricalEvent[] = [];

  return {
    member: member as Member,
    careerStats,
    topNemesis,
    topVictim,
    upcomingMatchup,
    thisWeekInHistory,
    championships: {
      years: championships,
      total: championships.length,
    },
    recordsHeld,
  };
}

/**
 * Get championship years for a member
 *
 * @param memberId - UUID of the member
 * @returns Array of years they won championships
 */
async function getChampionshipYears(memberId: string): Promise<number[]> {
  const supabase = await createAdminClient();

  // Use explicit FK name to disambiguate (teams has multiple FKs to seasons)
  const { data, error } = await supabase
    .from('teams')
    .select('season:seasons!teams_season_id_fkey(year)')
    .eq('member_id', memberId)
    .eq('is_champion', true);

  if (error) {
    console.error('[getChampionshipYears] Error:', error);
    return [];
  }

  // Sort client-side since ordering by joined columns can be problematic
  return (data || [])
    .map((row) => row.season?.year)
    .filter((year): year is number => year != null)
    .sort((a, b) => b - a); // descending
}

/**
 * Get "This Week in History" events for a member
 *
 * Finds interesting historical events that happened during the specified week
 * across all seasons.
 *
 * @param memberId - UUID of the member
 * @param week - NFL week number
 * @returns Array of historical events
 */
export async function getThisWeekInHistory(
  memberId: string,
  week: number
): Promise<HistoricalEvent[]> {
  const supabase = await createAdminClient();
  const events: HistoricalEvent[] = [];

  // Get all matchups for this week number (filter by member client-side)
  // Note: Supabase doesn't support .or() on embedded resource filters
  const { data: allMatchups, error } = await supabase
    .from('matchups')
    .select(`
      *,
      home_team:teams!matchups_home_team_id_fkey(member_id),
      away_team:teams!matchups_away_team_id_fkey(member_id),
      season:seasons(year)
    `)
    .eq('week', week)
    .eq('status', 'final');

  if (error) {
    console.error('[getThisWeekInHistory] Error:', error);
    return [];
  }

  // Filter to matchups involving this member
  const matchups = (allMatchups || []).filter(
    (m) => m.home_team?.member_id === memberId || m.away_team?.member_id === memberId
  );

  for (const matchup of matchups || []) {
    const isHome = matchup.home_team?.member_id === memberId;
    const memberScore = isHome ? matchup.home_score : matchup.away_score;
    const opponentScore = isHome ? matchup.away_score : matchup.home_score;
    const year = matchup.season?.year;

    if (!memberScore || !opponentScore || !year) continue;

    // High score (over 150)
    if (memberScore > 150) {
      events.push({
        event_type: 'high_score',
        description: `You scored ${memberScore.toFixed(1)} pts in Week ${week}`,
        season_year: year,
        week,
        value: memberScore,
        matchup_id: matchup.id,
      });
    }

    // Low score (under 80)
    if (memberScore < 80) {
      events.push({
        event_type: 'low_score',
        description: `You scored only ${memberScore.toFixed(1)} pts in Week ${week}`,
        season_year: year,
        week,
        value: memberScore,
        matchup_id: matchup.id,
      });
    }

    // Blowout win (won by 50+)
    if (memberScore - opponentScore > 50) {
      events.push({
        event_type: 'blowout',
        description: `You won by ${(memberScore - opponentScore).toFixed(1)} pts in Week ${week}`,
        season_year: year,
        week,
        value: memberScore - opponentScore,
        matchup_id: matchup.id,
      });
    }

    // Championship game
    if (matchup.is_championship) {
      const won = matchup.winner_team_id ===
        (isHome ? matchup.home_team_id : matchup.away_team_id);
      events.push({
        event_type: 'championship',
        description: won
          ? `You won the championship in Week ${week}!`
          : `You lost in the championship in Week ${week}`,
        season_year: year,
        week,
        matchup_id: matchup.id,
      });
    }

    // Playoff game
    if (matchup.is_playoff && !matchup.is_championship) {
      events.push({
        event_type: 'playoff',
        description: `You played in the playoffs in Week ${week}`,
        season_year: year,
        week,
        matchup_id: matchup.id,
      });
    }
  }

  // Sort by most interesting (championships first, then by year descending)
  return events.sort((a, b) => {
    const priority: Record<HistoricalEvent['event_type'], number> = {
      championship: 0,
      high_score: 1,
      blowout: 2,
      playoff: 3,
      upset: 4,
      low_score: 5,
    };
    const priorityDiff = priority[a.event_type] - priority[b.event_type];
    if (priorityDiff !== 0) return priorityDiff;
    return b.season_year - a.season_year;
  });
}

/**
 * Get upcoming matchup for a member
 *
 * Finds the next unplayed matchup for the member and returns
 * H2H history with the opponent.
 *
 * @param memberId - UUID of the member
 * @returns Upcoming matchup data, or null if none found
 */
export async function getUpcomingMatchup(
  memberId: string
): Promise<UpcomingMatchup | null> {
  const supabase = await createAdminClient();

  // Find the most recent season
  const { data: currentSeason, error: seasonError } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (seasonError || !currentSeason) {
    return null;
  }

  // Find member's team for this season
  const { data: memberTeam, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('season_id', currentSeason.id)
    .eq('member_id', memberId)
    .single();

  if (teamError || !memberTeam) {
    return null;
  }

  // Find next unplayed matchup - use direct column filter (not embedded)
  const { data: scheduledMatchups, error: matchupError } = await supabase
    .from('matchups')
    .select(`
      *,
      home_team:teams!matchups_home_team_id_fkey(*,member:members(*)),
      away_team:teams!matchups_away_team_id_fkey(*,member:members(*))
    `)
    .eq('season_id', currentSeason.id)
    .eq('status', 'scheduled')
    .order('week', { ascending: true });

  if (matchupError) {
    return null;
  }

  // Filter client-side for member's team
  const nextMatchup = (scheduledMatchups || []).find(
    (m) => m.home_team_id === memberTeam.id || m.away_team_id === memberTeam.id
  );

  if (!nextMatchup) {
    return null;
  }

  // Determine opponent
  const isHome = nextMatchup.home_team_id === memberTeam.id;
  const opponentTeam = isHome ? nextMatchup.away_team : nextMatchup.home_team;
  const opponent = opponentTeam?.member;

  if (!opponent) {
    return null;
  }

  // Get H2H history
  const h2h = await getH2HBetweenMembers(memberId, opponent.id);

  // Get last 3 results - fetch all final matchups and filter client-side
  // Supabase doesn't support .or() with embedded resource filters
  const { data: allFinalMatchups } = await supabase
    .from('matchups')
    .select(`
      *,
      home_team:teams!matchups_home_team_id_fkey(member_id),
      away_team:teams!matchups_away_team_id_fkey(member_id)
    `)
    .eq('status', 'final')
    .order('created_at', { ascending: false });

  // Filter to matchups between these two members
  const recentMatchups = (allFinalMatchups || [])
    .filter((m) => {
      const homeId = m.home_team?.member_id;
      const awayId = m.away_team?.member_id;
      return (
        (homeId === memberId && awayId === opponent.id) ||
        (homeId === opponent.id && awayId === memberId)
      );
    })
    .slice(0, 3);

  const lastThreeResults: ('W' | 'L' | 'T')[] = recentMatchups.map((m) => {
    if (m.is_tie) return 'T';
    const memberIsHome = m.home_team?.member_id === memberId;
    const memberTeamId = memberIsHome ? m.home_team_id : m.away_team_id;
    return m.winner_team_id === memberTeamId ? 'W' : 'L';
  });

  // Determine rivalry type
  let rivalryType: UpcomingMatchup['rivalry_type'];
  if (!h2h) {
    rivalryType = 'first_meeting';
  } else {
    const diff = h2h.member_1_wins - h2h.member_2_wins;
    if (diff >= 3) rivalryType = 'victim';
    else if (diff <= -3) rivalryType = 'nemesis';
    else if (Math.abs(diff) <= 1 && h2h.total_matchups >= 5) rivalryType = 'rival';
    else rivalryType = 'even';
  }

  return {
    opponent,
    h2h_record: h2h ? [h2h.member_1_wins, h2h.member_2_wins] : [0, 0],
    last_three_results: lastThreeResults,
    rivalry_type: rivalryType,
  };
}

/**
 * Get season standings for display
 *
 * @param seasonId - UUID of the season (optional, defaults to most recent)
 * @returns Array of standings rows
 */
export async function getSeasonStandings(seasonId?: string) {
  const supabase = await getUntypedClient();
  const typedSupabase = await createAdminClient();

  let query = supabase.from('v_season_standings').select('*');

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  } else {
    // Get most recent season
    const { data: latestSeason } = await typedSupabase
      .from('seasons')
      .select('id')
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (latestSeason) {
      query = query.eq('season_id', latestSeason.id);
    }
  }

  const { data, error } = await query.order('final_rank', { ascending: true });

  if (error) {
    console.error('[getSeasonStandings] Error:', error);
    throw new Error(`Failed to fetch standings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all season standings across all years
 *
 * @returns Array of standings rows for all seasons
 */
export async function getAllSeasonStandings() {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_season_standings')
    .select('*')
    .order('season_year', { ascending: false })
    .order('final_rank', { ascending: true });

  if (error) {
    console.error('[getAllSeasonStandings] Error:', error);
    throw new Error(`Failed to fetch all standings: ${error.message}`);
  }

  return data || [];
}
