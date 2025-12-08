'use server';

import { getTopNForRecordType } from '@/lib/supabase/queries/records';
import type { RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

/**
 * Server action to fetch top N entries for a record type.
 * Used by the RecordDetailDrawer to load leaderboard data.
 */
export async function fetchTopNAction(
  recordType: RecordType,
  limit: number = 10
): Promise<TopNEntry[]> {
  try {
    return await getTopNForRecordType(recordType, limit);
  } catch (error) {
    console.error('[fetchTopNAction] Error:', error);
    return [];
  }
}
