'use client';

import type { KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronRight, Sparkles } from 'lucide-react';
import type { H2HRecapWithRivalry } from '@/types/contracts/queries';

interface H2HRivalryCardProps {
  rivalry: H2HRecapWithRivalry;
  onClick?: () => void;
}

const rivalryConfig = {
  nemesis: {
    label: 'NEMESIS',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  victim: {
    label: 'VICTIM',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  rival: {
    label: 'RIVAL',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  even: {
    label: 'MATCHUP',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted-foreground/30',
  },
};

/**
 * Format streak display with icon and text
 */
function getStreakDisplay(streak: number) {
  if (streak === 0) {
    return { icon: Minus, text: 'Even', color: 'text-muted-foreground' };
  }
  if (streak > 0) {
    const text = streak === 1 ? '1 win streak' : `${streak} win streak`;
    return { icon: TrendingUp, text, color: 'text-green-500' };
  }
  const absStreak = Math.abs(streak);
  const text = absStreak === 1 ? '1 loss streak' : `${absStreak} loss streak`;
  return { icon: TrendingDown, text, color: 'text-red-500' };
}

export function H2HRivalryCard({ rivalry, onClick }: H2HRivalryCardProps) {
  const config = rivalryConfig[rivalry.rivalry_type];
  const isWinning = rivalry.wins > rivalry.losses;
  const isLosing = rivalry.wins < rivalry.losses;
  const streakInfo = getStreakDisplay(rivalry.streak);
  const StreakIcon = streakInfo.icon;
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border-l-4 transition-[box-shadow,transform] duration-300 hover:shadow-lg',
        config.borderColor,
        onClick &&
          'cursor-pointer hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View rivalry with ${rivalry.opponent.display_name}` : undefined}
    >
      <CardContent className="p-0">
        {/* Main content area */}
        <div className="p-4">
          {/* Top row: Avatar, name, rivalry badge, record */}
          <div className="flex items-center gap-4">
            {/* Opponent avatar */}
            <ManagerAvatar
              avatarUrl={rivalry.opponent.avatar_url}
              displayName={rivalry.opponent.display_name}
              size="lg"
              className="size-14 border-2 border-border"
            />

            {/* Name and rivalry type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-lg truncate">
                  {rivalry.opponent.display_name}
                </span>
                <Badge className={cn('text-xs shrink-0', config.bgColor, config.color)}>
                  {config.label}
                </Badge>
              </div>

              {/* Streak indicator */}
              <div className="flex items-center gap-1 mt-1">
                <StreakIcon className={cn('h-3 w-3', streakInfo.color)} />
                <span className={cn('text-xs', streakInfo.color)}>
                  {streakInfo.text}
                </span>
              </div>
            </div>

            {/* Record */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-2xl font-bold tabular-nums">
                <span className={cn(isWinning && 'text-green-500', isLosing && 'text-red-500')}>
                  {rivalry.wins}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(isLosing && 'text-green-500', isWinning && 'text-red-500')}>
                  {rivalry.losses}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {rivalry.total_matchups} games
              </span>
            </div>
          </div>

          {/* AI Recap preview */}
          {rivalry.ai_recap_preview && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                  &ldquo;{rivalry.ai_recap_preview}&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Click to view */}
        {onClick && (
          <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between border-t">
            <span className="text-xs text-muted-foreground">
              View full history & analysis
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
