'use client';

import { Trophy, Flame, Calendar, Medal, Skull } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecordCategorySection } from '@/components/features/records';
import type { LeagueRecordRow, RecordCategory, RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

/**
 * Tab configuration with icons and labels
 */
const CATEGORY_TABS: {
  value: RecordCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'single_week', label: 'Single Week', icon: <Flame className="h-4 w-4" /> },
  { value: 'season', label: 'Season', icon: <Calendar className="h-4 w-4" /> },
  { value: 'career', label: 'All-Time', icon: <Trophy className="h-4 w-4" /> },
  { value: 'playoff', label: 'Playoffs', icon: <Medal className="h-4 w-4" /> },
  { value: 'dubious', label: 'Hall of Shame', icon: <Skull className="h-4 w-4" /> },
];

interface RecordsClientProps {
  recordsByCategory: Record<RecordCategory, LeagueRecordRow[]>;
  topNByRecordType: Record<RecordType, TopNEntry[]>;
}

/**
 * RecordsClient - Client component wrapper for Records page
 *
 * Displays full record cards with inline leaderboards (no drawer needed).
 */
export function RecordsClient({ recordsByCategory, topNByRecordType }: RecordsClientProps) {
  // Count total records
  const totalRecords = Object.values(recordsByCategory).flat().length;

  if (totalRecords === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-display text-muted-foreground mb-2">
          No Records Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Records will appear here once matchup data has been imported.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="single_week" className="space-y-6">
      {/* Category tabs */}
      <TabsList className="flex-wrap h-auto gap-1 p-1">
        {CATEGORY_TABS.map((tab) => {
          const recordCount = recordsByCategory[tab.value]?.length ?? 0;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 data-[state=active]:text-gold"
              disabled={recordCount === 0}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {recordCount > 0 && (
                <span className="text-xs text-muted-foreground">({recordCount})</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Tab content */}
      {CATEGORY_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <RecordCategorySection
            category={tab.value}
            records={recordsByCategory[tab.value] ?? []}
            topNByRecordType={topNByRecordType}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
