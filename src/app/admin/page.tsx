import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Users, Calendar, FileText, ArrowRight } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get recent import logs
  const { data: recentImports } = await supabase
    .from('import_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5);

  // Get counts for quick stats
  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });

  const { count: seasonCount } = await supabase
    .from('seasons')
    .select('*', { count: 'exact', head: true });

  const { count: pendingInvites } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null)
    .not('invite_token', 'is', null);

  const adminCards = [
    {
      title: 'Import Data',
      description: 'Import historical data via CSV or sync with Yahoo Fantasy API',
      icon: Upload,
      href: '/admin/import',
      action: 'Import Data',
    },
    {
      title: 'Manage Members',
      description: 'Add members, send invites, and manage roles',
      icon: Users,
      href: '/admin/members',
      action: 'Manage',
      badge: pendingInvites ? `${pendingInvites} pending` : undefined,
    },
    {
      title: 'Manage Seasons',
      description: 'Create seasons, update standings, and manage matchups',
      icon: Calendar,
      href: '/admin/seasons',
      action: 'Manage',
    },
    {
      title: 'Writeups',
      description: 'Create commissioner recaps and season summaries',
      icon: FileText,
      href: '/admin/writeups',
      action: 'Write',
    },
  ];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">{status ?? 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Commissioner Dashboard</h1>
        <p className="text-muted-foreground">Manage your league data and settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Seasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seasonCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.href}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>{card.title}</CardTitle>
                  </div>
                  {card.badge && <Badge variant="secondary">{card.badge}</Badge>}
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={card.href}>
                    {card.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>History of data imports</CardDescription>
        </CardHeader>
        <CardContent>
          {recentImports && recentImports.length > 0 ? (
            <div className="space-y-4">
              {recentImports.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium capitalize">{log.source} Import</p>
                    <p className="text-sm text-muted-foreground">
                      {log.started_at ? new Date(log.started_at).toLocaleDateString() : 'Unknown'} -{' '}
                      {(log.records_created ?? 0) + (log.records_updated ?? 0)} records
                    </p>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No imports yet. Start by importing your data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
