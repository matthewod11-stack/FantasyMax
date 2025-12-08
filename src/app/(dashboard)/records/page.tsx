import { Suspense } from 'react';
import { RecordsSkeleton } from '@/components/features/records';
import { getRecordsGroupedByCategory } from '@/lib/supabase/queries/records';
import { RecordsClient } from './RecordsClient';

export const dynamic = 'force-dynamic';

/**
 * Records content - fetches data and passes to client component
 */
async function RecordsContent() {
  const recordsByCategory = await getRecordsGroupedByCategory();

  return <RecordsClient recordsByCategory={recordsByCategory} />;
}

/**
 * Records Page
 *
 * The league record book - displaying all-time records as digital trophy plaques.
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
