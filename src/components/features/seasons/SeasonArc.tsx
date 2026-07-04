import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  ExternalLink,
  Flame,
  type LucideIcon,
  Skull,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SeasonArcData, SeasonArcRecordBeat } from '@/lib/supabase/queries/league';

interface SeasonArcProps {
  year: number;
  arc: SeasonArcData;
}

const recordIconMap: Record<SeasonArcRecordBeat['kind'], LucideIcon> = {
  highest_score: Flame,
  worst_score: Skull,
  closest_game: Target,
  biggest_blowout: Zap,
};

export function SeasonArc({ year, arc }: SeasonArcProps) {
  const hasArc =
    arc.championPath ||
    arc.lastPlaceStory ||
    arc.records.length > 0 ||
    arc.receipts.writeups.length > 0 ||
    arc.receipts.trades.length > 0;

  if (!hasArc) return null;

  return (
    <section className="space-y-4" aria-labelledby="season-arc-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="season-arc-heading" className="text-2xl font-bold text-pretty">
            {year} Season Arc
          </h2>
          <p className="text-sm text-muted-foreground">
            The title path, basement race, turning points, and receipts that defined the year.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Deterministic Recap
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {arc.championPath && (
          <StoryBeatCard
            icon={Trophy}
            title={arc.championPath.title}
            summary={arc.championPath.summary}
            href={arc.championPath.href}
            linkLabel="View Champion Manager"
            tone="champion"
          />
        )}
        {arc.lastPlaceStory && (
          <StoryBeatCard
            icon={Skull}
            title={arc.lastPlaceStory.title}
            summary={arc.lastPlaceStory.summary}
            href={arc.lastPlaceStory.href}
            linkLabel="View Last-Place Manager"
            tone="last-place"
          />
        )}
      </div>

      {arc.records.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {arc.records.map((record) => (
            <RecordBeat key={record.kind} record={record} />
          ))}
        </div>
      )}

      {(arc.receipts.writeups.length > 0 || arc.receipts.trades.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {arc.receipts.writeups.length > 0 && (
            <ReceiptPanel
              icon={BookOpen}
              title="Commissioner Receipts"
              emptyText="No writeups connected to this season yet."
            >
              {arc.receipts.writeups.map((writeup) => (
                <Link
                  key={writeup.id}
                  href={writeup.href}
                  className="block rounded-md border border-border/60 p-3 transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/40 focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{writeup.title}</p>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {writeup.week ? `Week ${writeup.week}` : formatWriteupType(writeup.writeup_type)}
                  </p>
                  {writeup.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {writeup.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </ReceiptPanel>
          )}

          {arc.receipts.trades.length > 0 && (
            <ReceiptPanel
              icon={ArrowLeftRight}
              title="Trade Receipts"
              emptyText="No trades connected to this season yet."
            >
              {arc.receipts.trades.map((trade) => (
                <Link
                  key={trade.id}
                  href={trade.href}
                  className="block rounded-md border border-border/60 p-3 transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/40 focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{trade.title}</p>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{trade.detail}</p>
                  {trade.championshipImpact && (
                    <p className="mt-2 text-sm text-primary">{trade.championshipImpact}</p>
                  )}
                </Link>
              ))}
            </ReceiptPanel>
          )}
        </div>
      )}
    </section>
  );
}

function StoryBeatCard({
  icon: Icon,
  title,
  summary,
  href,
  linkLabel,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  summary: string;
  href: string;
  linkLabel: string;
  tone: 'champion' | 'last-place';
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        tone === 'champion' && 'border-yellow-500/40 bg-yellow-500/5',
        tone === 'last-place' && 'border-red-500/30 bg-red-500/5',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon
            className={cn('h-5 w-5', tone === 'champion' ? 'text-yellow-500' : 'text-red-500')}
            aria-hidden="true"
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px]"
        >
          {linkLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function RecordBeat({ record }: { record: SeasonArcRecordBeat }) {
  const Icon = recordIconMap[record.kind];

  return (
    <Link
      href={record.href}
      className="rounded-lg border bg-card p-4 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {record.label}
        </span>
        <span className="font-mono text-lg font-bold tabular-nums">{record.value}</span>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{record.summary}</p>
    </Link>
  );
}

function ReceiptPanel({
  icon: Icon,
  title,
  emptyText,
  children,
}: {
  icon: LucideIcon;
  title: string;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-card/40 p-4">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </h3>
      <div className="space-y-2">
        {children ?? <p className="text-sm text-muted-foreground">{emptyText}</p>}
      </div>
    </div>
  );
}

function formatWriteupType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
