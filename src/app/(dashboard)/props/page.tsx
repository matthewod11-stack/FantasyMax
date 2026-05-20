import { createAdminClient } from '@/lib/supabase/server';
import { getOpenProps, getPropLeaderboard } from '@/lib/supabase/queries/economy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

export const metadata = {
  title: 'Degenerate Dollars | League of Degenerates',
};

export default async function PropsPage() {
  const supabase = await createAdminClient();
  const { data: season } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!season) {
    return <p className="text-muted-foreground">No season data</p>;
  }

  const [props, leaderboard] = await Promise.all([
    getOpenProps(season.id),
    getPropLeaderboard(season.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <Coins className="h-8 w-8 text-primary" />
          Degenerate Dollars
        </h1>
        <p className="text-muted-foreground">
          Virtual currency only — bragging rights, not real money ({season.year})
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Props</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.length === 0 ? (
              <p className="text-sm text-muted-foreground">No props this week yet.</p>
            ) : (
              props.map((p) => (
                <div key={p.id} className="border border-border/50 rounded p-3">
                  <p className="font-medium text-sm">{p.question}</p>
                  <Badge variant="outline" className="mt-1">
                    Week {p.week} · {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.map((row, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{row.member?.display_name ?? 'Unknown'}</span>
                <span className="font-mono">{row.balance} DD</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground">Balances initialize at 50 DD per season.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
