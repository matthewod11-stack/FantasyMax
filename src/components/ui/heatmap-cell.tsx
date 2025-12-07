'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { HeatmapCellProps } from '@/types/contracts/components';

/**
 * HeatmapCell Component
 *
 * A cell in the H2H matrix that visualizes dominance between two managers.
 * Supports two display modes:
 * - "record": Shows W-L record (e.g., "8-4")
 * - "heatmap": Color-coded by dominance level
 *
 * Heatmap Scale (from ROADMAP.md):
 * - heat-5: Dominant (10-1 type record) - Deep green
 * - heat-4: Strong (8-3) - Green
 * - heat-3: Slight advantage (6-5) - Light green
 * - heat-2: Slight disadvantage - Light red
 * - heat-1: Bad record - Red
 * - heat-0: Dominated (1-10) - Deep red
 *
 * Accessibility:
 * - Colors are not the only indicator (record text always shown)
 * - Keyboard focusable
 * - Clear focus ring in championship gold
 *
 * @example
 * <HeatmapCell
 *   wins={8}
 *   losses={4}
 *   mode="heatmap"
 *   onClick={() => openDrawer(member1, member2)}
 * />
 */

/**
 * Calculate heatmap level (0-5) based on win/loss record
 * 5 = dominant (mostly wins), 0 = dominated (mostly losses)
 */
function getHeatLevel(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return -1; // No matchups

  const winRate = wins / total;

  if (winRate >= 0.8) return 5; // Dominant (80%+)
  if (winRate >= 0.65) return 4; // Strong (65-79%)
  if (winRate > 0.5) return 3; // Slight advantage (51-64%)
  if (winRate === 0.5) return -1; // Even - special case
  if (winRate >= 0.35) return 2; // Slight disadvantage (35-49%)
  if (winRate >= 0.2) return 1; // Bad (20-34%)
  return 0; // Dominated (<20%)
}

const heatmapClasses: Record<number, string> = {
  5: 'bg-heat-5 text-white',
  4: 'bg-heat-4 text-white',
  3: 'bg-heat-3 text-gray-900',
  2: 'bg-heat-2 text-gray-900',
  1: 'bg-heat-1 text-white',
  0: 'bg-heat-0 text-white',
  [-1]: 'bg-muted text-muted-foreground', // No data or even
};

export interface HeatmapCellComponentProps extends HeatmapCellProps {
  className?: string;
}

const HeatmapCell = React.forwardRef<HTMLButtonElement, HeatmapCellComponentProps>(
  (
    {
      wins,
      losses,
      pointsFor,
      pointsAgainst,
      onClick,
      isSelected = false,
      mode,
      className,
    },
    ref
  ) => {
    const total = wins + losses;
    const heatLevel = getHeatLevel(wins, losses);
    const isEven = total > 0 && wins === losses;

    // Format record display
    const recordDisplay = total === 0 ? '-' : `${wins}-${losses}`;

    // Determine background based on mode
    const bgClass =
      mode === 'heatmap'
        ? heatmapClasses[heatLevel]
        : total === 0
          ? 'bg-muted text-muted-foreground'
          : wins > losses
            ? 'bg-win/20 text-win'
            : wins < losses
              ? 'bg-loss/20 text-loss'
              : 'bg-muted text-foreground';

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={total === 0}
        className={cn(
          // Base styles
          'relative flex items-center justify-center',
          'min-w-[60px] min-h-[40px] p-2',
          'font-mono text-sm font-medium tabular-nums',
          'rounded-sm transition-all duration-150',
          // Background based on mode
          bgClass,
          // Interactive states
          total > 0 && [
            'cursor-pointer',
            'hover:scale-105 hover:shadow-lg hover:z-10',
            'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background',
          ],
          // Selected state
          isSelected && 'ring-2 ring-gold scale-105 shadow-lg z-10',
          // Disabled state (no matchups)
          total === 0 && 'cursor-default opacity-50',
          // Even matchup indicator
          isEven && mode === 'heatmap' && 'bg-tie/20 text-tie',
          className
        )}
        aria-label={
          total === 0
            ? 'No matchups'
            : `${wins} wins, ${losses} losses. Click for details.`
        }
      >
        {recordDisplay}

        {/* Points tooltip indicator (optional feature) */}
        {pointsFor !== undefined && pointsAgainst !== undefined && total > 0 && (
          <span className="sr-only">
            Total points: {pointsFor.toFixed(1)} for, {pointsAgainst.toFixed(1)}{' '}
            against
          </span>
        )}
      </button>
    );
  }
);

HeatmapCell.displayName = 'HeatmapCell';

export { HeatmapCell, getHeatLevel };
