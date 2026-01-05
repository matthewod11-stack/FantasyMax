#!/usr/bin/env npx tsx
/**
 * Generate AI H2H Rivalry Recaps
 *
 * Uses Claude API to generate ESPN-style rivalry recaps for all H2H matchups.
 * Recaps are stored in the h2h_recaps table.
 *
 * Usage:
 *   npx tsx scripts/generate-h2h-recaps.ts
 *   npx tsx scripts/generate-h2h-recaps.ts --dry-run
 *   npx tsx scripts/generate-h2h-recaps.ts --member=<uuid>
 *   npx tsx scripts/generate-h2h-recaps.ts --force
 *   npx tsx scripts/generate-h2h-recaps.ts --limit=10
 *
 * Prerequisites:
 *   - Migration 20260101000001_h2h_recaps.sql applied
 *   - Environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configuration
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 500; // Reduced for shorter 3-4 sentence recaps
const TEMPERATURE = 0.85;

// Types
interface Member {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface H2HRecord {
  member_1_id: string;
  member_2_id: string;
  member_1_wins: number;
  member_2_wins: number;
  ties: number;
  member_1_points: number;
  member_2_points: number;
  total_matchups: number;
  last_matchup_date: string | null;
  member_1_streak: number;
}

interface Matchup {
  id: string;
  season_year: number;
  week: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  home_member_id: string;
  away_member_id: string;
  winner_team_id: string | null;
  is_playoff: boolean;
  is_championship: boolean;
}

interface ExistingRecap {
  member_1_id: string;
  member_2_id: string;
}

/**
 * Create Supabase client for CLI usage
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
 * Create Anthropic client
 */
function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Missing environment variable: ANTHROPIC_API_KEY required');
  }

  return new Anthropic({ apiKey });
}

/**
 * Fetch all members
 */
async function fetchMembers(
  supabase: ReturnType<typeof createClient>,
  activeOnly: boolean = false
): Promise<Map<string, Member>> {
  let query = supabase
    .from('members')
    .select('id, display_name, avatar_url, is_active')
    .is('merged_into_id', null);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  return new Map((data || []).map((m: Member) => [m.id, m]));
}

/**
 * Fetch all H2H records from materialized view
 */
async function fetchH2HRecords(
  supabase: ReturnType<typeof createClient>,
  targetMemberId?: string
): Promise<H2HRecord[]> {
  let query = supabase
    .from('mv_h2h_matrix')
    .select('*')
    .order('total_matchups', { ascending: false });

  if (targetMemberId) {
    query = query.or(`member_1_id.eq.${targetMemberId},member_2_id.eq.${targetMemberId}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch H2H records: ${error.message}`);
  }

  return data as H2HRecord[];
}

/**
 * Fetch existing recaps to skip
 */
async function fetchExistingRecaps(
  supabase: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('h2h_recaps')
    .select('member_1_id, member_2_id');

  if (error) {
    throw new Error(`Failed to fetch existing recaps: ${error.message}`);
  }

  const existingSet = new Set<string>();
  (data || []).forEach((r: ExistingRecap) => {
    existingSet.add(`${r.member_1_id}-${r.member_2_id}`);
  });

  return existingSet;
}

/**
 * Fetch matchup history between two members
 */
async function fetchMatchupHistory(
  supabase: ReturnType<typeof createClient>,
  member1Id: string,
  member2Id: string
): Promise<Matchup[]> {
  const { data, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      winner_team_id,
      is_playoff,
      is_championship,
      home_team:teams!matchups_home_team_id_fkey(member_id),
      away_team:teams!matchups_away_team_id_fkey(member_id),
      season:seasons(year)
    `)
    .eq('status', 'final')
    .order('season(year)', { ascending: false })
    .order('week', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch matchup history: ${error.message}`);
  }

  // Filter to matchups between these two members
  interface RawMatchup {
    id: string;
    week: number;
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
    winner_team_id: string | null;
    is_playoff: boolean;
    is_championship: boolean;
    home_team: { member_id: string } | null;
    away_team: { member_id: string } | null;
    season: { year: number } | null;
  }

  const matchups = (data || [])
    .filter((m: RawMatchup) => {
      const homeId = m.home_team?.member_id;
      const awayId = m.away_team?.member_id;
      return (
        (homeId === member1Id && awayId === member2Id) ||
        (homeId === member2Id && awayId === member1Id)
      );
    })
    .map((m: RawMatchup) => ({
      id: m.id,
      season_year: m.season?.year || 0,
      week: m.week,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score,
      away_score: m.away_score,
      home_member_id: m.home_team?.member_id || '',
      away_member_id: m.away_team?.member_id || '',
      winner_team_id: m.winner_team_id,
      is_playoff: m.is_playoff,
      is_championship: m.is_championship,
    }));

  return matchups;
}

/**
 * Calculate notable matchups for the prompt
 */
function calculateNotableMatchups(
  matchups: Matchup[],
  member1Id: string,
  member1Name: string,
  member2Name: string
): string {
  if (matchups.length === 0) return 'No matchups recorded.';

  const highlights: string[] = [];
  let highestScore = { score: 0, who: '', opponent: '', week: 0, year: 0 };
  let biggestBlowout = { margin: 0, winner: '', loser: '', week: 0, year: 0 };
  let closestGame = { margin: Infinity, week: 0, year: 0, score1: 0, score2: 0 };
  const playoffs: string[] = [];
  const championships: string[] = [];

  for (const m of matchups) {
    const isMember1Home = m.home_member_id === member1Id;
    const member1Score = isMember1Home ? m.home_score : m.away_score;
    const member2Score = isMember1Home ? m.away_score : m.home_score;
    const margin = Math.abs(member1Score - member2Score);
    const member1Won = member1Score > member2Score;

    // Track highest individual score
    if (member1Score > highestScore.score) {
      highestScore = {
        score: member1Score,
        who: member1Name,
        opponent: member2Name,
        week: m.week,
        year: m.season_year,
      };
    }
    if (member2Score > highestScore.score) {
      highestScore = {
        score: member2Score,
        who: member2Name,
        opponent: member1Name,
        week: m.week,
        year: m.season_year,
      };
    }

    // Track biggest blowout
    if (margin > biggestBlowout.margin) {
      biggestBlowout = {
        margin,
        winner: member1Won ? member1Name : member2Name,
        loser: member1Won ? member2Name : member1Name,
        week: m.week,
        year: m.season_year,
      };
    }

    // Track closest game
    if (margin < closestGame.margin && margin > 0) {
      closestGame = {
        margin,
        week: m.week,
        year: m.season_year,
        score1: member1Score,
        score2: member2Score,
      };
    }

    // Track playoff/championship meetings
    if (m.is_championship) {
      const winner = member1Won ? member1Name : member2Name;
      championships.push(`${m.season_year}: ${winner} won the championship (${member1Score.toFixed(1)}-${member2Score.toFixed(1)})`);
    } else if (m.is_playoff) {
      const winner = member1Won ? member1Name : member2Name;
      playoffs.push(`${m.season_year} Week ${m.week}: ${winner} won (${member1Score.toFixed(1)}-${member2Score.toFixed(1)})`);
    }
  }

  // Build highlights
  if (championships.length > 0) {
    highlights.push(`**Championship Meetings (${championships.length}):**\n${championships.join('\n')}`);
  }

  if (playoffs.length > 0) {
    highlights.push(`**Playoff Meetings (${playoffs.length}):**\n${playoffs.slice(0, 3).join('\n')}`);
  }

  if (highestScore.score > 0) {
    highlights.push(
      `**Highest Score in Rivalry:** ${highestScore.who} scored ${highestScore.score.toFixed(1)} points in Week ${highestScore.week}, ${highestScore.year}`
    );
  }

  if (biggestBlowout.margin > 0) {
    highlights.push(
      `**Biggest Blowout:** ${biggestBlowout.winner} defeated ${biggestBlowout.loser} by ${biggestBlowout.margin.toFixed(1)} points in Week ${biggestBlowout.week}, ${biggestBlowout.year}`
    );
  }

  if (closestGame.margin < Infinity) {
    highlights.push(
      `**Closest Game:** Decided by just ${closestGame.margin.toFixed(1)} points (${closestGame.score1.toFixed(1)}-${closestGame.score2.toFixed(1)}) in Week ${closestGame.week}, ${closestGame.year}`
    );
  }

  // Add recent matchups (last 5)
  const recent = matchups.slice(0, 5);
  if (recent.length > 0) {
    const recentText = recent
      .map((m) => {
        const isMember1Home = m.home_member_id === member1Id;
        const member1Score = isMember1Home ? m.home_score : m.away_score;
        const member2Score = isMember1Home ? m.away_score : m.home_score;
        const winner = member1Score > member2Score ? member1Name : member2Name;
        const playoffTag = m.is_championship ? ' 🏆' : m.is_playoff ? ' (Playoff)' : '';
        return `  ${m.season_year} Week ${m.week}: ${winner} won ${member1Score.toFixed(1)}-${member2Score.toFixed(1)}${playoffTag}`;
      })
      .join('\n');
    highlights.push(`**Recent Matchups:**\n${recentText}`);
  }

  return highlights.join('\n\n');
}

/**
 * Determine rivalry type and description
 */
function getRivalryDescription(
  member1Wins: number,
  member2Wins: number,
  totalMatchups: number,
  member1Name: string,
  member2Name: string
): string {
  const winDiff = member1Wins - member2Wins;

  if (Math.abs(winDiff) <= 1 && totalMatchups >= 5) {
    return `This is a TRUE RIVALRY - nearly dead even at ${member1Wins}-${member2Wins} after ${totalMatchups} matchups.`;
  } else if (winDiff >= 5) {
    return `${member1Name} DOMINATES this rivalry at ${member1Wins}-${member2Wins}. ${member2Name} is the clear victim.`;
  } else if (winDiff <= -5) {
    return `${member2Name} DOMINATES this rivalry at ${member2Wins}-${member1Wins}. ${member1Name} is the clear victim.`;
  } else if (winDiff >= 3) {
    return `${member1Name} leads this rivalry ${member1Wins}-${member2Wins}, but ${member2Name} keeps it competitive.`;
  } else if (winDiff <= -3) {
    return `${member2Name} leads this rivalry ${member2Wins}-${member1Wins}, but ${member1Name} keeps it competitive.`;
  } else {
    return `A competitive matchup at ${member1Wins}-${member2Wins} after ${totalMatchups} meetings.`;
  }
}

/**
 * Build the AI prompt for a rivalry
 */
function buildPrompt(
  member1: Member,
  member2: Member,
  record: H2HRecord,
  matchups: Matchup[]
): string {
  const member1Name = member1.display_name;
  const member2Name = member2.display_name;

  // Get stats from correct perspective (member_1_id < member_2_id in view)
  const isMember1First = member1.id === record.member_1_id;
  const member1Wins = isMember1First ? record.member_1_wins : record.member_2_wins;
  const member2Wins = isMember1First ? record.member_2_wins : record.member_1_wins;
  const member1Points = isMember1First ? record.member_1_points : record.member_2_points;
  const member2Points = isMember1First ? record.member_2_points : record.member_1_points;
  const streak = isMember1First ? record.member_1_streak : -record.member_1_streak;

  // Calculate streak description
  let streakDesc = 'No current streak';
  if (streak > 0) {
    streakDesc = `${member1Name} is on a ${streak}-game winning streak`;
  } else if (streak < 0) {
    streakDesc = `${member2Name} is on a ${Math.abs(streak)}-game winning streak`;
  }

  // Get rivalry description
  const rivalryDesc = getRivalryDescription(
    member1Wins,
    member2Wins,
    record.total_matchups,
    member1Name,
    member2Name
  );

  // Get notable matchups
  const notableMatchups = calculateNotableMatchups(matchups, member1.id, member1Name, member2Name);

  return `You are an ESPN fantasy football analyst covering "Matt OD's League of Degenerates" fantasy league. Write a BRIEF rivalry recap for ${member1Name} vs ${member2Name}.

## Stats
- Record: ${member1Wins}-${member2Wins} (${record.total_matchups} matchups)
- ${streakDesc}
- ${rivalryDesc}

## Notable Matchups (pick ONE to reference)
${notableMatchups}

## Instructions
Write exactly 3-4 sentences (50-75 words max) in ESPN broadcast style:
1. State who dominates or if it's a true rivalry
2. Reference ONE specific memorable matchup with the score
3. End with current momentum or what's at stake

Keep it punchy and dramatic. No headers, no bullet points - just flowing prose.

After the recap, write "---PREVIEW---" followed by ONE sentence capturing the rivalry's essence.`;
}

/**
 * Generate recap using Claude
 */
async function generateRecap(
  client: Anthropic,
  prompt: string
): Promise<{ recap: string; preview: string; model: string }> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const fullText = textBlock.text;

  // Split on the preview marker
  const parts = fullText.split('---PREVIEW---');
  const recap = parts[0].trim();
  const preview = parts[1]?.trim() || recap.slice(0, 200) + '...';

  return { recap, preview, model: response.model };
}

/**
 * Save recap to database
 */
async function saveRecap(
  supabase: ReturnType<typeof createClient>,
  member1Id: string,
  member2Id: string,
  recap: string,
  preview: string,
  model: string
) {
  // Ensure consistent ordering (member_1_id < member_2_id)
  const [lowerId, higherId] = member1Id < member2Id ? [member1Id, member2Id] : [member2Id, member1Id];

  const { error } = await supabase.from('h2h_recaps').upsert(
    {
      member_1_id: lowerId,
      member_2_id: higherId,
      ai_recap: recap,
      ai_recap_preview: preview,
      ai_recap_model: model,
      ai_recap_generated_at: new Date().toISOString(),
    },
    {
      onConflict: 'member_1_id,member_2_id',
    }
  );

  if (error) {
    throw new Error(`Failed to save recap: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const activeOnly = process.argv.includes('--active-only');
  const memberArg = process.argv.find((arg) => arg.startsWith('--member='));
  const targetMemberId = memberArg ? memberArg.split('=')[1] : undefined;
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('=== FantasyMax AI H2H Recap Generator ===\n');

  if (isDryRun) {
    console.log('[DRY RUN MODE - No changes will be made]\n');
  }

  if (activeOnly) {
    console.log('[ACTIVE MEMBERS ONLY - Filtering to active member pairs]\n');
  }

  if (targetMemberId) {
    console.log(`Target member: ${targetMemberId}\n`);
  }

  if (limit) {
    console.log(`Limit: ${limit} recaps\n`);
  }

  // Create clients
  const supabase = createSupabaseClient();
  console.log('✓ Connected to Supabase');

  const anthropic = createAnthropicClient();
  console.log('✓ Anthropic client ready\n');

  // Fetch data
  console.log('Fetching members...');
  const members = await fetchMembers(supabase, activeOnly);
  console.log(`  Found ${members.size} members${activeOnly ? ' (active only)' : ''}`);

  console.log('Fetching H2H records...');
  const h2hRecords = await fetchH2HRecords(supabase, targetMemberId);
  console.log(`  Found ${h2hRecords.length} rivalry pairs`);

  console.log('Fetching existing recaps...');
  const existingRecaps = await fetchExistingRecaps(supabase);
  console.log(`  Found ${existingRecaps.size} existing recaps\n`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  let processed = 0;

  for (const record of h2hRecords) {
    // Check limit
    if (limit && generated >= limit) {
      console.log(`\nReached limit of ${limit} recaps. Stopping.`);
      break;
    }

    const member1 = members.get(record.member_1_id);
    const member2 = members.get(record.member_2_id);

    if (!member1 || !member2) {
      console.log(`Skipping ${record.member_1_id} vs ${record.member_2_id} - member not found`);
      skipped++;
      continue;
    }

    const pairKey = `${record.member_1_id}-${record.member_2_id}`;
    processed++;

    console.log(`\n[${processed}/${h2hRecords.length}] ${member1.display_name} vs ${member2.display_name}`);
    console.log(`  Record: ${record.member_1_wins}-${record.member_2_wins} (${record.total_matchups} matchups)`);

    // Check if already has recap
    if (existingRecaps.has(pairKey) && !force) {
      console.log('  ⏭ Already has recap. Use --force to regenerate.');
      skipped++;
      continue;
    }

    // Fetch matchup history
    console.log('  Fetching matchup history...');
    const matchups = await fetchMatchupHistory(supabase, record.member_1_id, record.member_2_id);
    console.log(`  Found ${matchups.length} matchups`);

    // Build prompt
    const prompt = buildPrompt(member1, member2, record, matchups);

    if (isDryRun) {
      console.log('\n  [Dry run] Would generate recap with prompt:');
      console.log('  ' + prompt.split('\n').slice(0, 8).join('\n  ') + '...');
      generated++;
      continue;
    }

    // Generate recap
    console.log('  Generating AI recap...');
    try {
      const { recap, preview, model } = await generateRecap(anthropic, prompt);
      console.log(`  Generated ${recap.length} chars (preview: ${preview.length} chars) using ${model}`);

      // Save to database
      console.log('  Saving to database...');
      await saveRecap(supabase, record.member_1_id, record.member_2_id, recap, preview, model);
      console.log('  ✓ Saved successfully');

      generated++;

      // Rate limiting - wait 1.5 seconds between API calls
      if (h2hRecords.indexOf(record) < h2hRecords.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      errors++;
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total pairs: ${h2hRecords.length}`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
