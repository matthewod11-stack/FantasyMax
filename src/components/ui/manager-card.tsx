'use client';

import * as React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { ManagerAvatar } from './manager-avatar';
import { StatBadge } from './stat-badge';
import type { ManagerCardProps } from '@/types/contracts/components';

/**
 * ManagerCard Component
 *
 * Displays a manager with their avatar and key stats.
 * Three variants for different contexts:
 * - compact: Minimal, for lists and grids
 * - full: All stats, for profile headers
 * - grid: Optimized for card grids with hover effects
 *
 * Design Notes (from ROADMAP.md):
 * - "Each manager is an interactive card (not a table row)"
 * - "Card hover: flip/animate to reveal key stat"
 * - "Avatar with subtle glow for championship winners"
 *
 * @example
 * // Grid view
 * <ManagerCard
 *   member={member}
 *   stats={careerStats}
 *   variant="grid"
 *   showChampionships
 *   onClick={() => navigate(`/managers/${member.id}`)}
 * />
 */

export interface ManagerCardComponentProps extends ManagerCardProps {
  className?: string;
}

const ManagerCard = React.forwardRef<HTMLDivElement, ManagerCardComponentProps>(
  (
    {
      member,
      variant,
      stats,
      showChampionships = true,
      onClick,
      className,
    },
    ref
  ) => {
    const isChampion = stats && stats.championships > 0;
    const hasStats = !!stats;

    // Format win percentage
    const winPct = hasStats
      ? ((stats.winPercentage) * 100).toFixed(1)
      : null;

    // Format record
    const record = hasStats
      ? `${stats.totalWins}-${stats.totalLosses}${stats.totalTies > 0 ? `-${stats.totalTies}` : ''}`
      : null;

    // Compact variant - minimal display
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-3 p-2 rounded-md',
            onClick && 'cursor-pointer hover:bg-secondary/50 transition-colors',
            className
          )}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
          <ManagerAvatar
            avatarUrl={member.avatar_url}
            displayName={member.display_name}
            size="sm"
            showChampionRing={isChampion && showChampionships}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.display_name}</p>
            {record && (
              <p className="text-sm text-muted-foreground font-mono">{record}</p>
            )}
          </div>
          {isChampion && showChampionships && (
            <div className="flex items-center gap-1 text-gold">
              <Trophy className="size-4" />
              <span className="font-mono text-sm">{stats.championships}</span>
            </div>
          )}
        </div>
      );
    }

    // Full variant - detailed profile header
    if (variant === 'full') {
      return (
        <Card
          ref={ref}
          className={cn(
            'overflow-hidden',
            isChampion && 'border-gold/30',
            className
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <ManagerAvatar
                avatarUrl={member.avatar_url}
                displayName={member.display_name}
                size="xl"
                showChampionRing={isChampion && showChampionships}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-display-lg">{member.display_name}</h2>
                  <p className="text-muted-foreground">
                    Since {member.joined_year} &middot; {member.role}
                  </p>
                </div>

                {hasStats && (
                  <div className="flex flex-wrap gap-2">
                    <StatBadge label="Record" value={record!} variant="default" />
                    <StatBadge label="Win %" value={`${winPct}%`} variant="default" />
                    <StatBadge label="Seasons" value={stats.seasonsPlayed} variant="default" />
                    {stats.championships > 0 && (
                      <StatBadge
                        label="Championships"
                        value={stats.championships}
                        variant="championship"
                        icon={<Trophy className="size-3" />}
                      />
                    )}
                    {stats.playoffAppearances > 0 && (
                      <StatBadge
                        label="Playoffs"
                        value={stats.playoffAppearances}
                        variant="highlight"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Grid variant - card with hover effects for grid displays
    return (
      <Card
        ref={ref}
        className={cn(
          'group overflow-hidden transition-all duration-300',
          // Hover effects
          onClick && [
            'cursor-pointer',
            'hover:scale-[1.02] hover:shadow-lg hover:border-primary/30',
          ],
          // Champion styling
          isChampion && 'border-gold/20 hover:border-gold/40',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header with avatar and name */}
          <div className="flex items-center gap-3">
            <ManagerAvatar
              avatarUrl={member.avatar_url}
              displayName={member.display_name}
              size="lg"
              showChampionRing={isChampion && showChampionships}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg truncate group-hover:text-primary transition-colors">
                {member.display_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Since {member.joined_year}
              </p>
            </div>
          </div>

          {/* Stats row */}
          {hasStats && (
            <div className="flex flex-wrap gap-2">
              <StatBadge label="W-L" value={record!} size="sm" />
              <StatBadge label="Win%" value={`${winPct}%`} size="sm" />
              {stats.championships > 0 && showChampionships && (
                <StatBadge
                  label="Titles"
                  value={stats.championships}
                  variant="championship"
                  size="sm"
                  icon={<Trophy className="size-3" />}
                />
              )}
            </div>
          )}

          {/* Hover reveal - key stat */}
          {hasStats && (
            <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-300">
              <div className="pt-2 border-t border-border text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Career Points
                </p>
                <p className="text-stat-md text-primary">
                  {stats.totalPointsFor.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

ManagerCard.displayName = 'ManagerCard';

export { ManagerCard };
