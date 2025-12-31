#!/usr/bin/env npx tsx
/**
 * Generate AI Season Reviews
 *
 * Uses Claude API to generate sportswriter-style season reviews for all seasons.
 * Reviews are stored in the seasons.ai_review column.
 *
 * Usage:
 *   npx tsx scripts/generate-ai-reviews.ts
 *   npx tsx scripts/generate-ai-reviews.ts --dry-run
 *   npx tsx scripts/generate-ai-reviews.ts --year=2024
 *   npx tsx scripts/generate-ai-reviews.ts --year=2024 --force
 *
 * Prerequisites:
 *   - Migration 20241231000001_ai_season_reviews.sql applied
 *   - Environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configuration
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;
const TEMPERATURE = 0.85;

// Types
interface Season {
  id: string;
  year: number;
  name: string | null;
  num_teams: number;
  num_weeks: number;
  ai_review: string | null;
  champion_team: TeamWithMember | null;
  last_place_team: TeamWithMember | null;
}

interface TeamWithMember {
  id: string;
  team_name: string;
  final_record_wins: number;
  final_record_losses: number;
  final_record_ties: number;
  total_points_for: number;
  member: { id: string; display_name: string } | null;
}

interface Team {
  id: string;
  team_name: string;
  final_rank: number;
  final_record_wins: number;
  final_record_losses: number;
  final_record_ties: number;
  total_points_for: number;
  total_points_against: number;
  is_champion: boolean;
  is_last_place: boolean;
  made_playoffs: boolean;
  playoff_seed: number | null;
  member: { id: string; display_name: string } | null;
}

interface Matchup {
  id: string;
  week: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  status: string;
  is_playoff: boolean;
  is_championship: boolean;
}

interface Writeup {
  title: string;
  content: string;
  writeup_type: string;
  week: number | null;
}

interface SeasonRecord {
  type: string;
  value: number;
  description: string;
  memberName: string;
  opponentName?: string;
  week: number;
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
 * Fetch all seasons with champion/last place info
 */
async function fetchSeasons(supabase: ReturnType<typeof createClient>, targetYear?: number) {
  let query = supabase
    .from('seasons')
    .select(`
      id,
      year,
      name,
      num_teams,
      num_weeks,
      ai_review,
      champion_team:teams!fk_champion_team(
        id, team_name, final_record_wins, final_record_losses, final_record_ties, total_points_for,
        member:members(id, display_name)
      ),
      last_place_team:teams!fk_last_place_team(
        id, team_name, final_record_wins, final_record_losses, final_record_ties,
        member:members(id, display_name)
      )
    `)
    .order('year', { ascending: true });

  if (targetYear) {
    query = query.eq('year', targetYear);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch seasons: ${error.message}`);
  }

  return data as Season[];
}

/**
 * Fetch teams for a season
 */
async function fetchTeams(supabase: ReturnType<typeof createClient>, seasonId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id, team_name, final_rank, final_record_wins, final_record_losses, final_record_ties,
      total_points_for, total_points_against, is_champion, is_last_place, made_playoffs, playoff_seed,
      member:members(id, display_name)
    `)
    .eq('season_id', seasonId)
    .order('final_rank', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }

  return data as Team[];
}

/**
 * Fetch matchups for a season
 */
async function fetchMatchups(supabase: ReturnType<typeof createClient>, seasonId: string) {
  const { data, error } = await supabase
    .from('matchups')
    .select(`
      id, week, home_team_id, away_team_id, home_score, away_score,
      winner_team_id, status, is_playoff, is_championship
    `)
    .eq('season_id', seasonId)
    .eq('status', 'final')
    .order('week', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch matchups: ${error.message}`);
  }

  return data as Matchup[];
}

/**
 * Fetch commissioner writeups for a season
 */
async function fetchWriteups(supabase: ReturnType<typeof createClient>, seasonId: string) {
  const { data, error } = await supabase
    .from('writeups')
    .select('title, content, writeup_type, week')
    .eq('season_id', seasonId)
    .eq('status', 'published')
    .order('original_order', { ascending: true });

  if (error) {
    console.warn(`  Warning: Could not fetch writeups: ${error.message}`);
    return [];
  }

  return data as Writeup[];
}

/**
 * Calculate season records from matchups
 */
function calculateSeasonRecords(matchups: Matchup[], teams: Team[]): SeasonRecord[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const records: SeasonRecord[] = [];

  let highScore = { score: 0, teamId: '', week: 0, oppId: '' };
  let lowScore = { score: Infinity, teamId: '', week: 0 };
  let biggestBlowout = { margin: 0, winnerId: '', loserId: '', week: 0 };
  let closestGame = { margin: Infinity, team1Id: '', team2Id: '', week: 0 };

  for (const m of matchups) {
    if (m.home_score === null || m.away_score === null) continue;

    // High/low scores
    if (m.home_score > highScore.score) {
      highScore = { score: m.home_score, teamId: m.home_team_id, week: m.week, oppId: m.away_team_id };
    }
    if (m.away_score > highScore.score) {
      highScore = { score: m.away_score, teamId: m.away_team_id, week: m.week, oppId: m.home_team_id };
    }
    if (m.home_score < lowScore.score && m.home_score > 0) {
      lowScore = { score: m.home_score, teamId: m.home_team_id, week: m.week };
    }
    if (m.away_score < lowScore.score && m.away_score > 0) {
      lowScore = { score: m.away_score, teamId: m.away_team_id, week: m.week };
    }

    // Margins
    const margin = Math.abs(m.home_score - m.away_score);
    if (margin > biggestBlowout.margin) {
      const winnerId = m.home_score > m.away_score ? m.home_team_id : m.away_team_id;
      const loserId = m.home_score > m.away_score ? m.away_team_id : m.home_team_id;
      biggestBlowout = { margin, winnerId, loserId, week: m.week };
    }
    if (margin < closestGame.margin && margin > 0) {
      closestGame = { margin, team1Id: m.home_team_id, team2Id: m.away_team_id, week: m.week };
    }
  }

  const getName = (teamId: string) => teamMap.get(teamId)?.member?.display_name || 'Unknown';

  if (highScore.score > 0) {
    records.push({
      type: 'high_score',
      value: highScore.score,
      description: `${highScore.score.toFixed(1)} points`,
      memberName: getName(highScore.teamId),
      opponentName: getName(highScore.oppId),
      week: highScore.week,
    });
  }

  if (lowScore.score < Infinity) {
    records.push({
      type: 'low_score',
      value: lowScore.score,
      description: `${lowScore.score.toFixed(1)} points`,
      memberName: getName(lowScore.teamId),
      week: lowScore.week,
    });
  }

  if (biggestBlowout.margin > 0) {
    records.push({
      type: 'biggest_blowout',
      value: biggestBlowout.margin,
      description: `Won by ${biggestBlowout.margin.toFixed(1)} points`,
      memberName: getName(biggestBlowout.winnerId),
      opponentName: getName(biggestBlowout.loserId),
      week: biggestBlowout.week,
    });
  }

  if (closestGame.margin < Infinity) {
    records.push({
      type: 'closest_game',
      value: closestGame.margin,
      description: `Decided by ${closestGame.margin.toFixed(1)} points`,
      memberName: getName(closestGame.team1Id),
      opponentName: getName(closestGame.team2Id),
      week: closestGame.week,
    });
  }

  return records;
}

/**
 * Build the AI prompt for a season
 */
function buildPrompt(
  season: Season,
  teams: Team[],
  records: SeasonRecord[],
  writeups: Writeup[]
): string {
  const champion = season.champion_team;
  const lastPlace = season.last_place_team;

  // Format standings table
  const standingsTable = teams
    .slice(0, 10) // Top 10
    .map((t, i) => {
      const record = `${t.final_record_wins}-${t.final_record_losses}${t.final_record_ties > 0 ? `-${t.final_record_ties}` : ''}`;
      const playoff = t.made_playoffs ? '(P)' : '';
      return `${i + 1}. ${t.member?.display_name || 'Unknown'} - ${record} ${playoff}`;
    })
    .join('\n');

  // Format records
  const recordsText = records
    .map((r) => {
      if (r.type === 'high_score') {
        return `- Highest Score: ${r.description} by ${r.memberName} (Week ${r.week})`;
      } else if (r.type === 'low_score') {
        return `- Lowest Score: ${r.description} by ${r.memberName} (Week ${r.week})`;
      } else if (r.type === 'biggest_blowout') {
        return `- Biggest Blowout: ${r.description} - ${r.memberName} over ${r.opponentName} (Week ${r.week})`;
      } else if (r.type === 'closest_game') {
        return `- Closest Game: ${r.description} - ${r.memberName} vs ${r.opponentName} (Week ${r.week})`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  // Format commissioner writeups as context (excerpts only)
  const writeupExcerpts = writeups
    .slice(0, 5) // Max 5 writeups for context
    .map((w) => {
      const excerpt = w.content.slice(0, 300).replace(/\n/g, ' ');
      return `[${w.writeup_type}${w.week ? ` Week ${w.week}` : ''}]: ${excerpt}...`;
    })
    .join('\n\n');

  const formatRecord = (t: TeamWithMember | null) => {
    if (!t) return 'Unknown';
    return `${t.final_record_wins}-${t.final_record_losses}${t.final_record_ties > 0 ? `-${t.final_record_ties}` : ''}`;
  };

  return `You are a veteran fantasy football sportswriter covering "Matt OD's League of Degenerates" - a long-running friends fantasy football league. Write an engaging 400-600 word season review for the ${season.year} season.

## Season Facts
- Year: ${season.year}
- Number of Teams: ${season.num_teams}
- Regular Season Weeks: ${season.num_weeks}
- Champion: ${champion?.member?.display_name || 'Unknown'} (${champion?.team_name || 'Unknown Team'}) - Record: ${formatRecord(champion)}, ${champion?.total_points_for?.toFixed(1) || '0'} total points
- Last Place: ${lastPlace?.member?.display_name || 'Unknown'} (${lastPlace?.team_name || 'Unknown Team'}) - Record: ${formatRecord(lastPlace)}

## Final Standings (Top 10)
${standingsTable}

## Season Records
${recordsText || 'No notable records available'}

${writeupExcerpts ? `## Commissioner Notes (for context and tone - do not quote directly)
${writeupExcerpts}` : ''}

## Writing Instructions
Write a narrative season review that:
1. Opens with a compelling hook about the season's defining moment or theme
2. Discusses the champion's journey and what made their season special
3. Mentions 2-3 notable storylines, rivalries, or dramatic moments
4. References specific matchups or records that shaped the season
5. Ends with a playful mention of the last place finisher and their Hall of Shame induction

Use a fun, slightly irreverent tone appropriate for a group of longtime friends who enjoy trash talk. Be specific with names and stats. Make it feel like a real sportswriter covering a league they know well.

Do NOT use generic phrases. Make it specific to this season's actual results.`;
}

/**
 * Generate review using Claude
 */
async function generateReview(
  client: Anthropic,
  prompt: string
): Promise<{ text: string; model: string }> {
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

  return { text: textBlock.text, model: response.model };
}

/**
 * Update season with AI review
 */
async function saveReview(
  supabase: ReturnType<typeof createClient>,
  seasonId: string,
  review: string,
  model: string
) {
  const { error } = await supabase
    .from('seasons')
    .update({
      ai_review: review,
      ai_review_generated_at: new Date().toISOString(),
      ai_review_model: model,
    })
    .eq('id', seasonId);

  if (error) {
    throw new Error(`Failed to save review: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const yearArg = process.argv.find((arg) => arg.startsWith('--year='));
  const targetYear = yearArg ? parseInt(yearArg.split('=')[1], 10) : undefined;

  console.log('=== FantasyMax AI Season Review Generator ===\n');

  if (isDryRun) {
    console.log('[DRY RUN MODE - No changes will be made]\n');
  }

  if (targetYear) {
    console.log(`Target year: ${targetYear}\n`);
  }

  // Create clients
  const supabase = createSupabaseClient();
  console.log('Connected to Supabase');

  const anthropic = createAnthropicClient();
  console.log('Anthropic client ready\n');

  // Fetch seasons
  const seasons = await fetchSeasons(supabase, targetYear);
  console.log(`Found ${seasons.length} season(s) to process\n`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const season of seasons) {
    console.log(`\n--- ${season.year} Season ---`);

    // Check if already has review
    if (season.ai_review && !force) {
      console.log('  Already has AI review. Use --force to regenerate.');
      skipped++;
      continue;
    }

    // Fetch season data
    console.log('  Fetching teams...');
    const teams = await fetchTeams(supabase, season.id);
    console.log(`  Found ${teams.length} teams`);

    console.log('  Fetching matchups...');
    const matchups = await fetchMatchups(supabase, season.id);
    console.log(`  Found ${matchups.length} matchups`);

    console.log('  Fetching writeups...');
    const writeups = await fetchWriteups(supabase, season.id);
    console.log(`  Found ${writeups.length} writeups for context`);

    // Calculate records
    const records = calculateSeasonRecords(matchups, teams);
    console.log(`  Calculated ${records.length} season records`);

    // Build prompt
    const prompt = buildPrompt(season, teams, records, writeups);

    if (isDryRun) {
      console.log('\n  [Dry run] Would generate review with prompt:');
      console.log('  ' + prompt.split('\n').slice(0, 5).join('\n  ') + '...\n');
      generated++;
      continue;
    }

    // Generate review
    console.log('  Generating AI review...');
    try {
      const { text, model } = await generateReview(anthropic, prompt);
      console.log(`  Generated ${text.length} characters using ${model}`);

      // Save to database
      console.log('  Saving to database...');
      await saveReview(supabase, season.id, text, model);
      console.log('  ✓ Saved successfully');

      generated++;

      // Rate limiting - wait 1 second between API calls
      if (seasons.indexOf(season) < seasons.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
