/**
 * Query Functions Index
 * Agent B: Data Layer
 *
 * Re-exports all query functions for easy importing.
 *
 * Usage:
 * import { getCareerStats, getH2HMatrix } from '@/lib/supabase/queries';
 */

// Career stats queries
export {
  getCareerStats,
  getCareerStatsForMember,
  getCareerLeaderboard,
  getChampions,
  getHallOfShame,
  getShameInducteesBySeason,
  getClosestToShame,
} from './career';
export type { ShameInductee } from './career';

// H2H queries
export {
  getH2HMatrix,
  getH2HBetweenMembers,
  getH2HMatchups,
  getMemberRivalries,
  getTopNemesis,
  getTopVictim,
  getBiggestRivalries,
} from './h2h';

// Records queries
export {
  getLeagueRecords,
  getRecordsByCategory,
  getRecordsForMember,
  getRecordByType,
  getRecordsGroupedByCategory,
  checkIfRecordBreaking,
  getDubiousRecords,
  getSingleWeekRecords,
  getCareerRecords,
  getSeasonRecords,
} from './records';

// Dashboard queries
export {
  getDashboardData,
  getThisWeekInHistory,
  getUpcomingMatchup,
  getSeasonStandings,
  getAllSeasonStandings,
} from './dashboard';

// Awards queries
export {
  getAwardTypes,
  getAllAwards,
  getAwardsBySeason,
  getAwardsForSeason,
  getAwardsForMember,
  getAwardLeaderboard,
  getLatestSeasonAwards,
  getAwardCounts,
  getSeasonsWithAwards,
} from './awards';
export type {
  AwardType,
  AwardWithDetails,
  AwardsBySeason,
  AwardsByMember,
} from './awards';

// Writeups queries
export {
  getAllWriteups,
  getWriteupById,
  getWriteupsBySeason,
  getWriteupsForSeason,
  getWriteupsByType,
  getFeaturedWriteups,
  searchWriteups,
  getWriteupStats,
} from './writeups';

// Member queries
export {
  getMembersWithStats,
  getMemberById,
  mergeMembers,
  getMergeHistory,
  updateMemberDisplayName,
  deleteMember,
} from './members';
export type {
  MemberWithStats,
  MergeResult,
  MergeHistoryEntry,
  TeamNameHistory,
} from './members';

// League queries
export {
  getLeagueStats,
  getLeagueWeekHistory,
  getLatestSeason,
} from './league';
export type {
  LeagueStats,
  NotableMatchup,
  LatestSeasonInfo,
} from './league';

// Records - Top N queries
export {
  getTopHighestScores,
  getTopLowestScores,
  getTopBlowouts,
  getTopClosestGames,
  getTopSeasonWins,
  getTopSeasonPoints,
  getTopNForRecordType,
} from './records';
export type { TopNEntry } from './records';

// Earnings queries
export { getWeeklyHighScoresForMember } from './earnings';
export type { WeeklyHighScoreData } from './earnings';
