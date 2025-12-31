/**
 * Writeups Query Functions
 * Sprint 2.4: Commissioner Writeups
 *
 * These functions query the writeups table for historical
 * commissioner content (weekly recaps, playoff previews, etc).
 */

import { createAdminClient } from '../server';
import type {
  WriteupWithDetails,
  WriteupsBySeason,
  WriteupSearchResult,
  WriteupType,
} from '@/types/contracts/queries';

/**
 * Helper to get untyped client (writeups table not in generated types yet)
 */
async function getUntypedClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Get all published writeups with author and season info
 *
 * @returns Array of writeups sorted by season year desc, then original_order
 */
export async function getAllWriteups(): Promise<WriteupWithDetails[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeups')
    .select(`
      id,
      title,
      content,
      excerpt,
      season_id,
      week,
      writeup_type,
      author_id,
      status,
      published_at,
      is_featured,
      imported_from,
      original_order,
      created_at,
      updated_at,
      author:members!author_id(id, display_name, avatar_url),
      season:seasons!season_id(id, year)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[getAllWriteups] Error:', error);
    return [];
  }

  return (data || []).map(transformWriteup);
}

/**
 * Get a single writeup by ID
 *
 * @param id - Writeup UUID
 * @returns Writeup with details or null if not found
 */
export async function getWriteupById(id: string): Promise<WriteupWithDetails | null> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeups')
    .select(`
      id,
      title,
      content,
      excerpt,
      season_id,
      week,
      writeup_type,
      author_id,
      status,
      published_at,
      is_featured,
      imported_from,
      original_order,
      created_at,
      updated_at,
      author:members!author_id(id, display_name, avatar_url),
      season:seasons!season_id(id, year)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getWriteupById] Error:', error);
    return null;
  }

  return transformWriteup(data);
}

/**
 * Get writeups grouped by season, including AI reviews
 *
 * @returns Array of seasons with their writeups and AI reviews, sorted by year descending
 */
export async function getWriteupsBySeason(): Promise<WriteupsBySeason[]> {
  const supabase = await getUntypedClient();
  const writeups = await getAllWriteups();

  // Fetch AI reviews for all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, year, ai_review, ai_review_generated_at')
    .order('year', { ascending: false });

  // Create a map of season data by year
  const seasonDataByYear = new Map<number, { id: string; ai_review: string | null; ai_review_generated_at: string | null }>();
  for (const season of seasons || []) {
    seasonDataByYear.set(season.year, {
      id: season.id,
      ai_review: season.ai_review,
      ai_review_generated_at: season.ai_review_generated_at,
    });
  }

  // Group writeups by season year
  const byYear = new Map<number, WriteupsBySeason>();

  // First, create entries for all seasons that have AI reviews (even if no writeups)
  for (const [year, data] of seasonDataByYear) {
    byYear.set(year, {
      season_year: year,
      season_id: data.id,
      writeups: [],
      ai_review: data.ai_review,
      ai_review_generated_at: data.ai_review_generated_at,
    });
  }

  // Then add writeups to their respective seasons
  for (const writeup of writeups) {
    const year = writeup.season?.year ?? 0;
    const seasonId = writeup.season?.id ?? '';

    const existing = byYear.get(year);
    if (existing) {
      existing.writeups.push(writeup);
    } else {
      // Season not in our map (shouldn't happen, but handle gracefully)
      byYear.set(year, {
        season_year: year,
        season_id: seasonId,
        writeups: [writeup],
        ai_review: null,
        ai_review_generated_at: null,
      });
    }
  }

  // Sort writeups within each season by original_order
  for (const season of byYear.values()) {
    season.writeups.sort((a, b) => {
      const orderA = a.original_order ?? 999;
      const orderB = b.original_order ?? 999;
      return orderA - orderB;
    });
  }

  // Convert to array and sort by year descending
  // Only include seasons that have writeups OR an AI review
  return Array.from(byYear.values())
    .filter(s => s.writeups.length > 0 || s.ai_review)
    .sort((a, b) => b.season_year - a.season_year);
}

/**
 * Get writeups for a specific season
 *
 * @param year - Season year
 * @returns Array of writeups for that season
 */
export async function getWriteupsForSeason(year: number): Promise<WriteupWithDetails[]> {
  const supabase = await getUntypedClient();

  // First get the season ID
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', year)
    .single();

  if (!season) {
    return [];
  }

  const { data, error } = await supabase
    .from('writeups')
    .select(`
      id,
      title,
      content,
      excerpt,
      season_id,
      week,
      writeup_type,
      author_id,
      status,
      published_at,
      is_featured,
      imported_from,
      original_order,
      created_at,
      updated_at,
      author:members!author_id(id, display_name, avatar_url),
      season:seasons!season_id(id, year)
    `)
    .eq('season_id', season.id)
    .eq('status', 'published')
    .order('original_order', { ascending: true });

  if (error) {
    console.error('[getWriteupsForSeason] Error:', error);
    return [];
  }

  return (data || []).map(transformWriteup);
}

/**
 * Get writeups by type
 *
 * @param type - Writeup type (weekly_recap, playoff_preview, etc)
 * @returns Array of writeups of that type
 */
export async function getWriteupsByType(type: WriteupType): Promise<WriteupWithDetails[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeups')
    .select(`
      id,
      title,
      content,
      excerpt,
      season_id,
      week,
      writeup_type,
      author_id,
      status,
      published_at,
      is_featured,
      imported_from,
      original_order,
      created_at,
      updated_at,
      author:members!author_id(id, display_name, avatar_url),
      season:seasons!season_id(id, year)
    `)
    .eq('writeup_type', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[getWriteupsByType] Error:', error);
    return [];
  }

  return (data || []).map(transformWriteup);
}

/**
 * Get featured writeups (for homepage display)
 *
 * @param limit - Maximum number to return
 * @returns Array of featured writeups
 */
export async function getFeaturedWriteups(limit: number = 3): Promise<WriteupWithDetails[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeups')
    .select(`
      id,
      title,
      content,
      excerpt,
      season_id,
      week,
      writeup_type,
      author_id,
      status,
      published_at,
      is_featured,
      imported_from,
      original_order,
      created_at,
      updated_at,
      author:members!author_id(id, display_name, avatar_url),
      season:seasons!season_id(id, year)
    `)
    .eq('is_featured', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getFeaturedWriteups] Error:', error);
    return [];
  }

  return (data || []).map(transformWriteup);
}

/**
 * Search writeups using full-text search
 *
 * @param query - Search query string
 * @returns Array of search results ranked by relevance
 */
export async function searchWriteups(query: string): Promise<WriteupSearchResult[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase.rpc('search_writeups', {
    search_query: query,
  });

  if (error) {
    console.error('[searchWriteups] Error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    excerpt: row.excerpt as string | null,
    season_year: row.season_year as number | null,
    writeup_type: row.writeup_type as WriteupType,
    published_at: row.published_at as string | null,
    rank: row.rank as number,
  }));
}

/**
 * Get writeup stats for display
 *
 * @returns Summary stats about writeups
 */
export async function getWriteupStats(): Promise<{
  total: number;
  byType: Record<WriteupType, number>;
  bySeason: Record<number, number>;
  seasonsCovered: number;
}> {
  const writeups = await getAllWriteups();

  const byType: Record<string, number> = {};
  const bySeason: Record<number, number> = {};

  for (const w of writeups) {
    // Count by type
    byType[w.writeup_type] = (byType[w.writeup_type] || 0) + 1;

    // Count by season
    const year = w.season?.year ?? 0;
    if (year > 0) {
      bySeason[year] = (bySeason[year] || 0) + 1;
    }
  }

  return {
    total: writeups.length,
    byType: byType as Record<WriteupType, number>,
    bySeason,
    seasonsCovered: Object.keys(bySeason).length,
  };
}

/**
 * Transform raw database row to WriteupWithDetails
 */
function transformWriteup(row: Record<string, unknown>): WriteupWithDetails {
  const author = row.author as { id: string; display_name: string; avatar_url: string | null } | null;
  const season = row.season as { id: string; year: number } | null;

  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    excerpt: row.excerpt as string | null,
    season_id: row.season_id as string | null,
    week: row.week as number | null,
    writeup_type: row.writeup_type as WriteupType,
    author_id: row.author_id as string,
    status: row.status as 'draft' | 'published' | 'archived',
    published_at: row.published_at as string | null,
    is_featured: row.is_featured as boolean,
    imported_from: row.imported_from as string | null,
    original_order: row.original_order as number | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: author ?? {
      id: row.author_id as string,
      display_name: 'Unknown',
      avatar_url: null,
    },
    season: season,
  };
}
