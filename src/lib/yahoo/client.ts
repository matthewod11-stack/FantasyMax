import type {
  YahooOAuthTokens,
  YahooLeague,
  YahooTeam,
  YahooMatchup,
  YahooTransaction,
  YahooGame,
} from './types';

const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';
const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';

export class YahooFantasyClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(tokens?: YahooOAuthTokens) {
    if (tokens) {
      this.setTokens(tokens);
    }
  }

  setTokens(tokens: YahooOAuthTokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiresAt = tokens.expires_at || Date.now() + tokens.expires_in * 1000;
  }

  getTokens(): YahooOAuthTokens | null {
    if (!this.accessToken || !this.refreshToken) return null;
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_in: Math.max(0, Math.floor((this.tokenExpiresAt || 0 - Date.now()) / 1000)),
      token_type: 'bearer',
      expires_at: this.tokenExpiresAt || undefined,
    };
  }

  static getAuthUrl(redirectUri: string): string {
    const clientId = process.env.YAHOO_CLIENT_ID;
    if (!clientId) throw new Error('YAHOO_CLIENT_ID not configured');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid fspt-r',
    });

    return `${YAHOO_AUTH_URL}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<YahooOAuthTokens> {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Yahoo OAuth credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await response.json();
    return {
      ...tokens,
      expires_at: Date.now() + tokens.expires_in * 1000,
    };
  }

  async refreshAccessToken(): Promise<YahooOAuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Yahoo OAuth credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokens = await response.json();
    const newTokens: YahooOAuthTokens = {
      ...tokens,
      expires_at: Date.now() + tokens.expires_in * 1000,
    };

    this.setTokens(newTokens);
    return newTokens;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    // Refresh if token expires within 5 minutes
    if (this.tokenExpiresAt && this.tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }

  private async apiRequest<T>(endpoint: string, format = 'json'): Promise<T> {
    await this.ensureValidToken();

    const url = `${YAHOO_API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}format=${format}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Yahoo API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get user's leagues for a specific game (NFL)
  async getUserLeagues(gameKey: string = 'nfl'): Promise<YahooLeague[]> {
    const response = await this.apiRequest<{
      fantasy_content: {
        users: [
          {
            user: [
              unknown,
              {
                games: [{ game: [unknown, { leagues: { league: YahooLeague[] } }] }];
              },
            ];
          },
        ];
      };
    }>(`/users;use_login=1/games;game_keys=${gameKey}/leagues`);

    const games = response.fantasy_content.users[0]?.user[1]?.games;
    if (!games) return [];

    return games[0]?.game[1]?.leagues?.league || [];
  }

  // Get available NFL games (seasons)
  async getAvailableGames(): Promise<YahooGame[]> {
    const response = await this.apiRequest<{
      fantasy_content: {
        games: { game: YahooGame[] } | { count: number };
      };
    }>('/games;game_codes=nfl');

    console.log('Raw games response:', JSON.stringify(response, null, 2));

    const games = response.fantasy_content.games;
    if ('game' in games) {
      return games.game || [];
    }
    return [];
  }

  // Get league details
  async getLeague(leagueKey: string): Promise<YahooLeague> {
    const response = await this.apiRequest<{
      fantasy_content: {
        league: YahooLeague[];
      };
    }>(`/league/${leagueKey}`);

    return response.fantasy_content.league[0] as YahooLeague;
  }

  // Get all teams in a league with standings
  async getLeagueTeams(leagueKey: string): Promise<YahooTeam[]> {
    const response = await this.apiRequest<{
      fantasy_content: {
        league: [YahooLeague, { teams: { team: YahooTeam[] } }];
      };
    }>(`/league/${leagueKey}/teams;out=standings`);

    return response.fantasy_content.league[1]?.teams?.team || [];
  }

  // Get scoreboard (all matchups for a week)
  async getScoreboard(leagueKey: string, week?: number): Promise<YahooMatchup[]> {
    const weekParam = week ? `;week=${week}` : '';
    const response = await this.apiRequest<{
      fantasy_content: {
        league: [YahooLeague, { scoreboard: { matchups: { matchup: YahooMatchup[] } } }];
      };
    }>(`/league/${leagueKey}/scoreboard${weekParam}`);

    return response.fantasy_content.league[1]?.scoreboard?.matchups?.matchup || [];
  }

  // Get all matchups for the season
  async getAllMatchups(leagueKey: string, totalWeeks: number): Promise<YahooMatchup[]> {
    const allMatchups: YahooMatchup[] = [];

    for (let week = 1; week <= totalWeeks; week++) {
      const weekMatchups = await this.getScoreboard(leagueKey, week);
      allMatchups.push(...weekMatchups);
    }

    return allMatchups;
  }

  // Get transactions (trades only)
  async getTrades(leagueKey: string): Promise<YahooTransaction[]> {
    const response = await this.apiRequest<{
      fantasy_content: {
        league: [YahooLeague, { transactions: { transaction: YahooTransaction[] } }];
      };
    }>(`/league/${leagueKey}/transactions;types=trade`);

    return response.fantasy_content.league[1]?.transactions?.transaction || [];
  }
}

// Singleton for server-side usage
let yahooClient: YahooFantasyClient | null = null;

export function getYahooClient(tokens?: YahooOAuthTokens): YahooFantasyClient {
  if (!yahooClient) {
    yahooClient = new YahooFantasyClient(tokens);
  } else if (tokens) {
    yahooClient.setTokens(tokens);
  }
  return yahooClient;
}
