'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { ChevronRight } from 'lucide-react';
import type { H2HRecapWithRivalry } from '@/types/contracts/queries';
import type { Member } from '@/types/database.types';

interface H2HOpponentListProps {
  viewingMember: Member;
  rivalries: H2HRecapWithRivalry[];
  onSelectOpponent: (rivalry: H2HRecapWithRivalry) => void;
}

/**
 * H2HOpponentList - Right panel showing all-time records against each opponent
 *
 * Yahoo-style list view: Avatar | Name | Record | Total games | Chevron
 */
export function H2HOpponentList({
  viewingMember,
  rivalries,
  onSelectOpponent,
}: H2HOpponentListProps) {
  // Sort by most matchups by default
  const sortedRivalries = useMemo(() => {
    return [...rivalries].sort((a, b) => b.total_matchups - a.total_matchups);
  }, [rivalries]);

  // Calculate overall record
  const overallRecord = useMemo(() => {
    const wins = rivalries.reduce((sum, r) => sum + r.wins, 0);
    const losses = rivalries.reduce((sum, r) => sum + r.losses, 0);
    return { wins, losses };
  }, [rivalries]);

  if (rivalries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>No matchup history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall record */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-wide text-muted-foreground">
          All-Time Records
        </h3>
        <div className="text-sm">
          <span className="text-win font-mono font-semibold">{overallRecord.wins}</span>
          <span className="text-muted-foreground mx-1">-</span>
          <span className="text-loss font-mono font-semibold">{overallRecord.losses}</span>
          <span className="text-muted-foreground ml-2">overall</span>
        </div>
      </div>

      {/* Opponent list */}
      <div className="space-y-1">
        {sortedRivalries.map((rivalry) => {
          const isWinning = rivalry.wins > rivalry.losses;
          const isLosing = rivalry.losses > rivalry.wins;

          return (
            <button
              key={rivalry.opponent.id}
              onClick={() => onSelectOpponent(rivalry)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all',
                'hover:bg-muted/50 hover:scale-[1.01]',
                'border border-transparent hover:border-border/50'
              )}
            >
              {/* Opponent avatar */}
              <ManagerAvatar
                avatarUrl={rivalry.opponent.avatar_url}
                displayName={rivalry.opponent.display_name}
                size="md"
              />

              {/* Opponent name */}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium truncate">
                  {rivalry.opponent.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rivalry.total_matchups} games played
                </p>
              </div>

              {/* Record */}
              <div className="text-right mr-2">
                <div className="font-mono font-semibold">
                  <span className={cn(isWinning && 'text-win')}>
                    {rivalry.wins}
                  </span>
                  <span className="text-muted-foreground mx-0.5">-</span>
                  <span className={cn(isLosing && 'text-loss')}>
                    {rivalry.losses}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
