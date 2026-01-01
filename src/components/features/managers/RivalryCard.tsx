'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/database.types';

type RivalryType = 'nemesis' | 'victim' | 'rival' | 'even';

interface RivalryCardProps {
  member: Member;
  opponent: Member;
  memberWins: number;
  opponentWins: number;
  ties?: number;
  rivalryType: RivalryType;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const rivalryConfig: Record<RivalryType, { label: string; color: string; bgColor: string }> = {
  nemesis: {
    label: 'NEMESIS',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  victim: {
    label: 'VICTIM',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  rival: {
    label: 'RIVAL',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  even: {
    label: 'EVEN',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

/**
 * Generate a contextual narrative explaining the rivalry
 */
function getRivalryNarrative(
  rivalryType: RivalryType,
  opponentName: string,
  memberWins: number,
  opponentWins: number
): string {
  const margin = Math.abs(memberWins - opponentWins);
  const firstName = opponentName.split(' ')[0];

  switch (rivalryType) {
    case 'nemesis':
      // Opponent beats you
      if (margin >= 5) {
        return `${firstName} has completely owned this matchup`;
      } else if (margin >= 3) {
        return `${firstName} has your number`;
      } else {
        return `${firstName} has the edge in this rivalry`;
      }

    case 'victim':
      // You beat opponent
      if (margin >= 5) {
        return `You've completely dominated ${firstName}`;
      } else if (margin >= 3) {
        return `${firstName} can't figure you out`;
      } else {
        return `You have the edge over ${firstName}`;
      }

    case 'rival':
      return `A competitive back-and-forth rivalry`;

    case 'even':
      return `Perfectly matched opponents`;

    default:
      return '';
  }
}

export function RivalryCard({
  member,
  opponent,
  memberWins,
  opponentWins,
  ties = 0,
  rivalryType,
  onClick,
}: RivalryCardProps) {
  const config = rivalryConfig[rivalryType];
  const isWinning = memberWins > opponentWins;
  const isLosing = memberWins < opponentWins;
  const narrative = getRivalryNarrative(rivalryType, opponent.display_name, memberWins, opponentWins);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-lg',
        onClick && 'cursor-pointer hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header with rivalry type */}
        <div className={cn('px-4 py-2 text-center', config.bgColor)}>
          <span className={cn('text-xs font-bold tracking-widest', config.color)}>
            {config.label}
          </span>
        </div>

        {/* Broadcast-style matchup display */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Member side */}
            <div className="flex-1 flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-2 border-2 border-border">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-center truncate max-w-full">
                {member.display_name}
              </span>
            </div>

            {/* Score in the middle */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-3xl font-bold tabular-nums">
                <span className={cn(isWinning && 'text-green-500', isLosing && 'text-red-500')}>
                  {memberWins}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(isLosing && 'text-green-500', isWinning && 'text-red-500')}>
                  {opponentWins}
                </span>
              </div>
              {ties > 0 && (
                <span className="text-xs text-muted-foreground">{ties} ties</span>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'mt-2 text-xs',
                  isWinning && 'border-green-500/50 text-green-500',
                  isLosing && 'border-red-500/50 text-red-500',
                  !isWinning && !isLosing && 'border-muted-foreground/50'
                )}
              >
                {memberWins + opponentWins + ties} matchups
              </Badge>
              {narrative && (
                <p className={cn(
                  'mt-2 text-xs italic text-center max-w-[140px]',
                  config.color
                )}>
                  {narrative}
                </p>
              )}
            </div>

            {/* Opponent side */}
            <div className="flex-1 flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-2 border-2 border-border">
                <AvatarImage src={opponent.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(opponent.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-center truncate max-w-full">
                {opponent.display_name}
              </span>
            </div>
          </div>
        </div>

        {/* Click hint */}
        {onClick && (
          <div className="px-4 py-2 bg-muted/50 text-center">
            <span className="text-xs text-muted-foreground">
              Click to view full history →
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
