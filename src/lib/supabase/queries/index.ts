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
} from './career';

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
