import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WeekHighlight } from '@/lib/supabase/queries/weekly-digest';
import { Trophy, TrendingUp, Zap, LinkIcon } from 'lucide-react';

interface WeekInReviewProps {
  week: number;
  seasonYear: number;
  highlights: WeekHighlight[];
  title?: string;
  commissionerNote?: string | null;
  publishedAt?: string | null;
}

const iconMap = {
  high_score: Trophy,
  upset: TrendingUp,
  closest: Zap,
  earnings: Trophy,
  dashboard: LinkIcon,
};

export function WeekInReview({
  week,
  seasonYear,
  highlights,
  title,
  commissionerNote,
  publishedAt,
}: WeekInReviewProps) {
  const factHighlights = highlights.filter((highlight) => highlight.type !== 'dashboard');

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-2xl tracking-wide uppercase">
              {title || `Week ${week} in Review`}
            </CardTitle>
            <CardDescription>
              {publishedAt
                ? `${seasonYear} season — published ${new Date(publishedAt).toLocaleDateString()}`
                : `${seasonYear} season — post-MNF update`}
            </CardDescription>
          </div>
          <Badge variant="default">League Dispatch</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {commissionerNote && (
          <div className="rounded-lg border border-primary/20 bg-background/80 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6">{commissionerNote}</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {factHighlights.map((h, i) => {
            const Icon = iconMap[h.type] ?? Trophy;
            return (
              <div
                key={i}
                className="rounded-lg border border-border/50 bg-card/80 p-4 space-y-1"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{h.title}</span>
                </div>
                <p className="text-sm">{h.description}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/seasons/${seasonYear}`}>Season Standings</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/head-to-head">Rivalries</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/records">Records</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
