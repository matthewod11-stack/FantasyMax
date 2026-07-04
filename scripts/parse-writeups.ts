#!/usr/bin/env npx tsx
/**
 * Parse Historical Writeups
 *
 * Parses docs/alltimewriteups.md into structured JSON for database import.
 * Splits on blank lines, groups by season, and infers writeup types.
 *
 * Usage:
 *   npx tsx scripts/parse-writeups.ts
 *   npx tsx scripts/parse-writeups.ts --dry-run
 *
 * Output:
 *   scripts/output/writeups.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Types matching database schema
export type WriteupType =
  | 'weekly_recap'
  | 'playoff_preview'
  | 'season_recap'
  | 'draft_notes'
  | 'standings_update'
  | 'power_rankings'
  | 'announcement'
  | 'other';

interface ParsedWriteup {
  title: string;
  content: string;
  season_year: number;
  week: number | null;
  writeup_type: WriteupType;
  original_order: number;
}

interface SeasonBlock {
  year: number;
  startLine: number;
  endLine: number;
  content: string;
}

// Season header pattern: "2015 season" or "2024 season (Vegas draft year)"
const SEASON_HEADER_REGEX = /^(20\d{2})\s+season/i;

// Week patterns for classification
const WEEK_PATTERNS = [
  /^Week\s+(\d+)/i,
  /Week\s+(\d+)\s+(is\s+in\s+the\s+books|recap|update|match\s*ups)/i,
  /Fantasy\s+Week\s+(\d+)/i,
  /\bWeek\s+(\d+)\b/i,
];

// Type inference patterns - order matters, more specific patterns first
const TYPE_PATTERNS: { pattern: RegExp; type: WriteupType }[] = [
  // League announcements and transaction drama
  { pattern: /\b(rule\s+change|rules?\s+chatter|league\s+(announcement|vote|settings)|dues?|payment|payouts?|constitution|faab|waiver\s+budget)\b/i, type: 'announcement' },
  { pattern: /\btrade\s+(block|deadline|drama|offer|offers|proposal|proposals)\b/i, type: 'announcement' },
  { pattern: /\btrades?\s+(are|is|were|was|have|has)\b/i, type: 'announcement' },
  { pattern: /\b(help\s+me\s+welcome|new\s+team|new\s+owner|introduce\s+another\s+new)\b/i, type: 'announcement' },

  // Draft logistics and destination drafts
  { pattern: /\b(vegas|suite|flights?|hotel|travel).{0,80}\bdraft\b/i, type: 'draft_notes' },
  { pattern: /\bdraft.{0,80}\b(vegas|suite|flights?|hotel|travel)\b/i, type: 'draft_notes' },
  { pattern: /\b(down\s+for\s+vegas|vegas\s+this\s+year|finding\s+the\s+weekend)\b/i, type: 'draft_notes' },
  { pattern: /\b(custom\s+draft\s+board|draft\s+weekend|live\s+draft|draft\s+date)\b/i, type: 'draft_notes' },
  { pattern: /\bdraft.{0,100}\b(days?\s+out|thursday|calendar\s+invite|starts?|order)\b/i, type: 'draft_notes' },
  { pattern: /\bnfl\s+draft.{0,160}\b(upcoming\s+season|repeat|rosters?|draft)\b/i, type: 'draft_notes' },

  // Championship recaps are season-level lore, not previews
  { pattern: /\bchampionship\s+(recap|review|collapse|results?|wrap|ring)\b/i, type: 'season_recap' },
  { pattern: /\b(title\s+game|championship\s+game).{0,80}\b(won|lost|survived|collapsed|recap)\b/i, type: 'season_recap' },
  { pattern: /\b(all\s+hail|glory\s+glory|congratulations?).{0,160}\b(champion|championship|title)\b/i, type: 'season_recap' },
  { pattern: /\b(champion|championship|title).{0,160}\b(congratulations?|all\s+hail|glory\s+glory|that.?s\s+all\s+she\s+wrote)\b/i, type: 'season_recap' },
  { pattern: /\b(yours\s+truly.{0,120}champion|once\s+again.{0,40}champion|how\s+does\s+he\s+keep\s+winning)\b/i, type: 'season_recap' },

  // Playoff race updates
  { pattern: /\b(playoff\s+(berth|birth|race|spot|spots|seed|seeding|picture|scenario|scenarios|run)|clinched?|final\s+seed|tie\s*breaker)\b/i, type: 'standings_update' },
  { pattern: /\bcoming\s+down\s+to\s+the\s+wire\b/i, type: 'standings_update' },
  { pattern: /\b(standings\s+are\s+starting|control\s+their\s+own\s+fate|cream\s+continues\s+to\s+rise|top\s+of\s+the\s+points\s+scored\s+standings)\b/i, type: 'standings_update' },

  // Playoff content
  { pattern: /playoff\s*(preview|matchup|begin|recap)/i, type: 'playoff_preview' },
  { pattern: /\b(playoffs\s+baby|teams\s+still\s+alive|championship\s+is\s+all\s+but\s+wrapped\s+up|come\s+down\s+to\s+this\s+weekend.{0,120}championship)\b/i, type: 'playoff_preview' },
  { pattern: /let\s+the\s+playoffs\s+begin/i, type: 'playoff_preview' },
  { pattern: /championship\s+(game|matchup|preview)/i, type: 'playoff_preview' },
  { pattern: /semi.?final/i, type: 'playoff_preview' },

  // Weekly recaps - look for week numbers and recap indicators
  { pattern: /Week\s+\d+\s+(is\s+in\s+the\s+books|recap|update)/i, type: 'weekly_recap' },
  { pattern: /Week\s+\d+\s+match\s*ups/i, type: 'weekly_recap' },
  { pattern: /Fantasy\s+Week\s+\d+/i, type: 'weekly_recap' },
  { pattern: /Week\s+\d+.{0,20}(recap|update|review)/i, type: 'weekly_recap' },
  { pattern: /\b(high\s+score|scoring\s+win|points\s+scored|what\s+a\s+week\s+of\s+matchups|gonna\s+keep\s+it\s+quick\s+this\s+week)\b/i, type: 'weekly_recap' },
  { pattern: /\b(rbs?\s+gone\s+missing|ovr\s+rank|from\s+worst\s+to\s+first)\b/i, type: 'weekly_recap' },

  // Draft-related
  { pattern: /draft\s+(notes|day|date|recap|order)/i, type: 'draft_notes' },
  { pattern: /Teams\s+are\s+in/i, type: 'draft_notes' },
  { pattern: /Rosters\s+are\s+in/i, type: 'draft_notes' },
  { pattern: /DRAFT\s+STARTS/i, type: 'draft_notes' },
  { pattern: /draft\s+date/i, type: 'draft_notes' },
  { pattern: /Random\s+Draft\s+Order/i, type: 'draft_notes' },
  { pattern: /bring\s+\$\d+\s+cash/i, type: 'draft_notes' },

  // Standings updates
  { pattern: /standings?\s+(update|check|look)/i, type: 'standings_update' },
  { pattern: /playoff\s+likelihood/i, type: 'standings_update' },
  { pattern: /playoff\s+position/i, type: 'standings_update' },
  { pattern: /tied\s+at\s+\d+-\d+/i, type: 'standings_update' },

  // Power rankings
  { pattern: /power\s+rank/i, type: 'power_rankings' },

  // Season recap
  { pattern: /Season\s+(recap|review|summary|wrap)/i, type: 'season_recap' },

  // Announcements
  { pattern: /HUGE\s+UPDATE/i, type: 'announcement' },
  { pattern: /SEE\s+INVITE/i, type: 'announcement' },
  { pattern: /rule\s+change/i, type: 'announcement' },
  { pattern: /Help\s+me\s+welcome/i, type: 'announcement' },
];

/**
 * Extract week number from writeup content
 */
function extractWeekNumber(content: string): number | null {
  for (const pattern of WEEK_PATTERNS) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const week = parseInt(match[1], 10);
      if (week >= 1 && week <= 17) {
        return week;
      }
    }
  }
  return null;
}

/**
 * Infer writeup type from content
 */
export function inferWriteupType(content: string): WriteupType {
  // Check first 1000 chars for patterns
  const searchText = content.slice(0, 1000).replace(/\s+/g, ' ');

  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(searchText)) {
      return type;
    }
  }

  // Additional heuristics based on content analysis
  const lowerContent = content.toLowerCase();

  // If it has week number and discusses matchups, it's a weekly recap
  if (extractWeekNumber(content) !== null) {
    return 'weekly_recap';
  }

  // If it mentions "vs." multiple times with scores, likely a weekly recap
  const vsMatches = content.match(/\(\d+\)\s+vs\.?\s+.*\(\d+\)/gi);
  if (vsMatches && vsMatches.length >= 2) {
    return 'weekly_recap';
  }

  // Matchup score patterns like "Team (139) vs. Team (142)"
  if (/\w+\s+\(\d{2,3}\)\s+vs\.?\s+\w+\s+\(\d{2,3}\)/i.test(content)) {
    return 'weekly_recap';
  }

  // If starts with "Gentleman" and mentions draft/season, likely pre-season announcement
  if (/^Gentleman/i.test(content.trim()) && /draft|season/i.test(searchText)) {
    return 'announcement';
  }

  // If discusses playoff seeds/matchups
  if (/\(\d\s*seed\)/i.test(content) || /playoff\s+(spot|seed|race)/i.test(lowerContent)) {
    return 'standings_update';
  }

  return 'other';
}

/**
 * Generate a title from writeup content
 */
export function generateTitle(content: string, type: WriteupType, seasonYear: number): string {
  const lines = content.split('\n').filter((l) => l.trim());
  const firstLine = lines[0]?.trim() || '';
  const searchText = content.slice(0, 1200).replace(/\s+/g, ' ');

  if (type === 'announcement' && /\btrade\s+(block|deadline|drama|offer|offers|proposal|proposals)\b/i.test(searchText)) {
    return `${seasonYear} Trade Drama`;
  }

  if (type === 'draft_notes' && (/\b(vegas|suite|flights?|hotel|travel).{0,100}\bdraft\b/i.test(searchText)
    || /\bdraft.{0,100}\b(vegas|suite|flights?|hotel|travel)\b/i.test(searchText)
    || /\b(custom\s+draft\s+board|draft\s+weekend|live\s+draft|down\s+for\s+vegas|vegas\s+this\s+year)\b/i.test(searchText))) {
    return `${seasonYear} Vegas Draft Planning`;
  }

  if (type === 'season_recap' && (/\bchampionship\s+(recap|review|collapse|results?|wrap)\b/i.test(searchText)
    || /\b(title\s+game|championship\s+game).{0,100}\b(won|lost|survived|collapsed|recap)\b/i.test(searchText))) {
    return `${seasonYear} Championship Recap`;
  }

  if (type === 'standings_update' && (/\b(playoff\s+(berth|birth|race|spot|spots|seed|seeding|picture|scenario|scenarios)|final\s+seed|tie\s*breaker)\b/i.test(searchText)
    || /\bcoming\s+down\s+to\s+the\s+wire\b/i.test(searchText))) {
    return `${seasonYear} Playoff Race Update`;
  }

  if (type === 'weekly_recap') {
    const week = extractWeekNumber(content);
    return week !== null ? `${seasonYear} Week ${week} Recap` : `${seasonYear} Weekly Recap`;
  }

  // Generate based on type
  switch (type) {
    case 'playoff_preview':
      return `${seasonYear} Playoff Preview`;
    case 'draft_notes':
      return `${seasonYear} Draft Notes`;
    case 'standings_update':
      return `${seasonYear} Standings Update`;
    case 'power_rankings':
      return `${seasonYear} Power Rankings`;
    case 'season_recap':
      return `${seasonYear} Season Recap`;
    case 'announcement':
      return `${seasonYear} League Announcement`;
    default:
      // Use first line if it's short enough and looks like a title
      if (firstLine.length > 0 && firstLine.length <= 80 && !firstLine.includes('(') && !firstLine.endsWith('.')) {
        return firstLine;
      }
      // Use truncated first line
      return firstLine.length > 50 ? firstLine.slice(0, 47) + '...' : firstLine || `${seasonYear} League Note`;
  }
}

/**
 * Split content into individual writeups based on blank line separators
 */
function splitIntoWriteups(content: string): string[] {
  // Split on 2+ consecutive newlines (blank lines)
  const blocks = content.split(/\n{2,}/);

  // Filter out very short blocks and merge related content
  const writeups: string[] = [];
  let currentWriteup = '';

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check if this looks like the start of a new writeup
    const isNewWriteup =
      /^(Week\s+\d+|Gentleman|HUGE\s+UPDATE|SEE\s+INVITE|Teams\s+are\s+in|Rosters\s+are\s+in|Well\s+Boys|On\s+the\s+day|Fantasy\s+Week|Things\s+are\s+starting|Congrat)/i.test(
        trimmed
      );

    // Check if this looks like a writeup ending
    const isPreviousEnding = currentWriteup && /Commish\s*$|~Commish\s*out\s*$/i.test(currentWriteup.trim());

    if ((isNewWriteup || isPreviousEnding) && currentWriteup.length > 100) {
      writeups.push(currentWriteup.trim());
      currentWriteup = trimmed;
    } else {
      currentWriteup += (currentWriteup ? '\n\n' : '') + trimmed;
    }
  }

  // Don't forget the last writeup
  if (currentWriteup.trim().length > 100) {
    writeups.push(currentWriteup.trim());
  }

  return writeups;
}

/**
 * Parse the entire writeups file
 */
function parseWriteupsFile(filePath: string): ParsedWriteup[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // First pass: identify season boundaries
  const seasonBlocks: SeasonBlock[] = [];
  let currentSeason: { year: number; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(SEASON_HEADER_REGEX);
    if (match) {
      if (currentSeason) {
        seasonBlocks.push({
          year: currentSeason.year,
          startLine: currentSeason.startLine,
          endLine: i - 1,
          content: lines.slice(currentSeason.startLine + 1, i).join('\n'),
        });
      }
      currentSeason = { year: parseInt(match[1] ?? '0', 10), startLine: i };
    }
  }

  // Don't forget the last season
  if (currentSeason) {
    seasonBlocks.push({
      year: currentSeason.year,
      startLine: currentSeason.startLine,
      endLine: lines.length - 1,
      content: lines.slice(currentSeason.startLine + 1).join('\n'),
    });
  }

  console.log(`Found ${seasonBlocks.length} seasons: ${seasonBlocks.map((s) => s.year).join(', ')}`);

  // Second pass: split each season into writeups
  const allWriteups: ParsedWriteup[] = [];

  for (const season of seasonBlocks) {
    const writeupTexts = splitIntoWriteups(season.content);
    console.log(`  ${season.year}: ${writeupTexts.length} writeups`);

    for (let order = 0; order < writeupTexts.length; order++) {
      const text = writeupTexts[order];
      if (!text) continue;
      const type = inferWriteupType(text);
      const title = generateTitle(text, type, season.year);
      const week = type === 'weekly_recap' ? extractWeekNumber(text) : null;

      allWriteups.push({
        title,
        content: text,
        season_year: season.year,
        week,
        writeup_type: type,
        original_order: order + 1,
      });
    }
  }

  return allWriteups;
}

/**
 * Main execution
 */
export function main() {
  const isDryRun = process.argv.includes('--dry-run');

  const inputPath = path.join(process.cwd(), 'docs', 'alltimewriteups.md');
  const outputDir = path.join(process.cwd(), 'scripts', 'output');
  const outputPath = path.join(outputDir, 'writeups.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log('Parsing historical writeups...\n');
  const writeups = parseWriteupsFile(inputPath);

  console.log(`\nTotal writeups parsed: ${writeups.length}`);

  // Summary by type
  const typeCount: Record<string, number> = {};
  for (const w of writeups) {
    typeCount[w.writeup_type] = (typeCount[w.writeup_type] || 0) + 1;
  }
  console.log('\nBy type:');
  for (const [type, count] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // Summary by season
  const seasonCount: Record<number, number> = {};
  for (const w of writeups) {
    seasonCount[w.season_year] = (seasonCount[w.season_year] || 0) + 1;
  }
  console.log('\nBy season:');
  for (const year of Object.keys(seasonCount).sort()) {
    console.log(`  ${year}: ${seasonCount[parseInt(year)]} writeups`);
  }

  if (isDryRun) {
    console.log('\n[Dry run - not writing output file]');
    console.log('\nSample writeups:');
    for (const w of writeups.slice(0, 3)) {
      console.log(`\n---\nTitle: ${w.title}`);
      console.log(`Season: ${w.season_year}, Week: ${w.week}, Type: ${w.writeup_type}`);
      console.log(`Content (first 200 chars): ${w.content.slice(0, 200)}...`);
    }
  } else {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(writeups, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  }
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = path.resolve(fileURLToPath(import.meta.url));

if (executedPath === modulePath) {
  main();
}
