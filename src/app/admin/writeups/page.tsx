import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AdminWriteupsPage() {
  const supabase = await createAdminClient();

  const { data: writeups } = await supabase
    .from('writeups')
    .select('id, title, season_id, writeup_type, created_at, seasons(year)')
    .order('created_at', { ascending: false })
    .limit(50);

  const { count } = await supabase
    .from('writeups')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Writeups Admin</h1>
        <p className="text-muted-foreground">
          {count ?? 0} commissioner writeups in the archive
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Writeups</CardTitle>
          <CardDescription>Browse and edit on the public writeups page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(writeups ?? []).map((w) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const year = (w.seasons as any)?.year;
            return (
              <div
                key={w.id}
                className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{w.title}</p>
                  <p className="text-sm text-muted-foreground">{year ?? '—'}</p>
                </div>
                <Badge variant="secondary">{w.writeup_type}</Badge>
              </div>
            );
          })}
          <Button asChild className="mt-4">
            <Link href="/writeups">Open Writeups Page</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
