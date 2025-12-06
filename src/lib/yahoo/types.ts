// Yahoo Fantasy API Types
// Reference: https://developer.yahoo.com/fantasysports/guide/

export interface YahooOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at?: number;
}

export interface YahooUser {
  guid: string;
}

export interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  logo_url?: string;
  draft_status: string;
  num_teams: number;
  scoring_type: string;
  league_type: string;
  current_week: number;
  start_week: string;
  end_week: string;
  start_date: string;
  end_date: string;
  game_code: string;
  season: string;
}

export interface YahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  url: string;
  team_logo?: string;
  waiver_priority?: number;
  number_of_moves?: number;
  number_of_trades?: number;
  roster_adds?: {
    coverage_type: string;
    coverage_value: number;
    value: number;
  };
  league_scoring_type: string;
  has_draft_grade?: boolean;
  managers: YahooManager[];
  team_standings?: YahooTeamStandings;
  team_points?: YahooTeamPoints;
}

export interface YahooManager {
  manager_id: string;
  nickname: string;
  guid: string;
  email?: string;
  image_url?: string;
  is_commissioner?: boolean;
  is_current_login?: boolean;
}

export interface YahooTeamStandings {
  rank: number;
  playoff_seed?: number;
  outcome_totals: {
    wins: number;
    losses: number;
    ties: number;
    percentage: number;
  };
  points_for: number;
  points_against: number;
}

export interface YahooTeamPoints {
  coverage_type: string;
  week?: number;
  total: number;
}

export interface YahooMatchup {
  week: string;
  week_start: string;
  week_end: string;
  status: 'postevent' | 'midevent' | 'preevent';
  is_playoffs: boolean;
  is_consolation: boolean;
  is_matchup_recap_available: boolean;
  teams: YahooMatchupTeam[];
  winner_team_key?: string;
}

export interface YahooMatchupTeam {
  team_key: string;
  team_id: string;
  name: string;
  team_points: {
    total: number;
  };
  team_projected_points?: {
    total: number;
  };
}

export interface YahooTransaction {
  transaction_key: string;
  transaction_id: string;
  type: 'add' | 'drop' | 'add/drop' | 'trade';
  status: string;
  timestamp: number;
  players?: YahooTransactionPlayer[];
  trader_team_key?: string;
  tradee_team_key?: string;
}

export interface YahooTransactionPlayer {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  transaction_data: {
    type: 'add' | 'drop' | 'trade';
    source_type?: string;
    destination_type?: string;
    source_team_key?: string;
    destination_team_key?: string;
  };
}

export interface YahooGame {
  game_key: string;
  game_id: string;
  name: string;
  code: string;
  type: string;
  url: string;
  season: string;
  is_registration_over: boolean;
  is_game_over: boolean;
  is_offseason: boolean;
}

// API Response wrapper types
export interface YahooApiResponse<T> {
  fantasy_content: T;
}

export interface YahooLeagueResponse {
  league: YahooLeague[];
}

export interface YahooTeamsResponse {
  league: [YahooLeague, { teams: { team: YahooTeam[] } }];
}

export interface YahooScoreboardResponse {
  league: [YahooLeague, { scoreboard: { matchups: { matchup: YahooMatchup[] } } }];
}

export interface YahooTransactionsResponse {
  league: [YahooLeague, { transactions: { transaction: YahooTransaction[] } }];
}
