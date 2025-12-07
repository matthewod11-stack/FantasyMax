/**
 * Team Fixtures
 *
 * Sample teams representing member participation in seasons.
 * Each team links a member to a specific season with their record.
 */

import type { Team } from '@/types/database.types';
import { MEMBER_IDS } from './members';
import { SEASON_IDS } from './seasons';

// Fixed UUIDs for consistent testing
const TEAM_IDS = {
  // 2024 Teams
  MIKE_2024: 'tttttttt-2024-1111-tttt-tttttttttttt',
  JOHN_2024: 'tttttttt-2024-2222-tttt-tttttttttttt',
  SARAH_2024: 'tttttttt-2024-3333-tttt-tttttttttttt',
  DAVID_2024: 'tttttttt-2024-4444-tttt-tttttttttttt',
  // 2023 Teams
  MIKE_2023: 'tttttttt-2023-1111-tttt-tttttttttttt',
  JOHN_2023: 'tttttttt-2023-2222-tttt-tttttttttttt',
  SARAH_2023: 'tttttttt-2023-3333-tttt-tttttttttttt',
  DAVID_2023: 'tttttttt-2023-4444-tttt-tttttttttttt',
  // 2021 Teams
  MIKE_2021: 'tttttttt-2021-1111-tttt-tttttttttttt',
  JOHN_2021: 'tttttttt-2021-2222-tttt-tttttttttttt',
  DAVID_2021: 'tttttttt-2021-4444-tttt-tttttttttttt',
  // 2019 Teams
  MIKE_2019: 'tttttttt-2019-1111-tttt-tttttttttttt',
  JOHN_2019: 'tttttttt-2019-2222-tttt-tttttttttttt',
} as const;

export { TEAM_IDS };

// =====================================
// 2024 Season Teams
// =====================================

export const MIKE_TEAM_2024: Team = {
  id: TEAM_IDS.MIKE_2024,
  season_id: SEASON_IDS.S2024,
  member_id: MEMBER_IDS.MIKE,
  team_name: 'The Champs',
  final_rank: 1,
  final_record_wins: 11,
  final_record_losses: 3,
  final_record_ties: 0,
  total_points_for: 1856.4,
  total_points_against: 1523.2,
  is_champion: true,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: true,
  is_highest_scorer: true,
  playoff_seed: 1,
  logo_url: null,
  yahoo_team_id: 1,
  yahoo_team_key: '449.l.123456.t.1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-25T00:00:00Z',
};

export const JOHN_TEAM_2024: Team = {
  id: TEAM_IDS.JOHN_2024,
  season_id: SEASON_IDS.S2024,
  member_id: MEMBER_IDS.JOHN,
  team_name: 'Touchdown Town',
  final_rank: 3,
  final_record_wins: 9,
  final_record_losses: 5,
  final_record_ties: 0,
  total_points_for: 1712.8,
  total_points_against: 1645.3,
  is_champion: false,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: 3,
  logo_url: null,
  yahoo_team_id: 2,
  yahoo_team_key: '449.l.123456.t.2',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-25T00:00:00Z',
};

export const SARAH_TEAM_2024: Team = {
  id: TEAM_IDS.SARAH_2024,
  season_id: SEASON_IDS.S2024,
  member_id: MEMBER_IDS.SARAH,
  team_name: 'Fantasy Queens',
  final_rank: 5,
  final_record_wins: 8,
  final_record_losses: 6,
  final_record_ties: 0,
  total_points_for: 1654.2,
  total_points_against: 1678.9,
  is_champion: false,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: 5,
  logo_url: null,
  yahoo_team_id: 3,
  yahoo_team_key: '449.l.123456.t.3',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-25T00:00:00Z',
};

export const DAVID_TEAM_2024: Team = {
  id: TEAM_IDS.DAVID_2024,
  season_id: SEASON_IDS.S2024,
  member_id: MEMBER_IDS.DAVID,
  team_name: 'Basement Dwellers',
  final_rank: 14,
  final_record_wins: 2,
  final_record_losses: 12,
  final_record_ties: 0,
  total_points_for: 1245.1,
  total_points_against: 1823.7,
  is_champion: false,
  is_last_place: true,
  made_playoffs: false,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: null,
  logo_url: null,
  yahoo_team_id: 4,
  yahoo_team_key: '449.l.123456.t.4',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-25T00:00:00Z',
};

// =====================================
// 2023 Season Teams (Mike's championship)
// =====================================

export const MIKE_TEAM_2023: Team = {
  id: TEAM_IDS.MIKE_2023,
  season_id: SEASON_IDS.S2023,
  member_id: MEMBER_IDS.MIKE,
  team_name: 'The Champs',
  final_rank: 1,
  final_record_wins: 12,
  final_record_losses: 2,
  final_record_ties: 0,
  total_points_for: 1923.5,
  total_points_against: 1456.8,
  is_champion: true,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: true,
  is_highest_scorer: true,
  playoff_seed: 1,
  logo_url: null,
  yahoo_team_id: 1,
  yahoo_team_key: '423.l.123456.t.1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-12-25T00:00:00Z',
};

export const JOHN_TEAM_2023: Team = {
  id: TEAM_IDS.JOHN_2023,
  season_id: SEASON_IDS.S2023,
  member_id: MEMBER_IDS.JOHN,
  team_name: 'Touchdown Town',
  final_rank: 2,
  final_record_wins: 10,
  final_record_losses: 4,
  final_record_ties: 0,
  total_points_for: 1845.2,
  total_points_against: 1567.4,
  is_champion: false,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: 2,
  logo_url: null,
  yahoo_team_id: 2,
  yahoo_team_key: '423.l.123456.t.2',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-12-25T00:00:00Z',
};

// =====================================
// 2021 Season Teams (John's championship)
// =====================================

export const JOHN_TEAM_2021: Team = {
  id: TEAM_IDS.JOHN_2021,
  season_id: SEASON_IDS.S2021,
  member_id: MEMBER_IDS.JOHN,
  team_name: 'Touchdown Town',
  final_rank: 1,
  final_record_wins: 11,
  final_record_losses: 3,
  final_record_ties: 0,
  total_points_for: 1789.6,
  total_points_against: 1534.2,
  is_champion: true,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: true,
  is_highest_scorer: false,
  playoff_seed: 1,
  logo_url: null,
  yahoo_team_id: 2,
  yahoo_team_key: '390.l.123456.t.2',
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2021-12-25T00:00:00Z',
};

export const MIKE_TEAM_2021: Team = {
  id: TEAM_IDS.MIKE_2021,
  season_id: SEASON_IDS.S2021,
  member_id: MEMBER_IDS.MIKE,
  team_name: 'The Champs',
  final_rank: 4,
  final_record_wins: 8,
  final_record_losses: 6,
  final_record_ties: 0,
  total_points_for: 1623.4,
  total_points_against: 1612.8,
  is_champion: false,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: 4,
  logo_url: null,
  yahoo_team_id: 1,
  yahoo_team_key: '390.l.123456.t.1',
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2021-12-25T00:00:00Z',
};

// =====================================
// 2019 Season Teams (Mike's 1st championship)
// =====================================

export const MIKE_TEAM_2019: Team = {
  id: TEAM_IDS.MIKE_2019,
  season_id: SEASON_IDS.S2019,
  member_id: MEMBER_IDS.MIKE,
  team_name: "Mike's Monsters",
  final_rank: 1,
  final_record_wins: 10,
  final_record_losses: 3,
  final_record_ties: 0,
  total_points_for: 1756.3,
  total_points_against: 1423.1,
  is_champion: true,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: true,
  playoff_seed: 2,
  logo_url: null,
  yahoo_team_id: 1,
  yahoo_team_key: '359.l.123456.t.1',
  created_at: '2019-01-01T00:00:00Z',
  updated_at: '2019-12-25T00:00:00Z',
};

export const JOHN_TEAM_2019: Team = {
  id: TEAM_IDS.JOHN_2019,
  season_id: SEASON_IDS.S2019,
  member_id: MEMBER_IDS.JOHN,
  team_name: 'Touchdown Town',
  final_rank: 3,
  final_record_wins: 9,
  final_record_losses: 4,
  final_record_ties: 0,
  total_points_for: 1689.7,
  total_points_against: 1545.2,
  is_champion: false,
  is_last_place: false,
  made_playoffs: true,
  is_regular_season_champ: false,
  is_highest_scorer: false,
  playoff_seed: 3,
  logo_url: null,
  yahoo_team_id: 2,
  yahoo_team_key: '359.l.123456.t.2',
  created_at: '2019-01-01T00:00:00Z',
  updated_at: '2019-12-25T00:00:00Z',
};

/**
 * All teams for stat aggregation tests
 */
export const ALL_TEAMS: Team[] = [
  MIKE_TEAM_2024,
  JOHN_TEAM_2024,
  SARAH_TEAM_2024,
  DAVID_TEAM_2024,
  MIKE_TEAM_2023,
  JOHN_TEAM_2023,
  JOHN_TEAM_2021,
  MIKE_TEAM_2021,
  MIKE_TEAM_2019,
  JOHN_TEAM_2019,
];

/**
 * Mike's teams across all seasons
 */
export const MIKE_TEAMS: Team[] = ALL_TEAMS.filter(
  (t) => t.member_id === MEMBER_IDS.MIKE
);

/**
 * John's teams across all seasons
 */
export const JOHN_TEAMS: Team[] = ALL_TEAMS.filter(
  (t) => t.member_id === MEMBER_IDS.JOHN
);
