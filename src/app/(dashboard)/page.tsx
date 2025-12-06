import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar, ArrowLeftRight } from 'lucide-react';

export default async function DashboardPage() {
  // TODO: Switch back to createClient() when auth is enabled
  const supabase = await createAdminClient();

  // Fetch league data
  const { data: league } = await supabase.from('league').select('*').single();

  // Fetch stats
  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: seasonCount } = await supabase
    .from('seasons')
    .select('*', { count: 'exact', head: true });

  const { count: tradeCount } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true });

  // Fetch recent champion
  const { data: recentSeason } = await supabase
    .from('seasons')
    .select(
      `
      year,
      teams!fk_champion_team (
        team_name,
        member:members (
          display_name
        )
      )
    `,
    )
    .not('champion_team_id', 'is', null)
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const stats = [
    {
      title: 'Active Members',
      value: memberCount ?? 0,
      icon: Users,
      description: 'League managers',
    },
    {
      title: 'Seasons',
      value: seasonCount ?? 0,
      icon: Calendar,
      description: 'Years of history',
    },
    {
      title: 'Trades',
      value: tradeCount ?? 0,
      icon: ArrowLeftRight,
      description: 'All-time trades',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{league?.name ?? 'FantasyMax'}</h1>
        <p className="text-muted-foreground">
          {league?.description ?? 'Your fantasy football league history'}
        </p>
        {league?.founded_year && (
          <Badge variant="secondary" className="mt-2">
            Est. {league.founded_year}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recentSeason && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Reigning Champion
            </CardTitle>
            <CardDescription>{recentSeason.year} Season</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(recentSeason.teams as { member: { display_name: string } })?.member?.display_name ??
                'TBD'}
            </p>
            <p className="text-muted-foreground">
              {(recentSeason.teams as { team_name: string })?.team_name}
            </p>
          </CardContent>
        </Card>
      )}

      {!league && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Welcome to FantasyMax</CardTitle>
            <CardDescription>
              Your league hasn&apos;t been set up yet. If you&apos;re the commissioner, head to the
              Admin panel to import your league data.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
