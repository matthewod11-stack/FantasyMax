/**
 * FantasyMax Design System Components
 *
 * Re-exports all design system components from a single entry point.
 * Use this for consistent imports across the application.
 *
 * @example
 * import {
 *   ManagerCard,
 *   StatBadge,
 *   HeatmapCell,
 *   SkeletonCard,
 *   DrawerPanel,
 *   CommandPalette,
 * } from '@/components/ui/design-system';
 */

// Manager components
export { ManagerCard } from './manager-card';
export { ManagerAvatar, getInitials } from './manager-avatar';

// Stats components
export { StatBadge, statBadgeVariants } from './stat-badge';

// H2H components
export { HeatmapCell, getHeatLevel } from './heatmap-cell';

// Loading components
export { SkeletonCard, Skeleton } from './skeleton-card';

// Layout components
export { DrawerPanel } from './drawer-panel';

// Navigation components
export { CommandPalette } from './command-palette';
