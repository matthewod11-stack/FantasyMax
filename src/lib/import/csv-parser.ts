import Papa from 'papaparse';
import { z } from 'zod';

// Validation schemas for CSV data
export const memberCsvSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  joined_year: z.coerce.number().min(1900).max(2100),
  role: z.enum(['commissioner', 'president', 'treasurer', 'member']).optional().default('member'),
});

export const seasonCsvSchema = z.object({
  year: z.coerce.number().min(1900).max(2100),
  num_teams: z.coerce.number().min(4).max(20),
  num_weeks: z.coerce.number().min(10).max(18).optional().default(17),
  champion: z.string().optional(),
  last_place: z.string().optional(),
});

export const teamCsvSchema = z.object({
  year: z.coerce.number().min(1900).max(2100),
  manager_name: z.string().min(1, 'Manager name is required'),
  team_name: z.string().min(1, 'Team name is required'),
  final_rank: z.coerce.number().optional(),
  wins: z.coerce.number().min(0).optional().default(0),
  losses: z.coerce.number().min(0).optional().default(0),
  ties: z.coerce.number().min(0).optional().default(0),
  points_for: z.coerce.number().min(0).optional().default(0),
  points_against: z.coerce.number().min(0).optional().default(0),
});

export const matchupCsvSchema = z.object({
  year: z.coerce.number().min(1900).max(2100),
  week: z.coerce.number().min(1).max(18),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  home_score: z.coerce.number().min(0),
  away_score: z.coerce.number().min(0),
  is_playoff: z.coerce.boolean().optional().default(false),
  is_championship: z.coerce.boolean().optional().default(false),
});

export const tradeCsvSchema = z.object({
  year: z.coerce.number().min(1900).max(2100),
  date: z.string(),
  week: z.coerce.number().optional(),
  team_1: z.string().min(1),
  team_2: z.string().min(1),
  team_1_gives: z.string(),
  team_2_gives: z.string(),
  notes: z.string().optional(),
});

export type MemberCsvRow = z.infer<typeof memberCsvSchema>;
export type SeasonCsvRow = z.infer<typeof seasonCsvSchema>;
export type TeamCsvRow = z.infer<typeof teamCsvSchema>;
export type MatchupCsvRow = z.infer<typeof matchupCsvSchema>;
export type TradeCsvRow = z.infer<typeof tradeCsvSchema>;

export type CsvImportType = 'members' | 'seasons' | 'teams' | 'matchups' | 'trades';

export interface ParseResult<T> {
  data: T[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

const schemaMap = {
  members: memberCsvSchema,
  seasons: seasonCsvSchema,
  teams: teamCsvSchema,
  matchups: matchupCsvSchema,
  trades: tradeCsvSchema,
} as const;

export async function parseCsvFile<T>(
  file: File,
  type: CsvImportType,
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    const results: T[] = [];
    const errors: { row: number; message: string }[] = [];
    let rowNumber = 1; // Start at 1 for header row

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: () => {
        resolve({
          data: results,
          errors,
          totalRows: rowNumber - 1,
        });
      },
      step: (row) => {
        rowNumber++;
        const schema = schemaMap[type];

        try {
          const parsed = schema.parse(row.data);
          results.push(parsed as T);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
            errors.push({
              row: rowNumber,
              message: messages.join('; '),
            });
          } else {
            errors.push({
              row: rowNumber,
              message: 'Unknown parsing error',
            });
          }
        }
      },
    });
  });
}

export function generateCsvTemplate(type: CsvImportType): string {
  const templates: Record<CsvImportType, string[][]> = {
    members: [
      ['name', 'email', 'joined_year', 'role'],
      ['John Smith', 'john@email.com', '2015', 'commissioner'],
      ['Jane Doe', 'jane@email.com', '2015', 'member'],
    ],
    seasons: [
      ['year', 'num_teams', 'num_weeks', 'champion', 'last_place'],
      ['2023', '12', '17', 'John Smith', 'Jane Doe'],
      ['2022', '12', '17', 'Bob Wilson', 'Alice Brown'],
    ],
    teams: [
      [
        'year',
        'manager_name',
        'team_name',
        'final_rank',
        'wins',
        'losses',
        'ties',
        'points_for',
        'points_against',
      ],
      ['2023', 'John Smith', 'Team Awesome', '1', '11', '3', '0', '1847.5', '1523.2'],
      ['2023', 'Jane Doe', 'Team Super', '12', '3', '11', '0', '1234.8', '1678.9'],
    ],
    matchups: [
      ['year', 'week', 'home_team', 'away_team', 'home_score', 'away_score', 'is_playoff', 'is_championship'],
      ['2023', '1', 'John Smith', 'Jane Doe', '145.5', '132.2', 'false', 'false'],
      ['2023', '16', 'John Smith', 'Bob Wilson', '167.8', '143.2', 'true', 'true'],
    ],
    trades: [
      ['year', 'date', 'week', 'team_1', 'team_2', 'team_1_gives', 'team_2_gives', 'notes'],
      [
        '2023',
        '2023-10-15',
        '6',
        'John Smith',
        'Jane Doe',
        'Patrick Mahomes, Round 3 Pick',
        'Josh Allen, Round 1 Pick',
        'Big QB swap',
      ],
    ],
  };

  return Papa.unparse(templates[type]);
}
