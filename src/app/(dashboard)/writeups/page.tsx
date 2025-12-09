import { Suspense } from 'react';
import { FileText, Calendar, Search } from 'lucide-react';
import {
  WriteupsBySeason,
  WriteupsSkeleton,
} from '@/components/features/writeups';
import { getWriteupsBySeason, getWriteupStats } from '@/lib/supabase/queries';
import { WriteupsClient } from './WriteupsClient';

export const dynamic = 'force-dynamic';

/**
 * Writeups content - fetches and displays writeup data
 */
async function WriteupsContent() {
  // Fetch data in parallel
  const [seasonWriteups, stats] = await Promise.all([
    getWriteupsBySeason(),
    getWriteupStats(),
  ]);

  // Empty state
  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-display text-muted-foreground mb-2">
          No Writeups Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Commissioner writeups will appear here once they are published.
          Check back for weekly recaps, playoff previews, and more!
        </p>
      </div>
    );
  }

  // Find the most recent season with writeups
  const latestSeasonYear = seasonWriteups[0]?.season_year ?? null;

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Writeups"
          value={stats.total.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Seasons Covered"
          value={stats.seasonsCovered.toString()}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Weekly Recaps"
          value={(stats.byType.weekly_recap ?? 0).toString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Playoff Previews"
          value={(stats.byType.playoff_preview ?? 0).toString()}
          icon={<FileText className="h-4 w-4" />}
        />
      </section>

      {/* Client-side interactive component */}
      <WriteupsClient
        seasonWriteups={seasonWriteups}
        defaultExpandedYear={latestSeasonYear}
      />
    </div>
  );
}

/**
 * Small stat card for header
 */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}

/**
 * Writeups Page
 *
 * Historical archive of commissioner writeups including:
 * - Weekly recaps with matchup scores
 * - Playoff previews and predictions
 * - Draft notes and announcements
 * - Standings updates and power rankings
 *
 * Features:
 * - Season-by-season accordion view
 * - Full-text search
 * - Drawer for full writeup content
 */
export default function WriteupsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-gold" />
          <h1 className="font-display text-4xl tracking-wide text-foreground">
            WRITEUPS
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          Commissioner recaps, previews, and league announcements
        </p>
      </div>

      {/* Content with loading state */}
      <Suspense fallback={<WriteupsSkeleton />}>
        <WriteupsContent />
      </Suspense>
    </div>
  );
}
