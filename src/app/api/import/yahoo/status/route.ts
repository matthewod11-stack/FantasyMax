import { NextResponse } from 'next/server';
import { getYahooClient } from '@/lib/yahoo/client';
import { loadYahooCredentials, saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const tokens = await loadYahooCredentials();

    if (!tokens) {
      return NextResponse.json({ connected: false });
    }

    const client = getYahooClient(tokens);

    // Fetch all user leagues across all seasons
    console.log('Fetching all user leagues...');
    const leagues = await client.getAllUserLeagues();
    console.log(`Found ${leagues.length} total leagues`);

    // Update tokens if refreshed
    const updatedTokens = client.getTokens();
    if (updatedTokens && updatedTokens.access_token !== tokens.access_token) {
      const supabase = await createAdminClient();
      const { data: league } = await supabase.from('league').select('id').single();
      if (league) {
        await saveYahooCredentials(league.id, updatedTokens);
      }
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
