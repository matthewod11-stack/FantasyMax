import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WeekHighlight } from '@/lib/supabase/queries/weekly-digest';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

interface WeekInReviewProps {
  week: number;
  seasonYear: number;
  highlights: WeekHighlight[];
}

const iconMap = {
  high_score: Trophy,
  upset: TrendingUp,
  closest: Zap,
  earnings: Trophy,
};

export function WeekInReview({ week, seasonYear, highlights }: WeekInReviewProps) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-2xl tracking-wide uppercase">
              Week {week} in Review
            </CardTitle>
            <CardDescription>{seasonYear} season — post-MNF update</CardDescription>
          </div>
          <Badge variant="default">This Week</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, i) => {
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
