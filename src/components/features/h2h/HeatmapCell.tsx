'use client';

import { cn } from '@/lib/utils';

interface HeatmapCellProps {
  wins: number;
  losses: number;
  pointsFor?: number;
  pointsAgainst?: number;
  onClick: () => void;
  isSelected?: boolean;
  mode: 'record' | 'heatmap';
  isSelf?: boolean;
}

/**
 * Get heatmap color based on win ratio
 * Uses the color system from ROADMAP.md
 */
function getHeatmapColor(wins: number, losses: number): string {
  if (wins === 0 && losses === 0) return 'bg-muted';

  const total = wins + losses;
  const winRatio = wins / total;

  if (winRatio >= 0.8) return 'bg-green-900 text-green-100'; // Dominant
  if (winRatio >= 0.65) return 'bg-green-600 text-white'; // Strong
  if (winRatio >= 0.55) return 'bg-green-400/80 text-green-950'; // Slight edge
  if (winRatio >= 0.45) return 'bg-yellow-500/50 text-yellow-950'; // Even
  if (winRatio >= 0.35) return 'bg-red-400/80 text-red-950'; // Slight disadvantage
  if (winRatio >= 0.2) return 'bg-red-600 text-white'; // Bad
  return 'bg-red-900 text-red-100'; // Dominated
}

export function HeatmapCell({
  wins,
  losses,
  onClick,
  isSelected,
  mode,
  isSelf = false,
}: HeatmapCellProps) {
  if (isSelf) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <span className="text-muted-foreground text-xs">—</span>
      </div>
    );
  }

  const total = wins + losses;
  const hasData = total > 0;

  return (
    <button
      onClick={onClick}
      disabled={!hasData}
      className={cn(
        'w-full h-full min-h-[48px] flex flex-col items-center justify-center',
        'transition-all duration-200 text-sm font-medium',
        mode === 'heatmap' && hasData && getHeatmapColor(wins, losses),
        mode === 'record' && hasData && (
          wins > losses
            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
            : wins < losses
              ? 'bg-red-500/20 text-red-700 dark:text-red-400'
              : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
        ),
        !hasData && 'bg-muted/20 text-muted-foreground',
        hasData && 'hover:scale-105 hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !hasData && 'cursor-not-allowed'
      )}
    >
      {hasData ? (
        <>
          <span className="font-bold tabular-nums">{wins}-{losses}</span>
          {mode === 'record' && (
            <span className="text-xs opacity-75">
              {total} games
            </span>
          )}
        </>
      ) : (
        <span className="text-xs">—</span>
      )}
    </button>
  );
}
