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

// Types matching database schema
type WriteupType =
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
];

// Type inference patterns - order matters, more specific patterns first
const TYPE_PATTERNS: { pattern: RegExp; type: WriteupType }[] = [
  // Playoff content
  { pattern: /playoff\s*(preview|matchup|begin|recap)/i, type: 'playoff_preview' },
  { pattern: /let\s+the\s+playoffs\s+begin/i, type: 'playoff_preview' },
  { pattern: /championship\s+(game|matchup|preview)/i, type: 'playoff_preview' },
  { pattern: /semi.?final/i, type: 'playoff_preview' },

  // Weekly recaps - look for week numbers and recap indicators
  { pattern: /Week\s+\d+\s+(is\s+in\s+the\s+books|recap|update)/i, type: 'weekly_recap' },
  { pattern: /Week\s+\d+\s+match\s*ups/i, type: 'weekly_recap' },
  { pattern: /Fantasy\s+Week\s+\d+/i, type: 'weekly_recap' },
  { pattern: /Week\s+\d+.{0,20}(recap|update|review)/i, type: 'weekly_recap' },

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
function inferWriteupType(content: string): WriteupType {
  // Check first 1000 chars for patterns
  const searchText = content.slice(0, 1000);

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
function generateTitle(content: string, type: WriteupType, seasonYear: number): string {
  const lines = content.split('\n').filter((l) => l.trim());
  const firstLine = lines[0]?.trim() || '';

  // Use first line if it's short enough and looks like a title
  if (firstLine.length > 0 && firstLine.length <= 80 && !firstLine.includes('(') && !firstLine.endsWith('.')) {
    return firstLine;
  }

  // For weekly recaps, try to extract week number
  const week = extractWeekNumber(content);
  if (week !== null) {
    return `Week ${week} Recap`;
  }

  // Generate based on type
  switch (type) {
    case 'playoff_preview':
      return 'Playoff Preview';
    case 'draft_notes':
      return 'Draft Notes';
    case 'standings_update':
      return 'Standings Update';
    case 'power_rankings':
      return 'Power Rankings';
    case 'season_recap':
      return `${seasonYear} Season Recap`;
    case 'announcement':
      return 'League Announcement';
    default:
      // Use truncated first line
      return firstLine.length > 50 ? firstLine.slice(0, 47) + '...' : firstLine || 'Untitled';
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
      const week = extractWeekNumber(text);

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
function main() {
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

main();
