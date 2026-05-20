import { createAdminClient } from '@/lib/supabase/server';
import { getTradeTimeline } from '@/lib/supabase/queries/trades';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

export const metadata = {
  title: 'League Timeline | League of Degenerates',
};

export default async function TimelinePage() {
  const supabase = await createAdminClient();
  const trades = await getTradeTimeline({ limit: 20 });

  const { data: champions } = await supabase
    .from('teams')
    .select('seasons!inner(year), member:members(display_name)')
    .eq('is_champion', true)
    .order('seasons(year)', { ascending: false })
    .limit(15);

  const events: { date: string; label: string; type: string }[] = [];

  for (const t of trades) {
    events.push({
      date: t.tradeDate,
      label: `${t.team1MemberName} ↔ ${t.team2MemberName} trade`,
      type: 'trade',
    });
  }

  for (const c of champions ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = c.seasons as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = c.member as any;
    events.push({
      date: `${s?.year}-12-31`,
      label: `${m?.display_name} wins ${s?.year}`,
      type: 'champion',
    });
  }

  events.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          League Timeline
        </h1>
        <p className="text-muted-foreground">Trades, titles, and turning points</p>
      </div>

      <Card>
        <CardContent className="py-6 space-y-4">
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-border/30 pb-3 last:border-0">
              <Badge variant="outline">{e.type}</Badge>
              <div>
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">{e.date}</p>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Timeline fills as data syncs.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
