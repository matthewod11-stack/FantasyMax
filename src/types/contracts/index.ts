/**
 * Shared Contracts for Multi-Agent Development
 *
 * This directory contains TypeScript interfaces that ALL agents must adhere to.
 * These contracts ensure that parallel development produces compatible code.
 *
 * IMPORTANT: See EXPERIMENT.md for agent assignments and coordination protocol.
 * IMPORTANT: See ROADMAP.md for feature specifications and design requirements.
 * IMPORTANT: See docs/SESSION_PROTOCOL.md for session management rules.
 *
 * Files:
 * - components.ts: UI component prop interfaces (Agent A implements, Agent C consumes)
 * - queries.ts: Database query return types (Agent B implements, Agent C consumes)
 *
 * Rules:
 * 1. Any changes to these files require coordination with all agents
 * 2. Breaking changes must be documented in EXPERIMENT.md log
 * 3. All agents should import from this index, not directly from files
 */

// Component contracts (Agent A → Agent C)
export * from './components';

// Query contracts (Agent B → Agent C)
// Note: queries.ts has its own MatchupWithDetails that extends Matchup directly
// We re-export with explicit handling to avoid duplicate export conflicts
export {
  type CareerStatsRow,
  type H2HMatrixRow,
  type SeasonStandingsRow,
  type LeagueRecordRow,
  type RecordType,
  type RecordCategory,
  type QueryFunctions,
  type MatchupWithDetails as QueryMatchupWithDetails,
  type RivalryData,
  type UpcomingMatchup,
  type HistoricalEvent,
  type DashboardData,
} from './queries';
