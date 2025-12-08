'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Skull, Crown, Medal, Award } from 'lucide-react';
import type { CareerStatsRow } from '@/types/contracts/queries';

interface ShameLeaderboardProps {
  members: CareerStatsRow[];
  className?: string;
}

/**
 * Get rank icon based on position (inverted from normal trophy icons)
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-loss" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="text-sm text-muted-foreground font-mono w-5 text-center">{rank}</span>;
  }
}

/**
 * Get rank label for top 3
 */
function getRankLabel(rank: number): string | null {
  switch (rank) {
    case 1:
      return 'King of Shame';
    case 2:
      return 'Prince of Failure';
    case 3:
      return 'Duke of Disappointment';
    default:
      return null;
  }
}

/**
 * ShameLeaderboard - Most Last Place Finishes Ranking
 *
 * Shows members ranked by their total last place finishes.
 * The ultimate leaderboard of shame.
 */
export function ShameLeaderboard({ members, className }: ShameLeaderboardProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Skull className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No one has earned their place in shame yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {members.map((member, index) => {
        const rank = index + 1;
        const rankLabel = getRankLabel(rank);

        return (
          <div
            key={member.member_id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              rank === 1 && 'bg-loss/10 border border-loss/20',
              rank === 2 && 'bg-muted/50',
              rank === 3 && 'bg-amber-900/10',
              rank > 3 && 'hover:bg-muted/30'
            )}
          >
            {/* Rank icon */}
            <div className="w-8 flex justify-center">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <ManagerAvatar
              avatarUrl={null}
              displayName={member.display_name}
              size="sm"
            />

            {/* Name & label */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium truncate',
                rank === 1 && 'text-loss'
              )}>
                {member.display_name}
              </p>
              {rankLabel && (
                <p className="text-xs text-muted-foreground italic">
                  {rankLabel}
                </p>
              )}
            </div>

            {/* Last place count */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                rank === 1 ? 'bg-loss/20' : 'bg-muted'
              )}>
                <Skull className={cn(
                  'h-4 w-4',
                  rank === 1 ? 'text-loss' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'font-display text-lg',
                  rank === 1 ? 'text-loss' : 'text-foreground'
                )}>
                  {member.last_place_finishes}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
