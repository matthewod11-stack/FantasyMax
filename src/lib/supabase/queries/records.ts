/**
 * League Records Query Functions
 * Agent B: Data Layer
 *
 * These functions query the v_league_records view and related data.
 * Contract: Returns LeagueRecordRow from src/types/contracts/queries.ts
 *
 * NOTE: The v_league_records view is created by migration but not yet in
 * database.types.ts (auto-generated). Once migrations run and types are
 * regenerated, remove the type assertions.
 */

import { createAdminClient } from '../server';
import type {
  LeagueRecordRow,
  RecordCategory,
  RecordType,
} from '@/types/contracts/queries';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to get a Supabase client that can query any table/view
 */
async function getUntypedClient(): Promise<SupabaseClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Get all league records
 *
 * @returns Array of all league records across all categories
 *
 * @example
 * const records = await getLeagueRecords();
 * // Returns records grouped by category
 */
export async function getLeagueRecords(): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*');

  if (error) {
    console.error('[getLeagueRecords] Error fetching records:', error);
    throw new Error(`Failed to fetch league records: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get records by category
 *
 * @param category - Record category to filter by
 * @returns Array of records in the specified category
 *
 * @example
 * const singleWeekRecords = await getRecordsByCategory('single_week');
 */
export async function getRecordsByCategory(
  category: RecordCategory
): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error('[getRecordsByCategory] Error fetching records:', error);
    throw new Error(`Failed to fetch records by category: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get records held by a specific member
 *
 * @param memberId - UUID of the member
 * @returns Array of records held by the member
 */
export async function getRecordsForMember(
  memberId: string
): Promise<LeagueRecordRow[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('holder_member_id', memberId);

  if (error) {
    console.error('[getRecordsForMember] Error fetching records:', error);
    throw new Error(`Failed to fetch records for member: ${error.message}`);
  }

  return data as LeagueRecordRow[];
}

/**
 * Get a specific record by type
 *
 * @param recordType - The type of record to fetch
 * @returns The record, or null if not found
 */
export async function getRecordByType(
  recordType: RecordType
): Promise<LeagueRecordRow | null> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('v_league_records')
    .select('*')
    .eq('record_type', recordType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No record found
    }
    console.error('[getRecordByType] Error fetching record:', error);
    throw new Error(`Failed to fetch record: ${error.message}`);
  }

  return data as LeagueRecordRow;
}

/**
 * Get records grouped by category
 *
 * @returns Object with records organized by category
 */
export async function getRecordsGroupedByCategory(): Promise<
  Record<RecordCategory, LeagueRecordRow[]>
> {
  const allRecords = await getLeagueRecords();

  const grouped: Record<RecordCategory, LeagueRecordRow[]> = {
    single_week: [],
    season: [],
    career: [],
    playoff: [],
    dubious: [],
  };

  for (const record of allRecords) {
    const category = record.category as RecordCategory;
    if (grouped[category]) {
      grouped[category].push(record);
    }
  }

  return grouped;
}

/**
 * Check if a value would break an existing record
 *
 * @param recordType - The type of record to check
 * @param value - The value to compare
 * @returns Object with isRecord boolean and the current record (if exists)
 */
export async function checkIfRecordBreaking(
  recordType: RecordType,
  value: number
): Promise<{ isRecord: boolean; currentRecord: LeagueRecordRow | null }> {
  const currentRecord = await getRecordByType(recordType);

  if (!currentRecord) {
    return { isRecord: true, currentRecord: null };
  }

  // Determine if higher or lower is better based on record type
  const higherIsBetter = ![
    'lowest_single_week_score',
    'closest_game_margin',
    'worst_season_record',
    'most_last_places',
  ].includes(recordType);

  const isRecord = higherIsBetter
    ? value > currentRecord.value
    : value < currentRecord.value;

  return { isRecord, currentRecord };
}

/**
 * Get "dubious" records (hall of shame type records)
 *
 * @returns Array of dubious/negative records
 */
export async function getDubiousRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('dubious');
}

/**
 * Get single week records (highest/lowest scores, margins)
 *
 * @returns Array of single week records
 */
export async function getSingleWeekRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('single_week');
}

/**
 * Get career records (total wins, championships, etc.)
 *
 * @returns Array of career records
 */
export async function getCareerRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('career');
}

/**
 * Get season records (best record, most points, etc.)
 *
 * @returns Array of season records
 */
export async function getSeasonRecords(): Promise<LeagueRecordRow[]> {
  return getRecordsByCategory('season');
}
