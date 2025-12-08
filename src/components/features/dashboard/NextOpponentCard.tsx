'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Swords, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UpcomingMatchup } from '@/types/contracts/queries';

interface NextOpponentCardProps {
  upcomingMatchup: UpcomingMatchup | null;
  memberName: string;
}

const rivalryConfig = {
  nemesis: { label: 'NEMESIS', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  victim: { label: 'VICTIM', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  rival: { label: 'RIVAL', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  even: { label: 'EVEN', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  first_meeting: { label: 'FIRST MEETING', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

function ResultBadge({ result }: { result: 'W' | 'L' | 'T' }) {
  const styles = {
    W: 'bg-green-500/20 text-green-500 border-green-500/50',
    L: 'bg-red-500/20 text-red-500 border-red-500/50',
    T: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border',
        styles[result]
      )}
    >
      {result}
    </span>
  );
}

export function NextOpponentCard({ upcomingMatchup, memberName }: NextOpponentCardProps) {
  if (!upcomingMatchup) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5 text-muted-foreground" />
            Your Next Opponent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No upcoming matchups</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Season may have ended or not started yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { opponent, h2h_record, last_three_results, rivalry_type } = upcomingMatchup;
  const config = rivalryConfig[rivalry_type];
  const [yourWins, theirWins] = h2h_record;
  const isWinning = yourWins > theirWins;
  const isLosing = yourWins < theirWins;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5 text-muted-foreground" />
          Your Next Opponent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opponent info */}
        <div className="flex items-center gap-4">
          <ManagerAvatar
            displayName={opponent.display_name}
            avatarUrl={opponent.avatar_url}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{opponent.display_name}</h3>
            <Badge variant="outline" className={cn('text-xs', config.bgColor, config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* H2H Record */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            All-Time vs {opponent.display_name.split(' ')[0]}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  isWinning && 'text-green-500',
                  isLosing && 'text-red-500'
                )}
              >
                {yourWins}
              </span>
              <span className="text-xl text-muted-foreground">-</span>
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  isLosing && 'text-green-500',
                  isWinning && 'text-red-500'
                )}
              >
                {theirWins}
              </span>
            </div>

            {/* Last 3 results */}
            {last_three_results.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">Last 3:</span>
                {last_three_results.map((result, idx) => (
                  <ResultBadge key={idx} result={result} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rivalry insight */}
        <p className="text-sm text-muted-foreground">
          {rivalry_type === 'first_meeting' && (
            <>This will be your first matchup against {opponent.display_name.split(' ')[0]}!</>
          )}
          {rivalry_type === 'nemesis' && (
            <>Watch out - {opponent.display_name.split(' ')[0]} has your number.</>
          )}
          {rivalry_type === 'victim' && (
            <>You own this matchup. Keep the streak alive!</>
          )}
          {rivalry_type === 'rival' && (
            <>This rivalry is tight. Every point matters.</>
          )}
          {rivalry_type === 'even' && (
            <>You two are evenly matched. Time to take the lead.</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
