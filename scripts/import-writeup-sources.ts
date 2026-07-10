#!/usr/bin/env npx tsx

import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import type { Database } from '../src/types/database.types';
import {
  loadWriteupSources,
  resolveCommissionerAuthor,
  type WriteupSource,
} from './lib/writeup-source-archive';

dotenv.config({ path: '.env.local' });

type SupabaseClient = ReturnType<typeof createClient<Database>>;
type WriteupInsert = Database['public']['Tables']['writeups']['Insert'];

interface ImportContext {
  authorId: string;
  authorName: string;
  seasonId: string;
  baselineCount: number;
  existingBySourceKey: Map<string, string>;
}

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function parseTargetYear(args: string[]): number {
  const yearArg = args.find((arg) => arg.startsWith('--year='));
  if (!yearArg) {
    throw new Error('Usage: npm run writeups:import -- --year=2025 [--run]');
  }

  const year = Number(yearArg.split('=')[1]);
  if (!Number.isInteger(year) || year < 2015 || year > 2100) {
    throw new Error(`Invalid --year value: ${yearArg}`);
  }
  return year;
}

async function loadImportContext(
  supabase: SupabaseClient,
  year: number,
  sourceKeys: string[],
): Promise<ImportContext> {
  const { data: leagues, error: leagueError } = await supabase
    .from('league')
    .select('id');

  if (leagueError) throw new Error(`Failed to load league: ${leagueError.message}`);
  if (!leagues || leagues.length !== 1) {
    throw new Error(`Expected exactly one league, found ${leagues?.length ?? 0}`);
  }

  const { data: seasons, error: seasonError } = await supabase
    .from('seasons')
    .select('id, year')
    .eq('league_id', leagues[0].id)
    .eq('year', year);

  if (seasonError) throw new Error(`Failed to load ${year} season: ${seasonError.message}`);
  if (!seasons || seasons.length !== 1) {
    throw new Error(`Expected exactly one ${year} season, found ${seasons?.length ?? 0}`);
  }

  const { data: authors, error: authorError } = await supabase
    .from('members')
    .select('id, display_name')
    .eq('role', 'commissioner')
    .is('merged_into_id', null);

  if (authorError) throw new Error(`Failed to load commissioner: ${authorError.message}`);

  const { data: existingAuthorship, error: authorshipError } = await supabase
    .from('writeups')
    .select('author_id');

  if (authorshipError) {
    throw new Error(`Failed to inspect existing writeup authorship: ${authorshipError.message}`);
  }

  const author = resolveCommissionerAuthor(
    authors ?? [],
    (existingAuthorship ?? []).map((writeup) => writeup.author_id),
  );

  const { count: baselineCount, error: countError } = await supabase
    .from('writeups')
    .select('id', { count: 'exact', head: true });

  if (countError) throw new Error(`Failed to count writeups: ${countError.message}`);

  const { data: existing, error: existingError } = await supabase
    .from('writeups')
    .select('id, source_key')
    .in('source_key', sourceKeys);

  if (existingError) {
    throw new Error(
      `Failed to inspect existing source keys. Apply the source identity migration first: ${existingError.message}`,
    );
  }

  return {
    authorId: author.id,
    authorName: author.display_name,
    seasonId: seasons[0].id,
    baselineCount: baselineCount ?? 0,
    existingBySourceKey: new Map(
      (existing ?? []).flatMap((row) => (
        row.source_key ? [[row.source_key, row.id] as const] : []
      )),
    ),
  };
}

function toDbRow(
  source: WriteupSource,
  context: Pick<ImportContext, 'authorId' | 'seasonId'>,
): WriteupInsert {
  return {
    author_id: context.authorId,
    content: source.content,
    imported_from: source.source_path,
    is_featured: false,
    original_order: source.original_order,
    season_id: context.seasonId,
    source_key: source.source_key,
    source_published_on: source.published_date,
    status: 'published',
    title: source.title,
    week: source.week,
    writeup_type: source.writeup_type,
  };
}

async function verifyImportedSources(
  supabase: SupabaseClient,
  sourceKeys: string[],
  expectedTotalCount: number,
): Promise<void> {
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase.from('writeups').select('id, source_key').in('source_key', sourceKeys),
    supabase.from('writeups').select('id', { count: 'exact', head: true }),
  ]);

  if (error) throw new Error(`Failed to verify imported sources: ${error.message}`);
  if (countError) throw new Error(`Failed to verify writeup count: ${countError.message}`);
  if (!data || data.length !== sourceKeys.length) {
    throw new Error(`Expected ${sourceKeys.length} source rows after import, found ${data?.length ?? 0}`);
  }
  if (count !== expectedTotalCount) {
    throw new Error(`Expected ${expectedTotalCount} total writeups after import, found ${count ?? 0}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const year = parseTargetYear(args);
  const isLiveRun = args.includes('--run');
  const sourceDirectory = path.join(process.cwd(), 'docs', 'writeups', String(year));
  const sources = loadWriteupSources(sourceDirectory);

  if (sources.some((source) => source.season !== year)) {
    throw new Error(`Source directory ${sourceDirectory} contains a different season`);
  }

  const sourceKeys = sources.map((source) => source.source_key);
  const supabase = createSupabaseClient();
  const context = await loadImportContext(supabase, year, sourceKeys);
  const inserts = sources.filter((source) => !context.existingBySourceKey.has(source.source_key));
  const updates = sources.filter((source) => context.existingBySourceKey.has(source.source_key));

  console.log('=== Source-First Writeup Importer ===');
  console.log(`Mode: ${isLiveRun ? 'LIVE UPSERT' : 'DRY RUN'}`);
  console.log(`Season: ${year} (${context.seasonId})`);
  console.log(`Author: ${context.authorName} (${context.authorId})`);
  console.log(`Validated sources: ${sources.length}`);
  console.log(`Existing writeups: ${context.baselineCount}`);
  console.log(`Planned inserts: ${inserts.length}`);
  console.log(`Planned updates: ${updates.length}`);

  if (!isLiveRun) {
    console.log('No database rows changed. Re-run with --run after reviewing this plan.');
    return;
  }

  const rows = sources.map((source) => toDbRow(source, context));
  const { data, error } = await supabase
    .from('writeups')
    .upsert(rows, { onConflict: 'source_key' })
    .select('id, source_key');

  if (error) throw new Error(`Source upsert failed: ${error.message}`);
  if (!data || data.length !== sources.length) {
    throw new Error(`Expected ${sources.length} upserted rows, received ${data?.length ?? 0}`);
  }

  await verifyImportedSources(
    supabase,
    sourceKeys,
    context.baselineCount + inserts.length,
  );

  console.log(`Import verified: ${sources.length} source rows, no deletes, no duplicates.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
