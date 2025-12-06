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

    // Try direct user leagues query first
    console.log('Fetching user leagues directly...');
    let leagues: YahooLeague[] = [];

    try {
      // Try with 'nfl' game code (current season)
      leagues = await client.getUserLeagues('nfl');
      console.log(`Found ${leagues.length} leagues with nfl game code`);
    } catch (e) {
      console.log('Error fetching nfl leagues:', e);
    }

    // If no leagues, try fetching raw user data to debug
    if (leagues.length === 0) {
      try {
        const rawResponse = await client.debugUserLeagues();
        console.log('Raw user leagues response:', rawResponse);
      } catch (e) {
        console.log('Debug error:', e);
      }
    }

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
