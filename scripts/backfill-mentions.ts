/**
 * Backfill Writeup Mentions Script
 * Sprint 2.4: Populate writeup_mentions table with detected member names
 *
 * Usage:
 *   npx tsx scripts/backfill-mentions.ts          # Dry run (preview)
 *   npx tsx scripts/backfill-mentions.ts --run    # Actually save mentions
 *   npx tsx scripts/backfill-mentions.ts --verbose # Show detailed output
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
import { detectUniqueMentions, type MemberNameEntry, type DetectedMention } from '../src/lib/mentions/detect-mentions';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--run');
const verbose = args.includes('--verbose') || args.includes('-v');

// Supabase client (standalone, not using Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('='.repeat(60));
  console.log('  BACKFILL WRITEUP MENTIONS');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (use --run to save)' : 'LIVE - Saving to database'}`);
  console.log('');

  // Get all active members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, display_name')
    .is('merged_into_id', null);

  if (membersError || !members) {
    console.error('Error fetching members:', membersError);
    process.exit(1);
  }

  console.log(`Found ${members.length} active members`);

  // Get all published writeups
  const { data: writeups, error: writeupsError } = await supabase
    .from('writeups')
    .select('id, title, content, season:seasons!season_id(year)')
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (writeupsError || !writeups) {
    console.error('Error fetching writeups:', writeupsError);
    process.exit(1);
  }

  console.log(`Found ${writeups.length} published writeups`);
  console.log('');

  const memberEntries: MemberNameEntry[] = members.map((m) => ({
    id: m.id,
    display_name: m.display_name,
  }));

  // Track statistics
  let totalMentions = 0;
  let writeupsWithMentions = 0;
  const memberMentionCounts: Record<string, number> = {};

  // Process each writeup
  for (const writeup of writeups) {
    const season = writeup.season as { year: number } | null;
    const yearLabel = season?.year ?? 'N/A';

    const mentions = detectUniqueMentions(writeup.content, memberEntries);

    if (mentions.length > 0) {
      writeupsWithMentions++;
      totalMentions += mentions.length;

      // Track per-member counts
      for (const mention of mentions) {
        memberMentionCounts[mention.memberName] = (memberMentionCounts[mention.memberName] || 0) + 1;
      }

      if (verbose) {
        console.log(`[${yearLabel}] "${writeup.title}"`);
        console.log(`   ${mentions.length} mentions: ${mentions.map(m => m.memberName).join(', ')}`);
        for (const m of mentions) {
          console.log(`     - ${m.memberName} (matched "${m.matchedText}")`);
          console.log(`       Context: "${m.context}"`);
        }
        console.log('');
      }

      // Save to database if not dry run
      if (!dryRun) {
        const rows = mentions.map(m => ({
          writeup_id: writeup.id,
          member_id: m.memberId,
          mention_context: m.context,
        }));

        const { error: upsertError } = await supabase
          .from('writeup_mentions')
          .upsert(rows, {
            onConflict: 'writeup_id,member_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`  Error saving mentions for "${writeup.title}":`, upsertError.message);
        }
      }
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`Writeups processed: ${writeups.length}`);
  console.log(`Writeups with mentions: ${writeupsWithMentions}`);
  console.log(`Total mentions found: ${totalMentions}`);
  console.log('');

  // Top mentioned members
  const sortedMembers = Object.entries(memberMentionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('Top 10 Most Mentioned Members:');
  for (let i = 0; i < sortedMembers.length; i++) {
    const [name, count] = sortedMembers[i];
    console.log(`  ${i + 1}. ${name}: ${count} mentions`);
  }
  console.log('');

  if (dryRun) {
    console.log('This was a DRY RUN. No data was saved.');
    console.log('Run with --run flag to save mentions to database.');
  } else {
    console.log(`Successfully saved ${totalMentions} mentions to database!`);
  }
}

main().catch(console.error);
