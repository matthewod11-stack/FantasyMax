/**
 * Member Fixtures
 *
 * Sample members representing different league personas:
 * - Champions vs perennial losers
 * - Long-tenured vs newcomers
 * - Active vs inactive
 */

import type { Member } from '@/types/database.types';

// Fixed UUIDs for consistent testing
const MEMBER_IDS = {
  MIKE: '11111111-1111-1111-1111-111111111111',
  JOHN: '22222222-2222-2222-2222-222222222222',
  SARAH: '33333333-3333-3333-3333-333333333333',
  DAVID: '44444444-4444-4444-4444-444444444444',
  ALEX: '55555555-5555-5555-5555-555555555555',
  CHRIS: '66666666-6666-6666-6666-666666666666',
  COMMISSIONER: '00000000-0000-0000-0000-000000000001',
} as const;

export { MEMBER_IDS };

/**
 * Mike: League veteran, 2x champion (2019, 2023)
 */
export const MIKE: Member = {
  id: MEMBER_IDS.MIKE,
  display_name: 'Mike',
  email: 'mike@example.com',
  avatar_url: null,
  role: 'member',
  is_active: true,
  joined_year: 2015,
  user_id: null,
  yahoo_manager_id: '1',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * John: Mike's nemesis, 1x champion (2021)
 */
export const JOHN: Member = {
  id: MEMBER_IDS.JOHN,
  display_name: 'John',
  email: 'john@example.com',
  avatar_url: null,
  role: 'member',
  is_active: true,
  joined_year: 2015,
  user_id: null,
  yahoo_manager_id: '2',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Sarah: Newer member (joined 2020), solid performer
 */
export const SARAH: Member = {
  id: MEMBER_IDS.SARAH,
  display_name: 'Sarah',
  email: 'sarah@example.com',
  avatar_url: null,
  role: 'member',
  is_active: true,
  joined_year: 2020,
  user_id: null,
  yahoo_manager_id: '3',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * David: Perennial last-place finisher (3x last place)
 */
export const DAVID: Member = {
  id: MEMBER_IDS.DAVID,
  display_name: 'David',
  email: 'david@example.com',
  avatar_url: null,
  role: 'member',
  is_active: true,
  joined_year: 2015,
  user_id: null,
  yahoo_manager_id: '4',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Alex: Inactive former member
 */
export const ALEX: Member = {
  id: MEMBER_IDS.ALEX,
  display_name: 'Alex',
  email: 'alex@example.com',
  avatar_url: null,
  role: 'member',
  is_active: false,
  joined_year: 2015,
  user_id: null,
  yahoo_manager_id: '5',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2019-01-01T00:00:00Z',
};

/**
 * Chris: Commissioner and league founder
 */
export const CHRIS: Member = {
  id: MEMBER_IDS.COMMISSIONER,
  display_name: 'Chris',
  email: 'chris@example.com',
  avatar_url: null,
  role: 'commissioner',
  is_active: true,
  joined_year: 2015,
  user_id: null,
  yahoo_manager_id: '0',
  invite_token: null,
  invite_sent_at: null,
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * All sample members
 */
export const ALL_MEMBERS: Member[] = [MIKE, JOHN, SARAH, DAVID, ALEX, CHRIS];

/**
 * Active members only
 */
export const ACTIVE_MEMBERS: Member[] = ALL_MEMBERS.filter((m) => m.is_active);
