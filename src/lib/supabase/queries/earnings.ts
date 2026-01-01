/**
 * Earnings Query Functions
 * Weekly high score tracking and earnings calculations
 *
 * $50 per week for highest score in the league (regular season only)
 */

import { createAdminClient } from '../server';

const WEEKLY_HIGH_SCORE_AMOUNT = 50;

export interface WeeklyHighScoreData {
  count: number;
  earnings: number;
}

interface MatchupScore {
  season_id: string;
  season_year: number;
  week: number;
  team_id: string;
  member_id: string;
  score: number;
}

/**
 * Get weekly high score count and earnings for a member
 *
 * Calculates how many weeks the member had the highest score
 * across the entire league (regular season only).
 *
 * @param memberId - The member ID to check
 * @returns Count of weekly high scores and total earnings
 */
export async function getWeeklyHighScoresForMember(
  memberId: string
): Promise<WeeklyHighScoreData> {
  const supabase = await createAdminClient();

  // Fetch all regular season matchups with scores
  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      season_id,
      week,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      is_playoff,
      status,
      seasons!matchups_season_id_fkey (
        id,
        year
      )
    `)
    .eq('is_playoff', false)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (error) {
    console.error('[getWeeklyHighScoresForMember] Error fetching matchups:', error);
    return { count: 0, earnings: 0 };
  }

  if (!matchups || matchups.length === 0) {
    return { count: 0, earnings: 0 };
  }

  // Fetch all teams to map team_id -> member_id
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, member_id');

  if (teamsError || !teams) {
    console.error('[getWeeklyHighScoresForMember] Error fetching teams:', teamsError);
    return { count: 0, earnings: 0 };
  }

  const teamToMember = new Map(teams.map((t) => [t.id, t.member_id]));

  // Flatten matchups into individual scores
  const allScores: MatchupScore[] = [];

  for (const matchup of matchups) {
    const season = matchup.seasons as { id: string; year: number } | null;
    if (!season) continue;

    // Home team score
    if (matchup.home_score !== null && matchup.home_team_id) {
      const homeMemberId = teamToMember.get(matchup.home_team_id);
      if (homeMemberId) {
        allScores.push({
          season_id: matchup.season_id!,
          season_year: season.year,
          week: matchup.week!,
          team_id: matchup.home_team_id,
          member_id: homeMemberId,
          score: matchup.home_score,
        });
      }
    }

    // Away team score
    if (matchup.away_score !== null && matchup.away_team_id) {
      const awayMemberId = teamToMember.get(matchup.away_team_id);
      if (awayMemberId) {
        allScores.push({
          season_id: matchup.season_id!,
          season_year: season.year,
          week: matchup.week!,
          team_id: matchup.away_team_id,
          member_id: awayMemberId,
          score: matchup.away_score,
        });
      }
    }
  }

  // Group by season+week and find the max score for each week
  const weeklyMaxScores = new Map<string, { maxScore: number; winners: string[] }>();

  for (const score of allScores) {
    const key = `${score.season_id}-${score.week}`;
    const current = weeklyMaxScores.get(key);

    if (!current) {
      weeklyMaxScores.set(key, { maxScore: score.score, winners: [score.member_id] });
    } else if (score.score > current.maxScore) {
      weeklyMaxScores.set(key, { maxScore: score.score, winners: [score.member_id] });
    } else if (score.score === current.maxScore && !current.winners.includes(score.member_id)) {
      // Tie - add to winners list
      current.winners.push(score.member_id);
    }
  }

  // Count how many weeks the target member had the high score
  let count = 0;
  for (const { winners } of weeklyMaxScores.values()) {
    if (winners.includes(memberId)) {
      count++;
    }
  }

  return {
    count,
    earnings: count * WEEKLY_HIGH_SCORE_AMOUNT,
  };
}
