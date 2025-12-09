#!/usr/bin/env npx tsx
/**
 * Seed Historical Writeups
 *
 * Imports parsed writeups from writeups.json into the Supabase `writeups` table.
 * Run after applying the writeups migration.
 *
 * Usage:
 *   npx tsx scripts/seed-writeups.ts
 *   npx tsx scripts/seed-writeups.ts --dry-run
 *
 * Prerequisites:
 *   - writeups.json exists (run parse-writeups.ts first)
 *   - Supabase migration 20241208000001_writeups_table.sql applied
 *   - Environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Types matching the parsed JSON structure
interface ParsedWriteup {
  title: string;
  content: string;
  season_year: number;
  week: number | null;
  writeup_type: string;
  original_order: number;
}

// Season year to UUID mapping (from database query)
const SEASON_MAP: Record<number, string> = {
  2015: '47d66b06-4147-4a23-b5f8-8684ac8ef3b0',
  2016: '7b68175e-1879-45fe-84d2-8193756e27c4',
  2017: 'fdc14297-e8d3-4666-9744-1111184f808f',
  2018: 'b10d91ad-4e71-4fee-b5b5-1a071b6819eb',
  2019: '0ec50702-6a1d-49af-8606-dbfc8ace92ff',
  2020: '13af4af3-2a39-45ed-9851-4cf69004cb83',
  2021: 'ebed5879-9347-420a-9803-398d7e191ae7',
  2022: 'ece24167-9a0e-4e23-8829-20a5a44a3394',
  2023: '47d71cb0-62c8-453e-ba71-26b07c81e58a',
  2024: '8fcda932-3973-4032-96fc-9edc3e10351f',
};

// Commissioner member ID (author of all historical writeups)
const COMMISSIONER_ID = 'c2b4f7d5-c2c0-427e-aaee-f648d5a4995d';

// Batch size for inserts
const BATCH_SIZE = 25;

/**
 * Create a standalone Supabase client for CLI usage
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Transform parsed writeup to database row format
 */
function toDbRow(writeup: ParsedWriteup) {
  const seasonId = SEASON_MAP[writeup.season_year];

  if (!seasonId) {
    console.warn(`  Warning: No season found for year ${writeup.season_year}`);
  }

  return {
    title: writeup.title,
    content: writeup.content,
    season_id: seasonId || null,
    week: writeup.week,
    writeup_type: writeup.writeup_type,
    author_id: COMMISSIONER_ID,
    status: 'published',
    published_at: new Date().toISOString(),
    is_featured: false,
    imported_from: 'alltimewriteups.md',
    original_order: writeup.original_order,
  };
}

/**
 * Insert writeups in batches
 */
async function insertWriteups(
  supabase: ReturnType<typeof createClient>,
  writeups: ParsedWriteup[],
  isDryRun: boolean
) {
  const total = writeups.length;
  let inserted = 0;
  let errors = 0;

  console.log(`\nInserting ${total} writeups in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < writeups.length; i += BATCH_SIZE) {
    const batch = writeups.slice(i, i + BATCH_SIZE);
    const rows = batch.map(toDbRow);

    if (isDryRun) {
      console.log(`  [Dry run] Would insert batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      inserted += batch.length;
      continue;
    }

    const { data, error } = await supabase.from('writeups').insert(rows).select('id');

    if (error) {
      console.error(`  Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data?.length || 0;
      process.stdout.write(`  Inserted: ${inserted}/${total}\r`);
    }
  }

  console.log(`\n\nResults:`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);

  return { inserted, errors };
}

/**
 * Check if writeups table exists and is empty
 */
async function checkTable(supabase: ReturnType<typeof createClient>) {
  const { count, error } = await supabase
    .from('writeups')
    .select('*', { count: 'exact', head: true });

  if (error) {
    if (error.code === '42P01') {
      throw new Error(
        'Table "writeups" does not exist. Run migration 20241208000001_writeups_table.sql first.'
      );
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return count || 0;
}

/**
 * Main execution
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  console.log('=== FantasyMax Writeups Seeder ===\n');

  if (isDryRun) {
    console.log('[DRY RUN MODE - No changes will be made]\n');
  }

  // Load writeups JSON
  const inputPath = path.join(process.cwd(), 'scripts', 'output', 'writeups.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: ${inputPath} not found.`);
    console.error('Run "npx tsx scripts/parse-writeups.ts" first.');
    process.exit(1);
  }

  const writeups: ParsedWriteup[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${writeups.length} writeups from JSON`);

  // Summary by season
  const bySeason: Record<number, number> = {};
  for (const w of writeups) {
    bySeason[w.season_year] = (bySeason[w.season_year] || 0) + 1;
  }
  console.log('\nWriteups by season:');
  for (const year of Object.keys(bySeason).sort()) {
    const seasonId = SEASON_MAP[parseInt(year)];
    const status = seasonId ? '✓' : '✗';
    console.log(`  ${year}: ${bySeason[parseInt(year)]} ${status}`);
  }

  // Create Supabase client
  const supabase = createSupabaseClient();
  console.log('\nConnected to Supabase');

  // Check table status
  const existingCount = await checkTable(supabase);

  if (existingCount > 0 && !force) {
    console.log(`\nTable already has ${existingCount} writeups.`);
    console.log('Use --force to clear and re-import, or manually clear the table.');
    process.exit(1);
  }

  if (existingCount > 0 && force) {
    console.log(`\nClearing ${existingCount} existing writeups...`);
    if (!isDryRun) {
      const { error } = await supabase.from('writeups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error('Error clearing table:', error.message);
        process.exit(1);
      }
    }
    console.log('Table cleared.');
  }

  // Insert writeups
  const { inserted, errors } = await insertWriteups(supabase, writeups, isDryRun);

  if (errors > 0) {
    console.log('\nSome errors occurred during import. Check logs above.');
    process.exit(1);
  }

  console.log('\nWriteups import complete!');

  if (!isDryRun) {
    // Verify the import
    const { count: finalCount } = await supabase
      .from('writeups')
      .select('*', { count: 'exact', head: true });
    console.log(`Final count in database: ${finalCount}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
