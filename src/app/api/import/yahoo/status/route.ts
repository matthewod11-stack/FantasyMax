import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getYahooClient } from '@/lib/yahoo/client';
import type { YahooOAuthTokens, YahooLeague } from '@/lib/yahoo/types';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('yahoo_tokens');

    if (!tokensCookie?.value) {
      return NextResponse.json({ connected: false });
    }

    const tokens: YahooOAuthTokens = JSON.parse(tokensCookie.value);
    const client = getYahooClient(tokens);

    // Fetch all user leagues across all seasons
    console.log('Fetching all user leagues...');
    const leagues = await client.getAllUserLeagues();
    console.log(`Found ${leagues.length} total leagues`);

    // Update tokens if refreshed
    const updatedTokens = client.getTokens();
    if (updatedTokens && updatedTokens.access_token !== tokens.access_token) {
      cookieStore.set('yahoo_tokens', JSON.stringify(updatedTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return NextResponse.json({
      connected: true,
      leagues: leagues.map((league) => ({
        league_key: league.league_key,
        name: league.name,
        season: league.season,
        num_teams: league.num_teams,
      })),
    });
  } catch (error) {
    console.error('Yahoo status check error:', error);
    return NextResponse.json({ connected: false, error: 'Connection check failed' });
  }
}
