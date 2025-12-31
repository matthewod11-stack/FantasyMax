'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Target, Zap, Scale } from 'lucide-react';
import type { TopNEntry } from '@/lib/supabase/queries/records';

interface RecentHighlightsProps {
  highScore: TopNEntry | null;
  biggestBlowout: TopNEntry | null;
  closestGame: TopNEntry | null;
}

function HighlightItem({
  icon: Icon,
  label,
  entry,
  valueFormatter,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  entry: TopNEntry | null;
  valueFormatter: (value: number) => string;
  iconColor: string;
}) {
  if (!entry) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="font-bold text-lg tabular-nums">
          {valueFormatter(entry.value)}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {entry.display_name} • {entry.context}
        </p>
      </div>
    </div>
  );
}

export function RecentHighlights({
  highScore,
  biggestBlowout,
  closestGame,
}: RecentHighlightsProps) {
  const hasHighlights = highScore || biggestBlowout || closestGame;

  if (!hasHighlights) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            League Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No highlight data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          League Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <HighlightItem
          icon={Target}
          label="Highest Score"
          entry={highScore}
          valueFormatter={(v) => `${v.toFixed(1)} pts`}
          iconColor="bg-green-500/10 text-green-500"
        />
        <HighlightItem
          icon={Zap}
          label="Biggest Blowout"
          entry={biggestBlowout}
          valueFormatter={(v) => `+${v.toFixed(1)} margin`}
          iconColor="bg-orange-500/10 text-orange-500"
        />
        <HighlightItem
          icon={Scale}
          label="Closest Game"
          entry={closestGame}
          valueFormatter={(v) => `${v.toFixed(1)} pt difference`}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <Link
          href="/records"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          View all records →
        </Link>
      </CardContent>
    </Card>
  );
}
