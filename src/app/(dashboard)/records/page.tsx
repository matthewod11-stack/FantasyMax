import { Suspense } from 'react';
import { RecordsSkeleton } from '@/components/features/records';
import { getRecordsGroupedByCategory, getTopNForRecordType } from '@/lib/supabase/queries/records';
import { RecordsClient } from './RecordsClient';
import type { RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

export const dynamic = 'force-dynamic';

/**
 * Record types that support Top N leaderboards
 */
const LEADERBOARD_RECORD_TYPES: RecordType[] = [
  'highest_single_week_score',
  'lowest_single_week_score',
  'biggest_blowout_margin',
  'closest_game_margin',
  'most_season_wins',
  'most_season_points',
];

/**
 * Fetch all Top N data for records that support leaderboards
 */
async function fetchAllTopN(): Promise<Record<RecordType, TopNEntry[]>> {
  const results: Record<string, TopNEntry[]> = {};

  // Fetch all Top N in parallel
  const promises = LEADERBOARD_RECORD_TYPES.map(async (recordType) => {
    try {
      const entries = await getTopNForRecordType(recordType, 10);
      return { recordType, entries };
    } catch (error) {
      console.error(`Error fetching top N for ${recordType}:`, error);
      return { recordType, entries: [] };
    }
  });

  const resolved = await Promise.all(promises);
  resolved.forEach(({ recordType, entries }) => {
    results[recordType] = entries;
  });

  return results as Record<RecordType, TopNEntry[]>;
}

/**
 * Records content - fetches data and passes to client component
 */
async function RecordsContent() {
  // Fetch records and Top N data in parallel
  const [recordsByCategory, topNByRecordType] = await Promise.all([
    getRecordsGroupedByCategory(),
    fetchAllTopN(),
  ]);

  return (
    <RecordsClient
      recordsByCategory={recordsByCategory}
      topNByRecordType={topNByRecordType}
    />
  );
}

/**
 * Records Page
 *
 * The league record book - displaying all-time records with inline leaderboards.
 * Categories: Single Week, Season, All-Time, Playoffs, Hall of Shame
 */
export default function RecordsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-display text-4xl tracking-wide text-foreground">
          LEAGUE RECORDS
        </h1>
        <p className="text-muted-foreground font-body">
          The trophy room of excellence (and infamy)
        </p>
      </div>

      {/* Records content with loading state */}
      <Suspense fallback={<RecordsSkeleton />}>
        <RecordsContent />
      </Suspense>
    </div>
  );
}
