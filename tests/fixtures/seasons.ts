/**
 * Season Fixtures
 *
 * Sample seasons representing different league states:
 * - Complete seasons with champions
 * - Recent seasons with full data
 */

import type { Season } from '@/types/database.types';

// Fixed UUIDs for consistent testing
const SEASON_IDS = {
  S2024: 'aaaaaaaa-2024-aaaa-aaaa-aaaaaaaaaaaa',
  S2023: 'aaaaaaaa-2023-aaaa-aaaa-aaaaaaaaaaaa',
  S2022: 'aaaaaaaa-2022-aaaa-aaaa-aaaaaaaaaaaa',
  S2021: 'aaaaaaaa-2021-aaaa-aaaa-aaaaaaaaaaaa',
  S2020: 'aaaaaaaa-2020-aaaa-aaaa-aaaaaaaaaaaa',
  S2019: 'aaaaaaaa-2019-aaaa-aaaa-aaaaaaaaaaaa',
  S2015: 'aaaaaaaa-2015-aaaa-aaaa-aaaaaaaaaaaa',
} as const;

export { SEASON_IDS };

const LEAGUE_ID = 'llllllll-llll-llll-llll-llllllllllll';
export { LEAGUE_ID };

/**
 * 2024 Season - Current/most recent
 */
export const SEASON_2024: Season = {
  id: SEASON_IDS.S2024,
  league_id: LEAGUE_ID,
  year: 2024,
  name: 'Season 2024',
  num_teams: 14,
  num_weeks: 17,
  playoff_weeks: 3,
  champion_team_id: null, // Reference to Mike's 2024 team
  last_place_team_id: null,
  yahoo_league_key: '449.l.123456',
  data_source: 'yahoo',
  import_status: 'complete',
  last_sync_at: '2024-12-01T00:00:00Z',
  recap_title: null,
  recap_content: null,
  recap_published_at: null,
  ai_review: null,
  ai_review_generated_at: null,
  ai_review_model: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
};

/**
 * 2023 Season - Mike's 2nd championship
 */
export const SEASON_2023: Season = {
  id: SEASON_IDS.S2023,
  league_id: LEAGUE_ID,
  year: 2023,
  name: 'Season 2023',
  num_teams: 14,
  num_weeks: 17,
  playoff_weeks: 3,
  champion_team_id: null, // Set via team fixtures
  last_place_team_id: null,
  yahoo_league_key: '423.l.123456',
  data_source: 'yahoo',
  import_status: 'complete',
  last_sync_at: '2023-12-25T00:00:00Z',
  recap_title: 'Mike Repeats!',
  recap_content: 'An incredible season ending...',
  recap_published_at: '2024-01-05T00:00:00Z',
  ai_review: null,
  ai_review_generated_at: null,
  ai_review_model: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * 2021 Season - John's championship year
 */
export const SEASON_2021: Season = {
  id: SEASON_IDS.S2021,
  league_id: LEAGUE_ID,
  year: 2021,
  name: 'Season 2021',
  num_teams: 14,
  num_weeks: 17,
  playoff_weeks: 3,
  champion_team_id: null,
  last_place_team_id: null,
  yahoo_league_key: '390.l.123456',
  data_source: 'yahoo',
  import_status: 'complete',
  last_sync_at: '2021-12-28T00:00:00Z',
  recap_title: null,
  recap_content: null,
  recap_published_at: null,
  ai_review: null,
  ai_review_generated_at: null,
  ai_review_model: null,
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
};

/**
 * 2019 Season - Mike's 1st championship
 */
export const SEASON_2019: Season = {
  id: SEASON_IDS.S2019,
  league_id: LEAGUE_ID,
  year: 2019,
  name: 'Season 2019',
  num_teams: 13,
  num_weeks: 16,
  playoff_weeks: 3,
  champion_team_id: null,
  last_place_team_id: null,
  yahoo_league_key: '359.l.123456',
  data_source: 'yahoo',
  import_status: 'complete',
  last_sync_at: '2020-01-15T00:00:00Z',
  recap_title: "Mike's Year",
  recap_content: null,
  recap_published_at: null,
  ai_review: null,
  ai_review_generated_at: null,
  ai_review_model: null,
  created_at: '2019-01-01T00:00:00Z',
  updated_at: '2020-01-01T00:00:00Z',
};

/**
 * 2015 Season - League founding year
 */
export const SEASON_2015: Season = {
  id: SEASON_IDS.S2015,
  league_id: LEAGUE_ID,
  year: 2015,
  name: 'Inaugural Season',
  num_teams: 11,
  num_weeks: 16,
  playoff_weeks: 2,
  champion_team_id: null,
  last_place_team_id: null,
  yahoo_league_key: '314.l.123456',
  data_source: 'yahoo',
  import_status: 'complete',
  last_sync_at: '2016-01-01T00:00:00Z',
  recap_title: 'It Begins',
  recap_content: null,
  recap_published_at: null,
  ai_review: null,
  ai_review_generated_at: null,
  ai_review_model: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2016-01-01T00:00:00Z',
};

/**
 * All sample seasons (newest first)
 */
export const ALL_SEASONS: Season[] = [
  SEASON_2024,
  SEASON_2023,
  SEASON_2021,
  SEASON_2019,
  SEASON_2015,
];
