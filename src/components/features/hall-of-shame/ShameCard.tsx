'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Skull, Calendar, TrendingDown } from 'lucide-react';
import type { ShameInductee } from '@/lib/supabase/queries';

interface ShameCardProps {
  inductee: ShameInductee;
  className?: string;
  /**
   * Show as "featured" inductee (larger, more prominent)
   */
  featured?: boolean;
}

/**
 * Format win-loss-tie record
 */
function formatRecord(wins: number, losses: number, ties: number): string {
  if (ties > 0) {
    return `${wins}-${losses}-${ties}`;
  }
  return `${wins}-${losses}`;
}

/**
 * ShameCard - Hall of Shame Inductee Display
 *
 * An inverted "trophy" card design that celebrates (mocks?) last place finishes.
 * Uses muted colors and skull iconography for that special shame aesthetic.
 */
export function ShameCard({ inductee, className, featured = false }: ShameCardProps) {
  return (
    <div
      className={cn(
        // Base card design - dark, somber aesthetic
        'relative overflow-hidden rounded-xl border-2',
        'bg-gradient-to-br from-card via-card to-muted/30',
        'transition-all duration-300',
        'border-muted-foreground/20 hover:border-loss/40',
        // Featured card gets extra styling
        featured && 'ring-2 ring-loss/30 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {/* Skull watermark background */}
      <div className="absolute -right-4 -top-4 opacity-5 text-muted-foreground">
        <Skull className={cn('h-32 w-32', featured && 'h-40 w-40')} />
      </div>

      {/* Content */}
      <div className={cn('relative p-5', featured && 'p-6')}>
        {/* Year badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-loss/20 rounded-full">
            <Calendar className="h-3.5 w-3.5 text-loss" />
            <span className="font-display text-sm text-loss">{inductee.season_year}</span>
          </div>
          {featured && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Hall of Shame Inductee
            </span>
          )}
        </div>

        {/* Member info */}
        <div className="flex items-center gap-4 mb-4">
          <ManagerAvatar
            avatarUrl={null}
            displayName={inductee.display_name}
            size={featured ? 'lg' : 'md'}
          />
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-body font-semibold text-foreground truncate',
              featured && 'text-lg'
            )}>
              {inductee.display_name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {inductee.team_name}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          {/* Record */}
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-loss" />
            <span className="font-mono text-muted-foreground">
              {formatRecord(inductee.wins, inductee.losses, inductee.ties)}
            </span>
          </div>

          {/* Points */}
          {inductee.points_for > 0 && (
            <div className="text-muted-foreground">
              <span className="font-mono">{inductee.points_for.toFixed(1)}</span>
              <span className="text-xs ml-1">pts</span>
            </div>
          )}

          {/* Rank badge */}
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
            <Skull className="h-3 w-3" />
            <span>#{inductee.final_rank}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
