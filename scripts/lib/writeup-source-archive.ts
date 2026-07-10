import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

export const WRITEUP_SOURCE_TYPES = [
  'weekly_recap',
  'playoff_preview',
  'season_recap',
  'draft_notes',
  'standings_update',
  'power_rankings',
  'announcement',
  'other',
] as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/;
const SOURCE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const writeupSourceMetadataSchema = z.object({
  source_key: z.string().regex(SOURCE_KEY_PATTERN),
  season: z.number().int().min(2015).max(2100),
  published_date: z.string().regex(ISO_DATE_PATTERN).nullable(),
  published_time_local: z.string().regex(LOCAL_TIME_PATTERN).optional(),
  date_precision: z.enum(['exact_from_email_header', 'omitted_from_export']),
  sequence_after: z.string().regex(ISO_DATE_PATTERN).optional(),
  writeup_type: z.enum(WRITEUP_SOURCE_TYPES),
  week: z.number().int().min(1).max(18).nullable(),
  original_order: z.number().int().positive(),
  content_status: z.literal('verbatim'),
}).strict();

export type WriteupSourceMetadata = z.infer<typeof writeupSourceMetadataSchema>;

export interface WriteupSource extends WriteupSourceMetadata {
  title: string;
  content: string;
  source_path: string;
}

interface CommissionerCandidate {
  id: string;
  display_name: string;
}

export function resolveCommissionerAuthor(
  candidates: CommissionerCandidate[],
  existingAuthorIds: string[],
): CommissionerCandidate {
  if (candidates.length === 0) {
    throw new Error('No active commissioner records found');
  }

  const writeupCounts = existingAuthorIds.reduce<Map<string, number>>((counts, authorId) => {
    counts.set(authorId, (counts.get(authorId) ?? 0) + 1);
    return counts;
  }, new Map());
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      writeupCount: writeupCounts.get(candidate.id) ?? 0,
    }))
    .sort((a, b) => b.writeupCount - a.writeupCount);
  const [leader, runnerUp] = ranked;

  if (!leader) {
    throw new Error('No active commissioner records found');
  }
  if (!runnerUp) return leader;

  if (leader.writeupCount > runnerUp.writeupCount) {
    return leader;
  }

  throw new Error(
    `Could not identify one commissioner author from ${candidates.length} active records`,
  );
}

function parseScalar(value: string): string | number | null {
  if (value === 'null') return null;
  if (/^\d+$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseMetadata(frontmatter: string, sourcePath: string): WriteupSourceMetadata {
  const values: Record<string, string | number | null> = {};

  for (const line of frontmatter.split('\n')) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new Error(`${sourcePath}: malformed frontmatter line: ${line}`);
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (Object.hasOwn(values, key)) {
      throw new Error(`${sourcePath}: duplicate frontmatter key: ${key}`);
    }
    values[key] = parseScalar(rawValue);
  }

  const parsed = writeupSourceMetadataSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(`${sourcePath}: invalid frontmatter: ${parsed.error.message}`);
  }

  if (parsed.data.date_precision === 'exact_from_email_header' && !parsed.data.published_date) {
    throw new Error(`${sourcePath}: exact date precision requires published_date`);
  }
  if (parsed.data.date_precision === 'omitted_from_export' && parsed.data.published_date !== null) {
    throw new Error(`${sourcePath}: omitted date precision requires a null published_date`);
  }
  if (parsed.data.published_date === null && !parsed.data.sequence_after) {
    throw new Error(`${sourcePath}: undated sources require sequence_after`);
  }

  return parsed.data;
}

export function parseWriteupSource(raw: string, sourcePath: string): WriteupSource {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n\n# ([^\n]+)\n\n([\s\S]+)$/);
  if (!match) {
    throw new Error(`${sourcePath}: expected frontmatter, one H1 title, and body content`);
  }

  const [, frontmatter = '', title = '', rawContent = ''] = match;
  const content = rawContent.replace(/\n$/, '');
  const metadata = parseMetadata(frontmatter, sourcePath);

  if (!title.trim() || !content.trim()) {
    throw new Error(`${sourcePath}: title and body content are required`);
  }
  if (/\bOn .+ wrote:|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|<[^>]+@[^>]+>/i.test(content)) {
    throw new Error(`${sourcePath}: email transport metadata must not appear in source content`);
  }

  return {
    ...metadata,
    title: title.trim(),
    content,
    source_path: sourcePath,
  };
}

function listMarkdownFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      files.push(entryPath);
    }
  }

  return files.sort();
}

export function validateWriteupSourceSet(sources: WriteupSource[]): WriteupSource[] {
  if (sources.length === 0) {
    throw new Error('No writeup source records found');
  }

  const sourceKeys = new Set<string>();
  const seasonOrders = new Set<string>();
  const ordersBySeason = new Map<number, number[]>();

  for (const source of sources) {
    if (sourceKeys.has(source.source_key)) {
      throw new Error(`Duplicate source_key: ${source.source_key}`);
    }
    sourceKeys.add(source.source_key);

    const orderKey = `${source.season}:${source.original_order}`;
    if (seasonOrders.has(orderKey)) {
      throw new Error(`Duplicate original_order for season: ${orderKey}`);
    }
    seasonOrders.add(orderKey);

    const seasonOrdersList = ordersBySeason.get(source.season) ?? [];
    seasonOrdersList.push(source.original_order);
    ordersBySeason.set(source.season, seasonOrdersList);
  }

  for (const [season, orders] of ordersBySeason) {
    const sorted = [...orders].sort((a, b) => a - b);
    const expected = Array.from({ length: sorted.length }, (_, index) => index + 1);
    if (sorted.some((order, index) => order !== expected[index])) {
      throw new Error(`Season ${season} original_order values must be contiguous from 1`);
    }
  }

  return [...sources].sort(
    (a, b) => a.season - b.season || a.original_order - b.original_order,
  );
}

export function loadWriteupSources(directory: string): WriteupSource[] {
  const sources = listMarkdownFiles(directory).map((filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    return parseWriteupSource(readFileSync(filePath, 'utf8'), relativePath);
  });

  return validateWriteupSourceSet(sources);
}
