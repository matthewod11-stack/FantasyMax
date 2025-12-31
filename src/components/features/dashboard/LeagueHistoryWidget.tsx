'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Trophy, Zap, Scale, Swords } from 'lucide-react';
import type { NotableMatchup } from '@/lib/supabase/queries';

interface LeagueHistoryWidgetProps {
  events: NotableMatchup[];
  currentWeek: number;
}

function getReasonIcon(reason: NotableMatchup['notableReason']) {
  switch (reason) {
    case 'championship':
      return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
    case 'playoff':
      return <Swords className="h-3.5 w-3.5 text-purple-500" />;
    case 'high_score':
      return <Zap className="h-3.5 w-3.5 text-green-500" />;
    case 'blowout':
      return <Zap className="h-3.5 w-3.5 text-orange-500" />;
    case 'close_game':
      return <Scale className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return null;
  }
}

function getReasonLabel(reason: NotableMatchup['notableReason']): string {
  switch (reason) {
    case 'championship':
      return 'Championship';
    case 'playoff':
      return 'Playoff';
    case 'high_score':
      return 'High Score';
    case 'blowout':
      return 'Blowout';
    case 'close_game':
      return 'Nail-biter';
    default:
      return '';
  }
}

export function LeagueHistoryWidget({ events, currentWeek }: LeagueHistoryWidgetProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            This Week in History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No notable Week {currentWeek} matchups found in league history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          <span>This Week in History</span>
          <Badge variant="secondary" className="ml-auto">
            Week {currentWeek}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
          >
            <Badge
              variant="outline"
              className="shrink-0 font-mono text-xs tabular-nums"
            >
              {event.year}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getReasonIcon(event.notableReason)}
                <span className="text-xs text-muted-foreground">
                  {getReasonLabel(event.notableReason)}
                </span>
              </div>
              <p className="text-sm">
                <span className="font-medium">{event.winnerName}</span>
                {' beat '}
                <span className="text-muted-foreground">
                  {event.winnerName === event.homeMemberName
                    ? event.awayMemberName
                    : event.homeMemberName}
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {event.homeScore.toFixed(1)} - {event.awayScore.toFixed(1)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
