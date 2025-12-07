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
export {
  // Manager Components
  type ManagerCardProps,
  type ManagerAvatarProps,
  // Stats Components
  type StatBadgeProps,
  type StatCardProps,
  // H2H / Rivalry Components
  type HeatmapCellProps,
  type RivalryCardProps,
  type H2HDrawerProps,
  // Season Components
  type SeasonCardProps,
  type PlayoffBracketProps,
  // Loading Components
  type SkeletonCardProps,
  // Layout Components
  type DrawerPanelProps,
  type CommandPaletteProps,
  type CommandPaletteItem,
  // Composite Types (from components.ts)
  type CareerStats,
  type H2HRecord,
  type MatchupWithTeams,
  type MatchupWithDetails,
} from './components';

// Query contracts (Agent B → Agent C)
export {
  // Materialized View Types
  type CareerStatsRow,
  type H2HMatrixRow,
  type SeasonStandingsRow,
  type LeagueRecordRow,
  type RecordType,
  type RecordCategory,
  // Query Function Signatures
  type QueryFunctions,
  // Composite Query Types
  type RivalryData,
  type UpcomingMatchup,
  type HistoricalEvent,
  // Dashboard Widget Data
  type DashboardData,
} from './queries';
