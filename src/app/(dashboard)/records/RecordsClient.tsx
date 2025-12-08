'use client';

import { useState, useCallback } from 'react';
import { Trophy, Flame, Calendar, Medal, Skull } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecordCategorySection, RecordDetailDrawer } from '@/components/features/records';
import { fetchTopNAction } from './actions';
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
}

/**
 * RecordsClient - Client component wrapper for Records page
 *
 * Manages drawer state and handles record card clicks.
 * Receives pre-fetched records from the server component.
 */
export function RecordsClient({ recordsByCategory }: RecordsClientProps) {
  const [selectedRecord, setSelectedRecord] = useState<LeagueRecordRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle record card click
  const handleRecordClick = useCallback((record: LeagueRecordRow) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  }, []);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Clear selected record after animation completes
    setTimeout(() => setSelectedRecord(null), 300);
  }, []);

  // Fetch top N entries - wraps the server action for the drawer
  const fetchTopN = useCallback(
    async (recordType: RecordType, limit: number): Promise<TopNEntry[]> => {
      return fetchTopNAction(recordType, limit);
    },
    []
  );

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
    <>
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
              onRecordClick={handleRecordClick}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Record Detail Drawer */}
      <RecordDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        record={selectedRecord}
        fetchTopN={fetchTopN}
      />
    </>
  );
}
