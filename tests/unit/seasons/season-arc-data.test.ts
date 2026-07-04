import { describe, expect, it } from 'vitest';

import { buildSeasonArc } from '@/lib/supabase/queries/league';
import { prioritizeSeasonArcWriteups } from '@/lib/supabase/queries/writeups';

const members = {
  champion: { id: 'member-garrett', display_name: 'Garrett C', avatar_url: null },
  runnerUp: { id: 'member-pj', display_name: 'PJ M', avatar_url: null },
  lastPlace: { id: 'member-nick', display_name: 'Nick D', avatar_url: null },
  blowoutLoser: { id: 'member-paul', display_name: 'Paul', avatar_url: null },
};

const teams = [
  {
    id: 'team-champion',
    team_name: 'The Champs',
    final_rank: 1,
    final_record_wins: 10,
    final_record_losses: 4,
    final_record_ties: 0,
    total_points_for: 1680.4,
    total_points_against: 1510.2,
    is_champion: true,
    is_last_place: false,
    playoff_seed: 2,
    member: members.champion,
  },
  {
    id: 'team-runner-up',
    team_name: 'Almost',
    final_rank: 2,
    final_record_wins: 9,
    final_record_losses: 5,
    final_record_ties: 0,
    total_points_for: 1610.1,
    total_points_against: 1502.3,
    is_champion: false,
    is_last_place: false,
    playoff_seed: 4,
    member: members.runnerUp,
  },
  {
    id: 'team-last',
    team_name: 'Basement',
    final_rank: 12,
    final_record_wins: 3,
    final_record_losses: 11,
    final_record_ties: 0,
    total_points_for: 1090.2,
    total_points_against: 1420.1,
    is_champion: false,
    is_last_place: true,
    playoff_seed: null,
    member: members.lastPlace,
  },
  {
    id: 'team-paul',
    team_name: 'The Other Side',
    final_rank: 8,
    final_record_wins: 6,
    final_record_losses: 8,
    final_record_ties: 0,
    total_points_for: 1330.8,
    total_points_against: 1375.6,
    is_champion: false,
    is_last_place: false,
    playoff_seed: null,
    member: members.blowoutLoser,
  },
];

const matchups = [
  {
    id: 'matchup-blowout',
    week: 3,
    home_team_id: 'team-champion',
    away_team_id: 'team-paul',
    home_score: 178.2,
    away_score: 82.1,
    winner_team_id: 'team-champion',
    status: 'final',
    is_playoff: false,
    is_championship: false,
    is_consolation: false,
  },
  {
    id: 'matchup-close',
    week: 7,
    home_team_id: 'team-runner-up',
    away_team_id: 'team-last',
    home_score: 101.4,
    away_score: 101.0,
    winner_team_id: 'team-runner-up',
    status: 'final',
    is_playoff: false,
    is_championship: false,
    is_consolation: false,
  },
  {
    id: 'matchup-worst',
    week: 8,
    home_team_id: 'team-last',
    away_team_id: 'team-paul',
    home_score: 62.3,
    away_score: 119.7,
    winner_team_id: 'team-paul',
    status: 'final',
    is_playoff: false,
    is_championship: false,
    is_consolation: false,
  },
  {
    id: 'matchup-title',
    week: 16,
    home_team_id: 'team-champion',
    away_team_id: 'team-runner-up',
    home_score: 135.5,
    away_score: 120.4,
    winner_team_id: 'team-champion',
    status: 'final',
    is_playoff: true,
    is_championship: true,
    is_consolation: false,
  },
];

const writeups = [
  {
    id: 'announcement-2024',
    title: 'Dues Reminder',
    excerpt: 'Please pay up.',
    week: null,
    writeup_type: 'announcement',
    published_at: '2024-08-01T00:00:00.000Z',
  },
  {
    id: 'recap-2024',
    title: '2024 Season Recap',
    excerpt: 'The title run and collapse were both memorable.',
    week: null,
    writeup_type: 'season_recap',
    published_at: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'playoffs-2024',
    title: 'Playoff Preview',
    excerpt: 'Four teams have a real path.',
    week: 15,
    writeup_type: 'playoff_preview',
    published_at: '2024-12-10T00:00:00.000Z',
  },
] as const;

describe('buildSeasonArc', () => {
  it('builds deterministic season story beats from teams, matchups, writeups, and trades', () => {
    const arc = buildSeasonArc({
      year: 2024,
      season: {
        id: 'season-2024',
        champion_team_id: 'team-champion',
        last_place_team_id: 'team-last',
      },
      teams,
      matchups,
      writeups,
      trades: [
        {
          id: 'trade-1',
          tradeDate: '2024-10-11',
          week: 6,
          seasonYear: 2024,
          team1Name: 'The Champs',
          team2Name: 'Almost',
          team1MemberName: 'Garrett C',
          team2MemberName: 'PJ M',
          team1Sends: [{ name: 'Player A', position: 'RB' }],
          team2Sends: [{ name: 'Player B', position: 'WR' }],
          championshipImpact: 'Garrett C won the 2024 championship after this deal.',
        },
      ],
    });

    expect(arc.championPath?.summary).toContain('Garrett C finished 10-4 as the No. 2 seed');
    expect(arc.championPath?.summary).toContain('135.5-120.4 championship win over PJ M');
    expect(arc.lastPlaceStory?.summary).toContain('Nick D finished 3-11 in 12th');
    expect(arc.lastPlaceStory?.summary).toContain('1,090.2 PF and 1,420.1 PA');
    expect(arc.records.map((record) => record.kind)).toEqual([
      'highest_score',
      'worst_score',
      'closest_game',
      'biggest_blowout',
    ]);
    expect(arc.records[0]).toEqual(
      expect.objectContaining({
        label: 'Highest Score',
        value: '178.2',
        href: '/records',
      }),
    );
    expect(arc.receipts.writeups.map((writeup) => writeup.title)).toEqual([
      '2024 Season Recap',
      'Playoff Preview',
      'Dues Reminder',
    ]);
    expect(arc.receipts.writeups[0]?.href).toBe('/writeups?season=2024&writeup=recap-2024');
    expect(arc.receipts.trades[0]?.href).toBe('/trades?season=2024&trade=trade-1');
    expect(arc.receipts.trades[0]?.championshipImpact).toContain('championship');
  });

  it('does not invent a last-place story for incomplete seasons', () => {
    const arc = buildSeasonArc({
      year: 2026,
      season: {
        id: 'season-2026',
        champion_team_id: null,
        last_place_team_id: null,
      },
      teams: [
        {
          id: 'team-current-1',
          team_name: 'Current One',
          final_rank: null,
          final_record_wins: null,
          final_record_losses: null,
          final_record_ties: null,
          total_points_for: 0,
          total_points_against: 0,
          is_champion: false,
          is_last_place: false,
          playoff_seed: null,
          member: members.champion,
        },
        {
          id: 'team-current-2',
          team_name: 'Current Two',
          final_rank: null,
          final_record_wins: null,
          final_record_losses: null,
          final_record_ties: null,
          total_points_for: 0,
          total_points_against: 0,
          is_champion: false,
          is_last_place: false,
          playoff_seed: null,
          member: members.runnerUp,
        },
      ],
      matchups: [],
      writeups: [],
      trades: [],
    });

    expect(arc.lastPlaceStory).toBeNull();
  });
});

describe('prioritizeSeasonArcWriteups', () => {
  it('prioritizes season and playoff story receipts before routine announcements', () => {
    expect(prioritizeSeasonArcWriteups([...writeups]).map((writeup) => writeup.title)).toEqual([
      '2024 Season Recap',
      'Playoff Preview',
      'Dues Reminder',
    ]);
  });
});
