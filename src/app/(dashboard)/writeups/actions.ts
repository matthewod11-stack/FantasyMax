'use server';

import { getWriteupById, searchWriteups } from '@/lib/supabase/queries';
import type { WriteupWithDetails, WriteupSearchResult } from '@/types/contracts/queries';

/**
 * Server action to fetch a writeup by ID
 */
export async function getWriteupByIdAction(id: string): Promise<WriteupWithDetails | null> {
  try {
    return await getWriteupById(id);
  } catch (error) {
    console.error('[getWriteupByIdAction] Error:', error);
    return null;
  }
}

/**
 * Server action to search writeups using PostgreSQL full-text search
 *
 * Uses the search_writeups() RPC function which:
 * - Searches title and content using ts_rank
 * - Returns results ranked by relevance
 * - Supports partial word matching via to_tsquery
 *
 * @param query - Search query string (min 2 chars)
 * @returns Array of search results ranked by relevance
 */
export async function searchWriteupsAction(query: string): Promise<WriteupSearchResult[]> {
  // Require minimum query length to avoid noise
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    return await searchWriteups(query.trim());
  } catch (error) {
    console.error('[searchWriteupsAction] Error:', error);
    return [];
  }
}
