/**
 * Component Contracts
 *
 * These interfaces define the props for shared UI components.
 * ALL AGENTS must use these exact interfaces - changes require coordination.
 *
 * Agent A (Design System) IMPLEMENTS these components
 * Agent C (Features) CONSUMES these components
 */

import type { Member, Team, Season, Matchup } from '../database.types';

// =====================================
// Manager Components
// =====================================

export interface ManagerCardProps {
  /** The member data to display */
  member: Member;
  /** Display variant */
  variant: 'compact' | 'full' | 'grid';
  /** Career stats to display (from career_stats view) */
  stats?: CareerStats;
  /** Whether to show championship badges */
  showChampionships?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export interface ManagerAvatarProps {
  /** Avatar URL or null for default */
  avatarUrl: string | null;
  /** Display name for alt text and fallback initials */
  displayName: string;
  /** Size variant */
  size: 'sm' | 'md' | 'lg' | 'xl';
  /** Show championship ring indicator */
  showChampionRing?: boolean;
}

// =====================================
// Stats Components
// =====================================

export interface StatBadgeProps {
  /** The stat label */
  label: string;
  /** The stat value */
  value: string | number;
  /** Visual variant */
  variant: 'default' | 'win' | 'loss' | 'championship' | 'highlight';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional icon */
  icon?: React.ReactNode;
}

export interface StatCardProps {
  /** Card title */
  title: string;
  /** Primary value to display large */
  value: string | number;
  /** Optional subtitle/context */
  subtitle?: string;
  /** Trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

// =====================================
// H2H / Rivalry Components
// =====================================

export interface HeatmapCellProps {
  /** Wins for row member */
  wins: number;
  /** Losses for row member */
  losses: number;
  /** Total points scored by row member in rivalry */
  pointsFor?: number;
  /** Total points scored by column member in rivalry */
  pointsAgainst?: number;
  /** Click handler for drilldown */
  onClick: () => void;
  /** Whether this cell is currently selected */
  isSelected?: boolean;
  /** Display mode */
  mode: 'record' | 'heatmap';
}

export interface RivalryCardProps {
  /** The "you" member in this rivalry */
  member: Member;
  /** The opponent */
  opponent: Member;
  /** Record: [member wins, opponent wins] */
  record: [number, number];
  /** Rivalry type label */
  rivalryType: 'nemesis' | 'victim' | 'rival' | 'even';
  /** Click to view full H2H */
  onClick?: () => void;
}

export interface H2HDrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Member 1 in the H2H */
  member1: Member;
  /** Member 2 in the H2H */
  member2: Member;
  /** All matchups between these members */
  matchups: MatchupWithDetails[];
}

// =====================================
// Season Components
// =====================================

export interface SeasonCardProps {
  season: Season;
  /** Champion member for this season */
  champion?: Member;
  /** Last place member */
  lastPlace?: Member;
  onClick?: () => void;
}

export interface PlayoffBracketProps {
  /** Season to display bracket for */
  season: Season;
  /** Playoff matchups for this season */
  matchups: MatchupWithTeams[];
  /** Highlight winning path */
  highlightChampion?: boolean;
}

// =====================================
// Loading Components
// =====================================

export interface SkeletonCardProps {
  /** Which component shape to mimic */
  variant: 'manager-card' | 'stat-badge' | 'rivalry-card' | 'season-card' | 'table-row';
  /** Number of skeleton items to render */
  count?: number;
}

// =====================================
// Layout Components
// =====================================

export interface DrawerPanelProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer title */
  title: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CommandPaletteProps {
  /** Whether palette is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Available commands/search results */
  items: CommandPaletteItem[];
  /** Search handler */
  onSearch: (query: string) => void;
  /** Selection handler */
  onSelect: (item: CommandPaletteItem) => void;
}

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category: 'manager' | 'season' | 'matchup' | 'record' | 'action';
  href?: string;
  action?: () => void;
}

// =====================================
// Composite Types (used by components)
// =====================================

/** Career stats from materialized view */
export interface CareerStats {
  memberId: string;
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  winPercentage: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  seasonsPlayed: number;
  championships: number;
  playoffAppearances: number;
  lastPlaceFinishes: number;
}

/** H2H record between two members */
export interface H2HRecord {
  member1Id: string;
  member2Id: string;
  member1Wins: number;
  member2Wins: number;
  ties: number;
  member1Points: number;
  member2Points: number;
  totalMatchups: number;
}

/** Matchup with team details joined */
export interface MatchupWithTeams extends Matchup {
  homeTeam: Team;
  awayTeam: Team;
}

/** Matchup with full details for display */
export interface MatchupWithDetails extends MatchupWithTeams {
  season: Season;
  homeMember: Member;
  awayMember: Member;
}
