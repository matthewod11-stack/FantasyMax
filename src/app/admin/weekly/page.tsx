import { createAdminClient, getUntypedAdminClient } from '@/lib/supabase/server';
import { getLatestSyncStatus } from '@/lib/supabase/queries/weekly-digest';
import { WeeklyEmailPanel } from '@/components/admin/WeeklyEmailPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncNowButton } from '@/components/admin/SyncNowButton';

export default async function AdminWeeklyPage() {
  const supabase = await createAdminClient();
  const untyped = await getUntypedAdminClient();
  const syncStatus = await getLatestSyncStatus();

  const { data: season } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const { data: latestDigest } = season
    ? await untyped
        .from('weekly_digests')
        .select('*')
        .eq('season_id', season.id)
        .order('week', { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  const digest = latestDigest as {
    email_subject: string | null;
    email_body: string | null;
    week: number;
  } | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Email</h1>
          <p className="text-muted-foreground">
            Tuesday sync → copy draft → send to the league group
          </p>
        </div>
        <SyncNowButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sync Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant={syncStatus.isStale ? 'destructive' : 'default'}>
            {syncStatus.isStale ? 'Stale — run sync before emailing' : 'Fresh'}
          </Badge>
          {syncStatus.lastSyncAt && (
            <span className="text-sm text-muted-foreground">
              Last updated {new Date(syncStatus.lastSyncAt).toLocaleString()}
            </span>
          )}
        </CardContent>
      </Card>

      {digest && season && (
        <WeeklyEmailPanel
          subject={digest.email_subject ?? ''}
          body={digest.email_body ?? ''}
          week={digest.week}
          seasonYear={season.year}
        />
      )}

      {!digest && (
        <p className="text-muted-foreground">
          No digest yet. Run a Yahoo sync to generate the weekly email draft.
        </p>
      )}
    </div>
  );
}
