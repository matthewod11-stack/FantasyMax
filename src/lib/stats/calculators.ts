/**
 * Stat Calculators
 *
 * Pure functions for calculating fantasy football statistics.
 * These are used to compute stats from raw matchup/team data.
 *
 * All functions are pure (no side effects, no database calls) making them
 * easy to test and use in both client and server contexts.
 */

import type { Team, Matchup } from '@/types/database.types';

// =====================================
// Win Percentage & Records
// =====================================

export interface Record {
  wins: number;
  losses: number;
  ties: number;
}

/**
 * Calculate win percentage from a record.
 * Ties count as half a win (standard fantasy convention).
 *
 * @param record - Wins, losses, ties
 * @returns Win percentage as decimal (0.000 - 1.000)
 */
export function calculateWinPercentage(record: Record): number {
  const { wins, losses, ties } = record;
  const totalGames = wins + losses + ties;

  if (totalGames === 0) {
    return 0;
  }

  // Ties count as half a win
  const adjustedWins = wins + ties * 0.5;
  return adjustedWins / totalGames;
}

/**
 * Format win percentage for display (e.g., ".714")
 *
 * @param winPct - Win percentage as decimal
 * @returns Formatted string with 3 decimal places
 */
export function formatWinPercentage(winPct: number): string {
  // Baseball-style formatting: .714 instead of 0.714
  return winPct.toFixed(3).replace(/^0/, '');
}

/**
 * Aggregate records from multiple teams.
 *
 * @param teams - Array of teams with records
 * @returns Combined record
 */
export function aggregateRecords(teams: Team[]): Record {
  return teams.reduce(
    (acc, team) => ({
      wins: acc.wins + (team.final_record_wins ?? 0),
      losses: acc.losses + (team.final_record_losses ?? 0),
      ties: acc.ties + (team.final_record_ties ?? 0),
    }),
    { wins: 0, losses: 0, ties: 0 }
  );
}

// =====================================
// Head-to-Head Calculations
// =====================================

export interface H2HRecord {
  member1Wins: number;
  member2Wins: number;
  ties: number;
  member1Points: number;
  member2Points: number;
  totalMatchups: number;
}

/**
 * Calculate H2H record between two members from matchups.
 *
 * @param matchups - All matchups between the two members
 * @param teamToMember - Map of team_id to member_id
 * @param member1Id - First member's ID
 * @param member2Id - Second member's ID
 * @returns H2H record
 */
export function calculateH2HRecord(
  matchups: Matchup[],
  teamToMember: Map<string, string>,
  member1Id: string,
  member2Id: string
): H2HRecord {
  const result: H2HRecord = {
    member1Wins: 0,
    member2Wins: 0,
    ties: 0,
    member1Points: 0,
    member2Points: 0,
    totalMatchups: 0,
  };

  for (const matchup of matchups) {
    const homeMemberId = teamToMember.get(matchup.home_team_id);
    const awayMemberId = teamToMember.get(matchup.away_team_id);

    // Skip if not a matchup between these two members
    if (
      !((homeMemberId === member1Id && awayMemberId === member2Id) ||
        (homeMemberId === member2Id && awayMemberId === member1Id))
    ) {
      continue;
    }

    result.totalMatchups++;

    // Determine which score belongs to which member
    const member1IsHome = homeMemberId === member1Id;
    const member1Score = member1IsHome
      ? matchup.home_score ?? 0
      : matchup.away_score ?? 0;
    const member2Score = member1IsHome
      ? matchup.away_score ?? 0
      : matchup.home_score ?? 0;

    result.member1Points += member1Score;
    result.member2Points += member2Score;

    // Determine winner
    if (matchup.is_tie) {
      result.ties++;
    } else if (matchup.winner_team_id) {
      const winnerMemberId = teamToMember.get(matchup.winner_team_id);
      if (winnerMemberId === member1Id) {
        result.member1Wins++;
      } else if (winnerMemberId === member2Id) {
        result.member2Wins++;
      }
    }
  }

  return result;
}

/**
 * Determine rivalry type based on H2H record.
 *
 * @param h2h - H2H record
 * @returns Rivalry classification
 */
export function classifyRivalry(h2h: H2HRecord): 'nemesis' | 'victim' | 'rival' | 'even' {
  if (h2h.totalMatchups === 0) {
    return 'even';
  }

  const winDiff = h2h.member1Wins - h2h.member2Wins;
  const totalDecided = h2h.member1Wins + h2h.member2Wins;

  if (totalDecided === 0) {
    return 'even'; // All ties
  }

  const dominance = Math.abs(winDiff) / totalDecided;

  // 60%+ win rate = dominated matchup
  if (dominance >= 0.4) {
    return winDiff > 0 ? 'victim' : 'nemesis';
  }

  // Close but not even
  if (winDiff !== 0) {
    return 'rival';
  }

  return 'even';
}

// =====================================
// Streak Calculations
// =====================================

/**
 * Calculate current streak for a member in H2H matchups.
 * Positive = winning streak, Negative = losing streak.
 *
 * @param matchups - Matchups sorted by date (most recent first)
 * @param teamToMember - Map of team_id to member_id
 * @param memberId - Member to calculate streak for
 * @returns Streak count (positive = wins, negative = losses)
 */
export function calculateCurrentStreak(
  matchups: Matchup[],
  teamToMember: Map<string, string>,
  memberId: string
): number {
  if (matchups.length === 0) {
    return 0;
  }

  let streak = 0;
  let streakType: 'win' | 'loss' | null = null;

  for (const matchup of matchups) {
    if (!matchup.winner_team_id || matchup.is_tie) {
      continue; // Skip ties for streak purposes
    }

    const winnerMemberId = teamToMember.get(matchup.winner_team_id);
    const currentResult = winnerMemberId === memberId ? 'win' : 'loss';

    if (streakType === null) {
      streakType = currentResult;
      streak = currentResult === 'win' ? 1 : -1;
    } else if (currentResult === streakType) {
      streak += currentResult === 'win' ? 1 : -1;
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
}

// =====================================
// Points Calculations
// =====================================

export interface PointsStats {
  totalPoints: number;
  averagePoints: number;
  highScore: number;
  lowScore: number;
  gamesPlayed: number;
}

/**
 * Calculate points stats for a member across matchups.
 *
 * @param matchups - All matchups involving the member
 * @param teamToMember - Map of team_id to member_id
 * @param memberId - Member to calculate for
 * @returns Points statistics
 */
export function calculatePointsStats(
  matchups: Matchup[],
  teamToMember: Map<string, string>,
  memberId: string
): PointsStats {
  const scores: number[] = [];

  for (const matchup of matchups) {
    const homeMemberId = teamToMember.get(matchup.home_team_id);
    const awayMemberId = teamToMember.get(matchup.away_team_id);

    let memberScore: number | null = null;

    if (homeMemberId === memberId) {
      memberScore = matchup.home_score;
    } else if (awayMemberId === memberId) {
      memberScore = matchup.away_score;
    }

    if (memberScore !== null) {
      scores.push(memberScore);
    }
  }

  if (scores.length === 0) {
    return {
      totalPoints: 0,
      averagePoints: 0,
      highScore: 0,
      lowScore: 0,
      gamesPlayed: 0,
    };
  }

  const total = scores.reduce((sum, s) => sum + s, 0);

  return {
    totalPoints: total,
    averagePoints: total / scores.length,
    highScore: Math.max(...scores),
    lowScore: Math.min(...scores),
    gamesPlayed: scores.length,
  };
}

// =====================================
// Championship & Achievement Stats
// =====================================

export interface AchievementStats {
  championships: number;
  playoffAppearances: number;
  lastPlaceFinishes: number;
  regularSeasonTitles: number;
  highestScorerSeasons: number;
}

/**
 * Calculate achievement stats from teams.
 *
 * @param teams - All teams for a member
 * @returns Achievement statistics
 */
export function calculateAchievements(teams: Team[]): AchievementStats {
  return teams.reduce(
    (acc, team) => ({
      championships: acc.championships + (team.is_champion ? 1 : 0),
      playoffAppearances: acc.playoffAppearances + (team.made_playoffs ? 1 : 0),
      lastPlaceFinishes: acc.lastPlaceFinishes + (team.is_last_place ? 1 : 0),
      regularSeasonTitles:
        acc.regularSeasonTitles + (team.is_regular_season_champ ? 1 : 0),
      highestScorerSeasons:
        acc.highestScorerSeasons + (team.is_highest_scorer ? 1 : 0),
    }),
    {
      championships: 0,
      playoffAppearances: 0,
      lastPlaceFinishes: 0,
      regularSeasonTitles: 0,
      highestScorerSeasons: 0,
    }
  );
}

// =====================================
// Margin & Blowout Analysis
// =====================================

/**
 * Calculate the margin of victory/defeat for a matchup.
 *
 * @param matchup - The matchup
 * @returns Margin (positive = home team won, negative = away team won)
 */
export function calculateMargin(matchup: Matchup): number {
  return (matchup.home_score ?? 0) - (matchup.away_score ?? 0);
}

/**
 * Determine if a matchup was a "blowout" (margin > threshold).
 *
 * @param matchup - The matchup
 * @param threshold - Margin threshold (default: 40 points)
 * @returns Whether it was a blowout
 */
export function isBlowout(matchup: Matchup, threshold = 40): boolean {
  return Math.abs(calculateMargin(matchup)) >= threshold;
}

/**
 * Determine if a matchup was a "close game" (margin < threshold).
 *
 * @param matchup - The matchup
 * @param threshold - Margin threshold (default: 5 points)
 * @returns Whether it was close
 */
export function isCloseGame(matchup: Matchup, threshold = 5): boolean {
  return Math.abs(calculateMargin(matchup)) < threshold;
}
