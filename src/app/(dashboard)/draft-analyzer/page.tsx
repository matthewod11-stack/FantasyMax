import { getUntypedAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

export const metadata = {
  title: 'Draft Analyzer | League of Degenerates',
};

export default async function DraftAnalyzerPage() {
  const supabase = await getUntypedAdminClient();

  const { data: picks } = await supabase
    .from('draft_picks')
    .select(
      `
      round,
      pick,
      overall_pick,
      player_name,
      position,
      seasons!inner(year),
      member:members(display_name)
    `,
    )
    .order('overall_pick', { ascending: true })
    .limit(200);

  type PickRow = {
    round: number;
    pick: number;
    overall_pick: number;
    player_name: string;
    seasons: { year: number };
    member: { display_name: string } | null;
  };

  const rows = (picks ?? []) as unknown as PickRow[];

  const byYear = rows.reduce(
    (acc, p) => {
      const year = p.seasons?.year ?? 0;
      if (!acc[year]) acc[year] = [];
      acc[year].push(p);
      return acc;
    },
    {} as Record<number, PickRow[]>,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          Draft Analyzer
        </h1>
        <p className="text-muted-foreground">Historical draft boards and pick history</p>
      </div>

      {Object.keys(byYear).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No draft data yet. Import draft picks via CSV or Yahoo when available.
          </CardContent>
        </Card>
      ) : (
        Object.entries(byYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, yearPicks]) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {year} Draft
                  <Badge variant="outline">{yearPicks.length} picks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {yearPicks.slice(0, 24).map((p) => (
                    <div
                      key={p.overall_pick}
                      className="text-sm border border-border/50 rounded p-2"
                    >
                      <span className="text-muted-foreground">
                        {p.round}.{p.pick}
                      </span>{' '}
                      <span className="font-medium">{p.member?.display_name}</span>
                      <p>{p.player_name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
}
