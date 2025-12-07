/**
 * Matchup Fixtures
 *
 * Sample matchups for testing H2H calculations and stat aggregations.
 * These represent key matchups between our sample members.
 */

import type { Matchup } from '@/types/database.types';
import { SEASON_IDS } from './seasons';
import { TEAM_IDS } from './teams';

// Fixed UUIDs for consistent testing
const MATCHUP_IDS = {
  // 2024 matchups
  M2024_W1_MIKE_JOHN: 'mmmmmmmm-2024-w01-mj-mmmmmmmmmm',
  M2024_W5_MIKE_SARAH: 'mmmmmmmm-2024-w05-ms-mmmmmmmmmm',
  M2024_W8_JOHN_DAVID: 'mmmmmmmm-2024-w08-jd-mmmmmmmmmm',
  M2024_W12_MIKE_JOHN: 'mmmmmmmm-2024-w12-mj-mmmmmmmmmm',
  M2024_CHAMP: 'mmmmmmmm-2024-chmp-mj-mmmmmmmmmm',
  // 2023 matchups
  M2023_W3_MIKE_JOHN: 'mmmmmmmm-2023-w03-mj-mmmmmmmmmm',
  M2023_W10_MIKE_JOHN: 'mmmmmmmm-2023-w10-mj-mmmmmmmmmm',
  M2023_CHAMP: 'mmmmmmmm-2023-chmp-mj-mmmmmmmmmm',
  // 2021 matchups
  M2021_W6_MIKE_JOHN: 'mmmmmmmm-2021-w06-mj-mmmmmmmmmm',
  M2021_CHAMP: 'mmmmmmmm-2021-chmp-jm-mmmmmmmmmm',
  // 2019 matchups
  M2019_W2_MIKE_JOHN: 'mmmmmmmm-2019-w02-mj-mmmmmmmmmm',
  M2019_CHAMP: 'mmmmmmmm-2019-chmp-mm-mmmmmmmmmm',
} as const;

export { MATCHUP_IDS };

// =====================================
// 2024 Season Matchups
// =====================================

/**
 * Week 1: Mike beats John 142.5 to 128.3
 */
export const MATCHUP_2024_W1_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2024_W1_MIKE_JOHN,
  season_id: SEASON_IDS.S2024,
  week: 1,
  home_team_id: TEAM_IDS.MIKE_2024,
  away_team_id: TEAM_IDS.JOHN_2024,
  home_score: 142.5,
  away_score: 128.3,
  winner_team_id: TEAM_IDS.MIKE_2024,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '449.l.123456.m.1.1',
  created_at: '2024-09-08T00:00:00Z',
  updated_at: '2024-09-08T00:00:00Z',
};

/**
 * Week 5: Mike beats Sarah 156.2 to 134.8 (high-scoring)
 */
export const MATCHUP_2024_W5_MIKE_SARAH: Matchup = {
  id: MATCHUP_IDS.M2024_W5_MIKE_SARAH,
  season_id: SEASON_IDS.S2024,
  week: 5,
  home_team_id: TEAM_IDS.SARAH_2024,
  away_team_id: TEAM_IDS.MIKE_2024,
  home_score: 134.8,
  away_score: 156.2,
  winner_team_id: TEAM_IDS.MIKE_2024,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '449.l.123456.m.5.3',
  created_at: '2024-10-06T00:00:00Z',
  updated_at: '2024-10-06T00:00:00Z',
};

/**
 * Week 8: John beats David 145.6 to 89.2 (blowout)
 */
export const MATCHUP_2024_W8_JOHN_DAVID: Matchup = {
  id: MATCHUP_IDS.M2024_W8_JOHN_DAVID,
  season_id: SEASON_IDS.S2024,
  week: 8,
  home_team_id: TEAM_IDS.JOHN_2024,
  away_team_id: TEAM_IDS.DAVID_2024,
  home_score: 145.6,
  away_score: 89.2,
  winner_team_id: TEAM_IDS.JOHN_2024,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '449.l.123456.m.8.2',
  created_at: '2024-10-27T00:00:00Z',
  updated_at: '2024-10-27T00:00:00Z',
};

/**
 * Week 12: John beats Mike 138.9 to 135.2 (close game)
 */
export const MATCHUP_2024_W12_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2024_W12_MIKE_JOHN,
  season_id: SEASON_IDS.S2024,
  week: 12,
  home_team_id: TEAM_IDS.JOHN_2024,
  away_team_id: TEAM_IDS.MIKE_2024,
  home_score: 138.9,
  away_score: 135.2,
  winner_team_id: TEAM_IDS.JOHN_2024,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '449.l.123456.m.12.1',
  created_at: '2024-11-24T00:00:00Z',
  updated_at: '2024-11-24T00:00:00Z',
};

/**
 * Championship: Mike beats John 168.3 to 154.7
 */
export const MATCHUP_2024_CHAMPIONSHIP: Matchup = {
  id: MATCHUP_IDS.M2024_CHAMP,
  season_id: SEASON_IDS.S2024,
  week: 16,
  home_team_id: TEAM_IDS.MIKE_2024,
  away_team_id: TEAM_IDS.JOHN_2024,
  home_score: 168.3,
  away_score: 154.7,
  winner_team_id: TEAM_IDS.MIKE_2024,
  is_tie: false,
  is_playoff: true,
  is_championship: true,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '449.l.123456.m.16.1',
  created_at: '2024-12-22T00:00:00Z',
  updated_at: '2024-12-22T00:00:00Z',
};

// =====================================
// 2023 Season Matchups
// =====================================

/**
 * Week 3: Mike beats John 152.1 to 143.6
 */
export const MATCHUP_2023_W3_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2023_W3_MIKE_JOHN,
  season_id: SEASON_IDS.S2023,
  week: 3,
  home_team_id: TEAM_IDS.MIKE_2023,
  away_team_id: TEAM_IDS.JOHN_2023,
  home_score: 152.1,
  away_score: 143.6,
  winner_team_id: TEAM_IDS.MIKE_2023,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '423.l.123456.m.3.1',
  created_at: '2023-09-24T00:00:00Z',
  updated_at: '2023-09-24T00:00:00Z',
};

/**
 * Week 10: John beats Mike 141.2 to 129.8
 */
export const MATCHUP_2023_W10_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2023_W10_MIKE_JOHN,
  season_id: SEASON_IDS.S2023,
  week: 10,
  home_team_id: TEAM_IDS.JOHN_2023,
  away_team_id: TEAM_IDS.MIKE_2023,
  home_score: 141.2,
  away_score: 129.8,
  winner_team_id: TEAM_IDS.JOHN_2023,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '423.l.123456.m.10.1',
  created_at: '2023-11-12T00:00:00Z',
  updated_at: '2023-11-12T00:00:00Z',
};

/**
 * 2023 Championship: Mike beats John 175.8 to 162.3
 */
export const MATCHUP_2023_CHAMPIONSHIP: Matchup = {
  id: MATCHUP_IDS.M2023_CHAMP,
  season_id: SEASON_IDS.S2023,
  week: 16,
  home_team_id: TEAM_IDS.MIKE_2023,
  away_team_id: TEAM_IDS.JOHN_2023,
  home_score: 175.8,
  away_score: 162.3,
  winner_team_id: TEAM_IDS.MIKE_2023,
  is_tie: false,
  is_playoff: true,
  is_championship: true,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '423.l.123456.m.16.1',
  created_at: '2023-12-24T00:00:00Z',
  updated_at: '2023-12-24T00:00:00Z',
};

// =====================================
// 2021 Season Matchups (John's championship year)
// =====================================

/**
 * Week 6: John beats Mike 147.3 to 138.9
 */
export const MATCHUP_2021_W6_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2021_W6_MIKE_JOHN,
  season_id: SEASON_IDS.S2021,
  week: 6,
  home_team_id: TEAM_IDS.JOHN_2021,
  away_team_id: TEAM_IDS.MIKE_2021,
  home_score: 147.3,
  away_score: 138.9,
  winner_team_id: TEAM_IDS.JOHN_2021,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '390.l.123456.m.6.1',
  created_at: '2021-10-17T00:00:00Z',
  updated_at: '2021-10-17T00:00:00Z',
};

/**
 * 2021 Championship: John beats Mike 158.4 to 149.2
 */
export const MATCHUP_2021_CHAMPIONSHIP: Matchup = {
  id: MATCHUP_IDS.M2021_CHAMP,
  season_id: SEASON_IDS.S2021,
  week: 16,
  home_team_id: TEAM_IDS.JOHN_2021,
  away_team_id: TEAM_IDS.MIKE_2021,
  home_score: 158.4,
  away_score: 149.2,
  winner_team_id: TEAM_IDS.JOHN_2021,
  is_tie: false,
  is_playoff: true,
  is_championship: true,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '390.l.123456.m.16.1',
  created_at: '2021-12-26T00:00:00Z',
  updated_at: '2021-12-26T00:00:00Z',
};

// =====================================
// 2019 Season Matchups (Mike's 1st championship)
// =====================================

/**
 * Week 2: Mike beats John 151.7 to 142.9
 */
export const MATCHUP_2019_W2_MIKE_JOHN: Matchup = {
  id: MATCHUP_IDS.M2019_W2_MIKE_JOHN,
  season_id: SEASON_IDS.S2019,
  week: 2,
  home_team_id: TEAM_IDS.MIKE_2019,
  away_team_id: TEAM_IDS.JOHN_2019,
  home_score: 151.7,
  away_score: 142.9,
  winner_team_id: TEAM_IDS.MIKE_2019,
  is_tie: false,
  is_playoff: false,
  is_championship: false,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '359.l.123456.m.2.1',
  created_at: '2019-09-15T00:00:00Z',
  updated_at: '2019-09-15T00:00:00Z',
};

/**
 * 2019 Championship: Mike beats opponent (not John)
 */
export const MATCHUP_2019_CHAMPIONSHIP: Matchup = {
  id: MATCHUP_IDS.M2019_CHAMP,
  season_id: SEASON_IDS.S2019,
  week: 16,
  home_team_id: TEAM_IDS.MIKE_2019,
  away_team_id: TEAM_IDS.JOHN_2019, // For simplicity - in reality might be diff opponent
  home_score: 162.4,
  away_score: 148.7,
  winner_team_id: TEAM_IDS.MIKE_2019,
  is_tie: false,
  is_playoff: true,
  is_championship: true,
  is_consolation: false,
  status: 'complete',
  yahoo_matchup_key: '359.l.123456.m.16.1',
  created_at: '2019-12-22T00:00:00Z',
  updated_at: '2019-12-22T00:00:00Z',
};

/**
 * All sample matchups
 */
export const ALL_MATCHUPS: Matchup[] = [
  MATCHUP_2024_W1_MIKE_JOHN,
  MATCHUP_2024_W5_MIKE_SARAH,
  MATCHUP_2024_W8_JOHN_DAVID,
  MATCHUP_2024_W12_MIKE_JOHN,
  MATCHUP_2024_CHAMPIONSHIP,
  MATCHUP_2023_W3_MIKE_JOHN,
  MATCHUP_2023_W10_MIKE_JOHN,
  MATCHUP_2023_CHAMPIONSHIP,
  MATCHUP_2021_W6_MIKE_JOHN,
  MATCHUP_2021_CHAMPIONSHIP,
  MATCHUP_2019_W2_MIKE_JOHN,
  MATCHUP_2019_CHAMPIONSHIP,
];

/**
 * Mike vs John rivalry matchups (for H2H testing)
 * Expected record from fixtures:
 * - Mike wins: W1 2024, W3 2023, Champ 2023, Champ 2024, W2 2019, Champ 2019 = 6
 * - John wins: W12 2024, W10 2023, W6 2021, Champ 2021 = 4
 * H2H Record: Mike 6-4 over John
 */
export const MIKE_VS_JOHN_MATCHUPS: Matchup[] = ALL_MATCHUPS.filter(
  (m) =>
    (m.home_team_id.includes('1111') && m.away_team_id.includes('2222')) ||
    (m.home_team_id.includes('2222') && m.away_team_id.includes('1111'))
);

/**
 * Championship matchups only
 */
export const CHAMPIONSHIP_MATCHUPS: Matchup[] = ALL_MATCHUPS.filter(
  (m) => m.is_championship
);

/**
 * Regular season matchups only
 */
export const REGULAR_SEASON_MATCHUPS: Matchup[] = ALL_MATCHUPS.filter(
  (m) => !m.is_playoff
);
