/**
 * Luck & Schedule Strength Query Functions
 *
 * Fetches matchup data and calculates luck statistics
 * (expected wins, luck index, schedule strength) for members.
 */

import { createAdminClient } from '../server';
import {
  calculateLuckStats,
  type WeeklyScore,
  type OpponentRecord,
  type LuckStats,
  type SeasonLuckStats,
} from '@/lib/stats/luck';

export type { LuckStats, SeasonLuckStats };

/**
 * Get luck stats for a member's career (all seasons combined).
 *
 * @param memberId - The member ID
 * @returns Luck statistics or null if error
 */
export async function getCareerLuckStats(
  memberId: string
): Promise<LuckStats | null> {
  const supabase = await createAdminClient();

  // Fetch all final matchups with scores
  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select(`
      id,
      season_id,
      week,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      winner_team_id,
      is_playoff,
      status
    `)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (matchupsError) {
    console.error('[getCareerLuckStats] Error fetching matchups:', matchupsError);
    return null;
  }

  if (!matchups || matchups.length === 0) {
    return null;
  }

  // Fetch all teams with their final records
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      member_id,
      final_record_wins,
      final_record_losses,
      final_record_ties
    `);

  if (teamsError || !teams) {
    console.error('[getCareerLuckStats] Error fetching teams:', teamsError);
    return null;
  }

  const teamToMember = new Map(teams.map((t) => [t.id, t.member_id]));
  const teamRecords = new Map(teams.map((t) => [t.id, {
    wins: t.final_record_wins ?? 0,
    losses: t.final_record_losses ?? 0,
    ties: t.final_record_ties ?? 0,
  }]));

  // Flatten matchups into weekly scores
  const allScores: WeeklyScore[] = [];
  const memberScores: WeeklyScore[] = [];

  // Track opponents faced by member
  const opponentsFaced: OpponentRecord[] = [];
  const opponentMemberIds = new Set<string>();

  for (const matchup of matchups) {
    const homeMemberId = teamToMember.get(matchup.home_team_id);
    const awayMemberId = teamToMember.get(matchup.away_team_id);

    if (!homeMemberId || !awayMemberId) continue;

    const homeWon = matchup.winner_team_id === matchup.home_team_id;
    const awayWon = matchup.winner_team_id === matchup.away_team_id;

    // Home team score
    const homeScore: WeeklyScore = {
      seasonId: matchup.season_id,
      week: matchup.week,
      teamId: matchup.home_team_id,
      memberId: homeMemberId,
      score: matchup.home_score!,
      actualWin: homeWon,
      isPlayoff: matchup.is_playoff ?? false,
    };
    allScores.push(homeScore);

    // Away team score
    const awayScore: WeeklyScore = {
      seasonId: matchup.season_id,
      week: matchup.week,
      teamId: matchup.away_team_id,
      memberId: awayMemberId,
      score: matchup.away_score!,
      actualWin: awayWon,
      isPlayoff: matchup.is_playoff ?? false,
    };
    allScores.push(awayScore);

    // Collect member's scores and opponents
    if (homeMemberId === memberId) {
      memberScores.push(homeScore);
      // Track opponent
      if (!opponentMemberIds.has(awayMemberId)) {
        const oppTeamRecord = teamRecords.get(matchup.away_team_id);
        if (oppTeamRecord) {
          opponentsFaced.push({
            memberId: awayMemberId,
            ...oppTeamRecord,
          });
          opponentMemberIds.add(awayMemberId);
        }
      }
    } else if (awayMemberId === memberId) {
      memberScores.push(awayScore);
      // Track opponent
      if (!opponentMemberIds.has(homeMemberId)) {
        const oppTeamRecord = teamRecords.get(matchup.home_team_id);
        if (oppTeamRecord) {
          opponentsFaced.push({
            memberId: homeMemberId,
            ...oppTeamRecord,
          });
          opponentMemberIds.add(homeMemberId);
        }
      }
    }
  }

  if (memberScores.length === 0) {
    return null;
  }

  // Calculate luck stats (regular season only by default)
  return calculateLuckStats(memberScores, allScores, opponentsFaced, false);
}

/**
 * Get luck stats broken down by season.
 *
 * @param memberId - The member ID
 * @returns Array of season luck stats or null if error
 */
export async function getSeasonLuckStats(
  memberId: string
): Promise<SeasonLuckStats[] | null> {
  const supabase = await createAdminClient();

  // Fetch all final matchups with scores and season info
  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select(`
      id,
      season_id,
      week,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      winner_team_id,
      is_playoff,
      status,
      seasons!matchups_season_id_fkey (
        id,
        year
      )
    `)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (matchupsError) {
    console.error('[getSeasonLuckStats] Error fetching matchups:', matchupsError);
    return null;
  }

  if (!matchups || matchups.length === 0) {
    return null;
  }

  // Fetch all teams with their records
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      member_id,
      season_id,
      final_record_wins,
      final_record_losses,
      final_record_ties
    `);

  if (teamsError || !teams) {
    console.error('[getSeasonLuckStats] Error fetching teams:', teamsError);
    return null;
  }

  const teamToMember = new Map(teams.map((t) => [t.id, t.member_id]));
  const teamRecords = new Map(teams.map((t) => [t.id, {
    wins: t.final_record_wins ?? 0,
    losses: t.final_record_losses ?? 0,
    ties: t.final_record_ties ?? 0,
  }]));

  // Group matchups by season
  const seasonMap = new Map<string, { year: number; matchups: typeof matchups }>();

  for (const matchup of matchups) {
    const season = matchup.seasons as { id: string; year: number } | null;
    if (!season) continue;

    if (!seasonMap.has(season.id)) {
      seasonMap.set(season.id, { year: season.year, matchups: [] });
    }
    seasonMap.get(season.id)!.matchups.push(matchup);
  }

  const results: SeasonLuckStats[] = [];

  for (const [seasonId, { year, matchups: seasonMatchups }] of seasonMap) {
    const allScores: WeeklyScore[] = [];
    const memberScores: WeeklyScore[] = [];
    const opponentsFaced: OpponentRecord[] = [];
    const opponentMemberIds = new Set<string>();

    for (const matchup of seasonMatchups) {
      const homeMemberId = teamToMember.get(matchup.home_team_id);
      const awayMemberId = teamToMember.get(matchup.away_team_id);

      if (!homeMemberId || !awayMemberId) continue;

      const homeWon = matchup.winner_team_id === matchup.home_team_id;
      const awayWon = matchup.winner_team_id === matchup.away_team_id;

      const homeScore: WeeklyScore = {
        seasonId: matchup.season_id,
        week: matchup.week,
        teamId: matchup.home_team_id,
        memberId: homeMemberId,
        score: matchup.home_score!,
        actualWin: homeWon,
        isPlayoff: matchup.is_playoff ?? false,
      };
      allScores.push(homeScore);

      const awayScore: WeeklyScore = {
        seasonId: matchup.season_id,
        week: matchup.week,
        teamId: matchup.away_team_id,
        memberId: awayMemberId,
        score: matchup.away_score!,
        actualWin: awayWon,
        isPlayoff: matchup.is_playoff ?? false,
      };
      allScores.push(awayScore);

      if (homeMemberId === memberId) {
        memberScores.push(homeScore);
        if (!opponentMemberIds.has(awayMemberId)) {
          const oppTeamRecord = teamRecords.get(matchup.away_team_id);
          if (oppTeamRecord) {
            opponentsFaced.push({ memberId: awayMemberId, ...oppTeamRecord });
            opponentMemberIds.add(awayMemberId);
          }
        }
      } else if (awayMemberId === memberId) {
        memberScores.push(awayScore);
        if (!opponentMemberIds.has(homeMemberId)) {
          const oppTeamRecord = teamRecords.get(matchup.home_team_id);
          if (oppTeamRecord) {
            opponentsFaced.push({ memberId: homeMemberId, ...oppTeamRecord });
            opponentMemberIds.add(homeMemberId);
          }
        }
      }
    }

    // Skip seasons where member didn't play
    if (memberScores.length === 0) continue;

    const stats = calculateLuckStats(memberScores, allScores, opponentsFaced, false);

    results.push({
      seasonId,
      year,
      ...stats,
    });
  }

  // Sort by year descending (most recent first)
  results.sort((a, b) => b.year - a.year);

  return results;
}
