/**
 * League-Wide Query Functions
 *
 * These functions fetch league-level statistics and data
 * for the league dashboard.
 */

import { createAdminClient } from '../server';

/**
 * League-wide statistics
 */
export interface LeagueStats {
  totalSeasons: number;
  totalMembers: number;
  activeMembers: number;
  totalMatchups: number;
  foundedYear: number;
  leagueName: string;
}

/**
 * Get league-wide statistics
 */
export async function getLeagueStats(): Promise<LeagueStats> {
  const supabase = await createAdminClient();

  // Run queries in parallel
  const [
    { data: league },
    { count: seasonsCount },
    { data: members },
    { count: matchupsCount },
  ] = await Promise.all([
    supabase.from('league').select('name, founded_year').single(),
    supabase.from('seasons').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('is_active'),
    supabase.from('matchups').select('*', { count: 'exact', head: true }).eq('status', 'final'),
  ]);

  const activeMembers = members?.filter(m => m.is_active).length ?? 0;

  return {
    totalSeasons: seasonsCount ?? 0,
    totalMembers: members?.length ?? 0,
    activeMembers,
    totalMatchups: matchupsCount ?? 0,
    foundedYear: league?.founded_year ?? 2015,
    leagueName: league?.name ?? 'League of Degenerates',
  };
}

/**
 * Notable matchup for history widget
 */
export interface NotableMatchup {
  id: string;
  week: number;
  year: number;
  homeTeamName: string;
  awayTeamName: string;
  homeMemberName: string;
  awayMemberName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string;
  margin: number;
  isPlayoff: boolean;
  isChampionship: boolean;
  notableReason: 'high_score' | 'blowout' | 'close_game' | 'playoff' | 'championship';
}

/**
 * Get notable matchups from a specific week across all seasons
 * (for "This Week in History" feature)
 */
export async function getLeagueWeekHistory(week: number, limit: number = 5): Promise<NotableMatchup[]> {
  const supabase = await createAdminClient();

  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      is_playoff,
      is_championship,
      winner_team_id,
      home_team_id,
      home_team:teams!matchups_home_team_id_fkey(
        team_name,
        member:members(display_name)
      ),
      away_team:teams!matchups_away_team_id_fkey(
        team_name,
        member:members(display_name)
      ),
      season:seasons(year)
    `)
    .eq('week', week)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .order('season(year)', { ascending: false });

  if (error || !matchups) {
    console.error('[getLeagueWeekHistory] Error:', error);
    return [];
  }

  // Score each matchup for "notability"
  const scoredMatchups = matchups.map(m => {
    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;
    const margin = Math.abs(homeScore - awayScore);
    const maxScore = Math.max(homeScore, awayScore);
    const isHomeWinner = m.winner_team_id === m.home_team_id;
    const winnerName = isHomeWinner
      ? m.home_team?.member?.display_name
      : m.away_team?.member?.display_name;

    // Determine why this matchup is notable
    let notableReason: NotableMatchup['notableReason'] = 'close_game';
    let notabilityScore = 0;

    if (m.is_championship) {
      notableReason = 'championship';
      notabilityScore = 100;
    } else if (m.is_playoff) {
      notableReason = 'playoff';
      notabilityScore = 50;
    } else if (maxScore >= 180) {
      notableReason = 'high_score';
      notabilityScore = maxScore;
    } else if (margin >= 80) {
      notableReason = 'blowout';
      notabilityScore = margin;
    } else if (margin <= 5) {
      notableReason = 'close_game';
      notabilityScore = 50 - margin; // Closer = more notable
    }

    return {
      matchup: {
        id: m.id,
        week: m.week,
        year: m.season?.year ?? 0,
        homeTeamName: m.home_team?.team_name ?? 'Unknown',
        awayTeamName: m.away_team?.team_name ?? 'Unknown',
        homeMemberName: m.home_team?.member?.display_name ?? 'Unknown',
        awayMemberName: m.away_team?.member?.display_name ?? 'Unknown',
        homeScore,
        awayScore,
        winnerName: winnerName ?? 'Unknown',
        margin,
        isPlayoff: m.is_playoff ?? false,
        isChampionship: m.is_championship ?? false,
        notableReason,
      } satisfies NotableMatchup,
      score: notabilityScore,
    };
  });

  // Sort by notability and take top N (one per year max)
  const seenYears = new Set<number>();
  const notable: NotableMatchup[] = [];

  scoredMatchups
    .sort((a, b) => b.score - a.score)
    .forEach(({ matchup }) => {
      if (!seenYears.has(matchup.year) && notable.length < limit) {
        seenYears.add(matchup.year);
        notable.push(matchup);
      }
    });

  return notable.sort((a, b) => b.year - a.year);
}

/**
 * Get the most recent season with basic info
 */
export interface LatestSeasonInfo {
  id: string;
  year: number;
  name: string | null;
  numTeams: number;
  numWeeks: number;
  championName: string | null;
  championTeamName: string | null;
  lastPlaceName: string | null;
  isComplete: boolean;
}

export async function getLatestSeason(): Promise<LatestSeasonInfo | null> {
  const supabase = await createAdminClient();

  const { data: season, error } = await supabase
    .from('seasons')
    .select(`
      id,
      year,
      name,
      num_teams,
      num_weeks,
      champion_team:teams!fk_champion_team(
        team_name,
        member:members(display_name)
      ),
      last_place_team:teams!fk_last_place_team(
        member:members(display_name)
      )
    `)
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (error || !season) {
    console.error('[getLatestSeason] Error:', error);
    return null;
  }

  // Check if season is complete (has champion)
  const isComplete = !!season.champion_team;

  return {
    id: season.id,
    year: season.year,
    name: season.name,
    numTeams: season.num_teams,
    numWeeks: season.num_weeks,
    championName: season.champion_team?.member?.display_name ?? null,
    championTeamName: season.champion_team?.team_name ?? null,
    lastPlaceName: season.last_place_team?.member?.display_name ?? null,
    isComplete,
  };
}
