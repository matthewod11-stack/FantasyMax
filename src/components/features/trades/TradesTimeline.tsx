'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TradeTimelineItem } from '@/lib/supabase/queries/trades';
import { ArrowLeftRight, Trophy } from 'lucide-react';

interface TradesTimelineProps {
  trades: TradeTimelineItem[];
}

export function TradesTimeline({ trades }: TradesTimelineProps) {
  const [selected, setSelected] = useState<TradeTimelineItem | null>(null);
  const activeTrade = selected ?? trades[0] ?? null;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No trades imported yet. Commissioner can sync from Yahoo in Admin → Import.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        {trades.map((trade) => (
          <button
            key={trade.id}
            type="button"
            onClick={() => setSelected(trade)}
            className={`w-full rounded-lg border p-4 text-left transition-[border-color,background-color,transform] hover:border-primary/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
              activeTrade?.id === trade.id ? 'border-primary bg-primary/5' : 'border-border/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">{trade.seasonYear}</Badge>
              <span className="text-xs text-muted-foreground">
                {dateFormatter.format(new Date(`${trade.tradeDate}T00:00:00Z`))}
              </span>
            </div>
            <p className="truncate text-sm font-medium">
              {trade.team1MemberName} ↔ {trade.team2MemberName}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {trade.team1Sends.map((p) => p.name).join(', ')} ↔ {trade.team2Sends.map((p) => p.name).join(', ')}
            </p>
            {trade.championshipImpact && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <Trophy className="h-3 w-3" aria-hidden="true" />
                <span className="line-clamp-1">{trade.championshipImpact}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <Card className="lg:sticky lg:top-6 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5" />
            Trade Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTrade ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activeTrade.team1MemberName} ↔ {activeTrade.team2MemberName} ·{' '}
                {activeTrade.seasonYear}
                {activeTrade.week ? ` · Week ${activeTrade.week}` : ''}
                {' · '}
                {dateFormatter.format(new Date(`${activeTrade.tradeDate}T00:00:00Z`))}
              </p>
              {activeTrade.championshipImpact && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                  {activeTrade.championshipImpact}
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  {activeTrade.team1MemberName} sends
                </p>
                <ul className="text-sm space-y-1">
                  {activeTrade.team1Sends.map((p, i) => (
                    <li key={i}>• {p.name}</li>
                  ))}
                  {activeTrade.team1Sends.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  {activeTrade.team2MemberName} sends
                </p>
                <ul className="text-sm space-y-1">
                  {activeTrade.team2Sends.map((p, i) => (
                    <li key={i}>• {p.name}</li>
                  ))}
                  {activeTrade.team2Sends.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a trade to see details</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
