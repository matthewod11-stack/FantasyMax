'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TradeTimelineItem } from '@/lib/supabase/queries/trades';
import { ArrowLeftRight } from 'lucide-react';

interface TradesTimelineProps {
  trades: TradeTimelineItem[];
}

export function TradesTimeline({ trades }: TradesTimelineProps) {
  const [selected, setSelected] = useState<TradeTimelineItem | null>(null);

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
            className={`w-full text-left rounded-lg border p-4 transition-all hover:border-primary/50 ${
              selected?.id === trade.id ? 'border-primary bg-primary/5' : 'border-border/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">{trade.seasonYear}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(trade.tradeDate).toLocaleDateString()}
              </span>
            </div>
            <p className="font-medium text-sm">
              {trade.team1MemberName} ↔ {trade.team2MemberName}
            </p>
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
          {selected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selected.team1MemberName} ↔ {selected.team2MemberName} ·{' '}
                {selected.seasonYear}
              </p>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  {selected.team1MemberName} sends
                </p>
                <ul className="text-sm space-y-1">
                  {selected.team1Sends.map((p, i) => (
                    <li key={i}>• {p.name}</li>
                  ))}
                  {selected.team1Sends.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  {selected.team2MemberName} sends
                </p>
                <ul className="text-sm space-y-1">
                  {selected.team2Sends.map((p, i) => (
                    <li key={i}>• {p.name}</li>
                  ))}
                  {selected.team2Sends.length === 0 && <li className="text-muted-foreground">—</li>}
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
