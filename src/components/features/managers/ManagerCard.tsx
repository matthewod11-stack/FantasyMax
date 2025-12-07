'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/database.types';

/**
 * Career stats interface - matches contract from components.ts
 * TODO: Import from @/types/contracts/components when Agent A delivers
 */
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

export interface ManagerCardProps {
  member: Member;
  variant: 'compact' | 'full' | 'grid';
  stats?: CareerStats;
  showChampionships?: boolean;
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

export function ManagerCard({
  member,
  variant,
  stats,
  showChampionships = true,
  onClick,
}: ManagerCardProps) {
  const hasChampionships = stats && stats.championships > 0;
  const winPct = stats ? (stats.winPercentage * 100).toFixed(1) : null;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-colors w-full text-left',
          'hover:bg-accent',
          onClick && 'cursor-pointer'
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(member.display_name)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">{member.display_name}</span>
        {hasChampionships && showChampionships && (
          <Trophy className="h-3 w-3 text-yellow-500 ml-auto" />
        )}
      </button>
    );
  }

  if (variant === 'grid') {
    return (
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:scale-[1.02]',
          onClick && 'cursor-pointer',
          hasChampionships && 'ring-1 ring-yellow-500/20'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with championship glow */}
            <div className={cn(
              'relative mb-4',
              hasChampionships && 'after:absolute after:inset-0 after:rounded-full after:shadow-[0_0_15px_rgba(234,179,8,0.3)]'
            )}>
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl font-bold bg-muted">
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
              {hasChampionships && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Trophy className="h-3 w-3 text-yellow-900" />
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-bold text-lg mb-1">{member.display_name}</h3>

            {/* Championships */}
            {hasChampionships && showChampionships && (
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: stats.championships }).map((_, i) => (
                  <Trophy key={i} className="h-4 w-4 text-yellow-500" />
                ))}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-3 border-t">
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats.totalWins}-{stats.totalLosses}
                    {stats.totalTies > 0 && `-${stats.totalTies}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Career Record</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{winPct}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            )}

            {/* Hover reveal - key stat */}
            {stats && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center justify-center gap-2 text-sm">
                  {stats.championships > 0 ? (
                    <>
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">
                        {stats.championships}x Champion
                      </span>
                    </>
                  ) : stats.playoffAppearances > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{stats.playoffAppearances} Playoff Appearances</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      <span>Seeking first playoff berth</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-md',
        onClick && 'cursor-pointer',
        hasChampionships && 'ring-1 ring-yellow-500/20'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'relative',
            hasChampionships && 'after:absolute after:inset-0 after:rounded-full after:shadow-[0_0_12px_rgba(234,179,8,0.25)]'
          )}>
            <Avatar className="h-14 w-14">
              <AvatarImage src={member.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(member.display_name)}
              </AvatarFallback>
            </Avatar>
            {hasChampionships && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5">
                <Trophy className="h-2.5 w-2.5 text-yellow-900" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{member.display_name}</h3>
            <p className="text-sm text-muted-foreground">
              Since {member.joined_year}
            </p>
          </div>

          {stats && (
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-bold tabular-nums">
                  {stats.totalWins}-{stats.totalLosses}
                </p>
                <p className="text-xs text-muted-foreground">Record</p>
              </div>
              <div>
                <p className="font-bold tabular-nums">{winPct}%</p>
                <p className="text-xs text-muted-foreground">Win %</p>
              </div>
              {showChampionships && stats.championships > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  {stats.championships}x Champ
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
