import { createAdminClient } from '@/lib/supabase/server';
import {
  getLatestSyncStatus,
  getLatestWeeklyDigestForAdmin,
} from '@/lib/supabase/queries/weekly-digest';
import { WeeklyEmailPanel } from '@/components/admin/WeeklyEmailPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncNowButton } from '@/components/admin/SyncNowButton';

export default async function AdminWeeklyPage() {
  const supabase = await createAdminClient();
  const syncStatus = await getLatestSyncStatus();

  const { data: season } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const digest = season ? await getLatestWeeklyDigestForAdmin(season.id) : null;

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
          digestId={digest.id}
          subject={digest.emailSubject}
          body={digest.emailBody}
          title={digest.publishedTitle}
          note={digest.commissionerNote ?? ''}
          status={digest.status}
          publishedAt={digest.publishedAt}
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
