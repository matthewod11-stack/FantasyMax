'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Trophy, Flame, TrendingDown, Zap, Medal, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoricalEvent } from '@/types/contracts/queries';

interface HistoryWidgetProps {
  events: HistoricalEvent[];
  currentWeek: number;
}

const eventConfig: Record<
  HistoricalEvent['event_type'],
  { icon: typeof Trophy; color: string; bgColor: string }
> = {
  championship: { icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  high_score: { icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  blowout: { icon: Zap, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  playoff: { icon: Medal, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  upset: { icon: TrendingDown, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  low_score: { icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export function HistoryWidget({ events, currentWeek }: HistoryWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const showNext = useCallback(() => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }
  }, [events.length]);

  const event = events[currentIndex];

  if (!event || events.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            This Week in History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No history for Week {currentWeek}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Play more games to build your legacy!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = eventConfig[event.event_type];
  const Icon = config.icon;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            This Week in History
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Week {currentWeek}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event card */}
        <div
          className={cn(
            'rounded-lg p-4 transition-all duration-300',
            config.bgColor
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-full', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {event.season_year}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  {event.event_type.replace('_', ' ')}
                </span>
              </div>
              <p className="font-medium">{event.description}</p>
              {event.value && (
                <p className={cn('text-2xl font-bold mt-1 tabular-nums', config.color)}>
                  {event.value.toFixed(1)} pts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {events.length > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {events.length} events
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={showNext}
              className="gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Show Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
