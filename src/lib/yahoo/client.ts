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

  // Debug method to see raw user leagues response
  async debugUserLeagues(): Promise<string> {
    const response = await this.apiRequest<unknown>('/users;use_login=1/games;game_codes=nfl/leagues');
    return JSON.stringify(response).substring(0, 1000); // Truncate for logging
  }

  // Helper to convert Yahoo's object-with-numeric-keys to array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private yahooObjectToArray(obj: Record<string, any> | undefined): any[] {
    if (!obj) return [];
    return Object.keys(obj)
      .filter(key => !isNaN(Number(key)))
      .map(key => obj[key]);
  }

  // Get all user's leagues across all NFL seasons
  async getAllUserLeagues(): Promise<YahooLeague[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.apiRequest<any>('/users;use_login=1/games;game_codes=nfl/leagues');

    const allLeagues: YahooLeague[] = [];

    try {
      const users = response.fantasy_content?.users;
      const userArray = this.yahooObjectToArray(users);

      for (const userObj of userArray) {
        const userData = userObj?.user;
        if (!Array.isArray(userData) || userData.length < 2) continue;

        const gamesObj = userData[1]?.games;
        const gamesArray = this.yahooObjectToArray(gamesObj);

        for (const gameObj of gamesArray) {
          const gameData = gameObj?.game;
          if (!Array.isArray(gameData) || gameData.length < 2) continue;

          const gameInfo = gameData[0];
          const leaguesObj = gameData[1]?.leagues;
          const leaguesArray = this.yahooObjectToArray(leaguesObj);

          for (const leagueObj of leaguesArray) {
            const leagueData = leagueObj?.league;
            if (Array.isArray(leagueData) && leagueData[0]) {
              // Add season from game info
              allLeagues.push({
                ...leagueData[0],
                season: gameInfo?.season,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing Yahoo leagues:', e);
    }

    console.log(`Parsed ${allLeagues.length} leagues from Yahoo`);
    return allLeagues;
  }

  // Get user's leagues for a specific game (NFL) - legacy method
  async getUserLeagues(gameKey: string = 'nfl'): Promise<YahooLeague[]> {
    // Use the new method that handles all seasons
    return this.getAllUserLeagues();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.apiRequest<any>(`/league/${leagueKey}`);

    console.log('getLeague raw response:', JSON.stringify(response).substring(0, 1000));

    // Yahoo returns league as array or object with numeric keys
    const leagueData = response.fantasy_content?.league;
    console.log('leagueData type:', Array.isArray(leagueData) ? 'array' : typeof leagueData);

    if (Array.isArray(leagueData)) {
      return leagueData[0] as YahooLeague;
    }
    // Handle object with numeric keys: {"0": {...}, "1": {...}}
    const leagueArray = this.yahooObjectToArray(leagueData);
    console.log('leagueArray length:', leagueArray.length, 'first item:', JSON.stringify(leagueArray[0]).substring(0, 300));
    return leagueArray[0] as YahooLeague;
  }

  // Get all teams in a league with standings
  async getLeagueTeams(leagueKey: string): Promise<YahooTeam[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.apiRequest<any>(`/league/${leagueKey}/teams;out=standings`);

    console.log('getLeagueTeams raw response:', JSON.stringify(response).substring(0, 2000));

    // Yahoo returns league as array or object with numeric keys
    const leagueData = response.fantasy_content?.league;
    console.log('teams leagueData type:', Array.isArray(leagueData) ? 'array' : typeof leagueData);

    const leagueArray = Array.isArray(leagueData) ? leagueData : this.yahooObjectToArray(leagueData);
    console.log('teams leagueArray length:', leagueArray.length);

    // Second element contains teams
    const teamsContainer = leagueArray[1]?.teams;
    console.log('teamsContainer:', teamsContainer ? 'exists' : 'undefined', 'type:', typeof teamsContainer);

    if (!teamsContainer) return [];

    // Teams can be in .team array or as object with numeric keys
    if (Array.isArray(teamsContainer.team)) {
      console.log('teams in .team array, count:', teamsContainer.team.length);
      return teamsContainer.team;
    }

    const teamsArray = this.yahooObjectToArray(teamsContainer);
    console.log('teams from object keys, count:', teamsArray.length);
    return teamsArray;
  }

  // Get scoreboard (all matchups for a week)
  async getScoreboard(leagueKey: string, week?: number): Promise<YahooMatchup[]> {
    const weekParam = week ? `;week=${week}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.apiRequest<any>(`/league/${leagueKey}/scoreboard${weekParam}`);

    // Yahoo returns league as array or object with numeric keys
    const leagueData = response.fantasy_content?.league;
    const leagueArray = Array.isArray(leagueData) ? leagueData : this.yahooObjectToArray(leagueData);

    // Second element contains scoreboard
    const matchupsContainer = leagueArray[1]?.scoreboard?.matchups;
    if (!matchupsContainer) return [];

    // Matchups can be in .matchup array or as object with numeric keys
    if (Array.isArray(matchupsContainer.matchup)) {
      return matchupsContainer.matchup;
    }
    return this.yahooObjectToArray(matchupsContainer);
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
