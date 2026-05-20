import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SyncNowButton } from '@/components/admin/SyncNowButton';

export default async function AdminSeasonsPage() {
  const supabase = await createAdminClient();

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, year, name, import_status, last_sync_at, num_teams, yahoo_league_key')
    .order('year', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Seasons</h1>
          <p className="text-muted-foreground">Season sync status and Yahoo keys</p>
        </div>
        <SyncNowButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Seasons</CardTitle>
          <CardDescription>Historical and current season records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(seasons ?? []).map((season) => (
              <div
                key={season.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{season.name || `${season.year} Season`}</p>
                  <p className="text-sm text-muted-foreground">
                    {season.num_teams} teams
                    {season.last_sync_at
                      ? ` · Last sync ${new Date(season.last_sync_at).toLocaleString()}`
                      : ' · Never synced'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{season.import_status ?? 'unknown'}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/seasons/${season.year}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
