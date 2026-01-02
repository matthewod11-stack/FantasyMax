/**
 * Luck & Schedule Strength Calculators
 *
 * Pure functions for calculating expected wins (all-play method),
 * luck index, and schedule strength from matchup data.
 *
 * The "all-play" method compares a team's weekly score against ALL other
 * teams that week, not just their scheduled opponent. This reveals whether
 * a manager was lucky (won more than expected) or unlucky (won fewer).
 */

// =====================================
// Types
// =====================================

export interface WeeklyScore {
  seasonId: string;
  week: number;
  teamId: string;
  memberId: string;
  score: number;
  actualWin: boolean; // Did they actually win their matchup?
  isPlayoff: boolean;
}

export interface LuckStats {
  actualWins: number;
  expectedWins: number;
  luckIndex: number; // positive = lucky, negative = unlucky
  scheduleStrength: number; // 0-1, average opponent win %
  weeksPlayed: number;
}

export interface SeasonLuckStats extends LuckStats {
  seasonId: string;
  year: number;
}

// =====================================
// All-Play Expected Wins
// =====================================

/**
 * Calculate expected wins using the all-play method.
 *
 * For each week, compare the team's score against all other teams that week.
 * Expected wins = (number of teams you outscored) / (total other teams).
 * Sum across all weeks for total expected wins.
 *
 * @param memberScores - All weekly scores for the target member
 * @param allScores - All weekly scores for all teams (including member)
 * @param includePlayoffs - Whether to include playoff weeks (default: false)
 * @returns Expected wins as a decimal (e.g., 8.5)
 */
export function calculateExpectedWins(
  memberScores: WeeklyScore[],
  allScores: WeeklyScore[],
  includePlayoffs = false
): number {
  // Filter out playoffs if requested
  const filteredMemberScores = includePlayoffs
    ? memberScores
    : memberScores.filter((s) => !s.isPlayoff);

  let expectedWins = 0;

  for (const memberWeek of filteredMemberScores) {
    // Get all other teams' scores for this week
    const weekScores = allScores.filter(
      (s) =>
        s.seasonId === memberWeek.seasonId &&
        s.week === memberWeek.week &&
        s.teamId !== memberWeek.teamId &&
        (includePlayoffs || !s.isPlayoff)
    );

    if (weekScores.length === 0) continue;

    // Count how many teams you would have beaten
    const wins = weekScores.filter((s) => memberWeek.score > s.score).length;
    const ties = weekScores.filter((s) => memberWeek.score === s.score).length;

    // Expected win for this week = (wins + 0.5 * ties) / opponents
    expectedWins += (wins + 0.5 * ties) / weekScores.length;
  }

  return expectedWins;
}

/**
 * Calculate actual wins from weekly scores.
 *
 * @param memberScores - All weekly scores for the target member
 * @param includePlayoffs - Whether to include playoff weeks
 * @returns Actual win count
 */
export function calculateActualWins(
  memberScores: WeeklyScore[],
  includePlayoffs = false
): number {
  const filtered = includePlayoffs
    ? memberScores
    : memberScores.filter((s) => !s.isPlayoff);

  return filtered.filter((s) => s.actualWin).length;
}

/**
 * Calculate luck index: actual wins minus expected wins.
 *
 * Positive = lucky (won more than expected)
 * Negative = unlucky (won fewer than expected)
 *
 * @param actualWins - Number of actual wins
 * @param expectedWins - Expected wins from all-play
 * @returns Luck index (can be positive or negative decimal)
 */
export function calculateLuckIndex(
  actualWins: number,
  expectedWins: number
): number {
  return actualWins - expectedWins;
}

// =====================================
// Schedule Strength
// =====================================

export interface OpponentRecord {
  memberId: string;
  wins: number;
  losses: number;
  ties: number;
}

/**
 * Calculate schedule strength as average opponent win percentage.
 *
 * Higher = harder schedule (faced better teams)
 * Lower = easier schedule (faced weaker teams)
 *
 * @param opponentRecords - Win/loss records of all opponents faced
 * @returns Schedule strength as decimal (0-1)
 */
export function calculateScheduleStrength(
  opponentRecords: OpponentRecord[]
): number {
  if (opponentRecords.length === 0) return 0;

  let totalWinPct = 0;
  let validOpponents = 0;

  for (const opponent of opponentRecords) {
    const totalGames = opponent.wins + opponent.losses + opponent.ties;
    if (totalGames === 0) continue;

    // Ties count as half a win
    const winPct = (opponent.wins + 0.5 * opponent.ties) / totalGames;
    totalWinPct += winPct;
    validOpponents++;
  }

  return validOpponents > 0 ? totalWinPct / validOpponents : 0;
}

// =====================================
// Combined Stats
// =====================================

/**
 * Calculate complete luck statistics for a member.
 *
 * @param memberScores - All weekly scores for the target member
 * @param allScores - All weekly scores for all teams
 * @param opponentRecords - Records of opponents faced
 * @param includePlayoffs - Whether to include playoff weeks
 * @returns Complete luck stats
 */
export function calculateLuckStats(
  memberScores: WeeklyScore[],
  allScores: WeeklyScore[],
  opponentRecords: OpponentRecord[],
  includePlayoffs = false
): LuckStats {
  const actualWins = calculateActualWins(memberScores, includePlayoffs);
  const expectedWins = calculateExpectedWins(memberScores, allScores, includePlayoffs);
  const luckIndex = calculateLuckIndex(actualWins, expectedWins);
  const scheduleStrength = calculateScheduleStrength(opponentRecords);

  const weeksPlayed = includePlayoffs
    ? memberScores.length
    : memberScores.filter((s) => !s.isPlayoff).length;

  return {
    actualWins,
    expectedWins,
    luckIndex,
    scheduleStrength,
    weeksPlayed,
  };
}

// =====================================
// Formatting Helpers
// =====================================

/**
 * Format luck index for display with sign.
 * e.g., +2.3 or -1.5
 */
export function formatLuckIndex(luckIndex: number): string {
  const sign = luckIndex >= 0 ? '+' : '';
  return `${sign}${luckIndex.toFixed(1)}`;
}

/**
 * Get luck classification based on luck index.
 */
export function classifyLuck(
  luckIndex: number
): 'very_lucky' | 'lucky' | 'neutral' | 'unlucky' | 'very_unlucky' {
  if (luckIndex >= 2) return 'very_lucky';
  if (luckIndex >= 0.5) return 'lucky';
  if (luckIndex > -0.5) return 'neutral';
  if (luckIndex > -2) return 'unlucky';
  return 'very_unlucky';
}

/**
 * Get human-readable luck description.
 */
export function getLuckDescription(classification: ReturnType<typeof classifyLuck>): string {
  const descriptions: Record<typeof classification, string> = {
    very_lucky: 'Very Lucky',
    lucky: 'Lucky',
    neutral: 'About Average',
    unlucky: 'Unlucky',
    very_unlucky: 'Very Unlucky',
  };
  return descriptions[classification];
}

/**
 * Format schedule strength as a percentage.
 */
export function formatScheduleStrength(strength: number): string {
  return `${(strength * 100).toFixed(0)}%`;
}

/**
 * Classify schedule difficulty.
 */
export function classifySchedule(
  strength: number
): 'very_hard' | 'hard' | 'average' | 'easy' | 'very_easy' {
  if (strength >= 0.55) return 'very_hard';
  if (strength >= 0.52) return 'hard';
  if (strength >= 0.48) return 'average';
  if (strength >= 0.45) return 'easy';
  return 'very_easy';
}
