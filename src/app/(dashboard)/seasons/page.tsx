import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Calendar, Trophy, Users } from 'lucide-react';

export default async function SeasonsPage() {
  // TODO: Switch back to createClient() when auth is enabled
  const supabase = await createAdminClient();

  // Use explicit FK to avoid ambiguity (seasons has champion_team_id and last_place_team_id too)
  const { data: seasons, error: seasonsError } = await supabase
    .from('seasons')
    .select(`
      *,
      teams:teams!teams_season_id_fkey(count),
      champion_team:teams!fk_champion_team(
        team_name,
        member:members(display_name)
      )
    `)
    .order('year', { ascending: false });

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .single();

  const isCommissioner = member?.role === 'commissioner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Seasons</h1>
          <p className="text-muted-foreground">View league history by season</p>
        </div>
        {isCommissioner && (
          <Button asChild>
            <Link href="/admin/import">
              <Plus className="mr-2 h-4 w-4" />
              Import Season
            </Link>
          </Button>
        )}
      </div>

      {!seasons || seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No seasons yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isCommissioner
                ? 'Import your first season from Yahoo or CSV to get started.'
                : 'Check back soon - your commissioner is setting things up.'}
            </p>
            {isCommissioner && (
              <Button asChild>
                <Link href="/admin/import">Import Data</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link key={season.id} href={`/seasons/${season.year}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {season.year} Season
                  </CardTitle>
                  <CardDescription>{season.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {season.champion_team && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{season.champion_team.team_name}</span>
                      <span className="text-muted-foreground">
                        ({season.champion_team.member?.display_name})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {season.num_teams} teams
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {season.num_weeks} weeks
                    </div>
                  </div>
                  {season.import_status === 'in_progress' && (
                    <p className="mt-2 text-xs text-amber-600">Import in progress...</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
