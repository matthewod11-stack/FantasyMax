import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Cloud, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ImportHubPage() {
  const importMethods = [
    {
      id: 'csv',
      title: 'CSV Import',
      description: 'Import historical data from spreadsheets',
      icon: FileSpreadsheet,
      href: '/admin/import/csv',
      features: [
        'Import 10+ years of historical data',
        'Bulk import seasons, teams, matchups',
        'Flexible CSV format templates',
        'Great for migrating from other platforms',
      ],
      recommended: true,
    },
    {
      id: 'yahoo',
      title: 'Yahoo Fantasy API',
      description: 'Sync directly with Yahoo Fantasy Football',
      icon: Cloud,
      href: '/admin/import/yahoo',
      features: [
        'Automatic data sync',
        'Real-time updates during season',
        'Import current and past seasons',
        'Requires Yahoo API credentials',
      ],
      recommended: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Choose how you want to import your league&apos;s data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {importMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Card key={method.id} className={method.recommended ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{method.title}</CardTitle>
                      {method.recommended && (
                        <span className="text-xs text-primary font-medium">Recommended</span>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link href={method.href}>
                    Get Started
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
          <CardTitle>Import Strategy</CardTitle>
          <CardDescription>Recommended approach for setting up your league</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <h4 className="font-medium">Historical Data (CSV)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Start by importing all your historical seasons via CSV. This captures your
                league&apos;s full history.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <h4 className="font-medium">Connect Yahoo (Optional)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Link your Yahoo league for automatic current season updates and live data sync.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <h4 className="font-medium">Invite Members</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Once data is loaded, invite your league members to explore their history and stats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
