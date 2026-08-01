import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { syncYahooLeague } from '@/lib/yahoo/sync';
import { loadYahooCredentials, saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';

const syncRequestSchema = z.object({
  leagueKey: z.string().min(1),
  mode: z.enum(['full', 'incremental']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const hasLeagueAccess = cookieStore.get('league_access')?.value === 'granted';
    if (process.env.BYPASS_AUTH !== 'true' && !hasLeagueAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tokens = await loadYahooCredentials();

    if (!tokens) {
      return NextResponse.json({ error: 'Yahoo not connected' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: league } = await supabase.from('league').select('id').single();

    if (league) {
      await saveYahooCredentials(league.id, tokens);
    }

    const body = await request.json();
    const { leagueKey, mode } = syncRequestSchema.parse(body);

    const result = await syncYahooLeague({
      leagueKey,
      mode: mode ?? 'full',
      startedBy: null,
      source: 'yahoo',
      tokens,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teamsImported: result.teamsImported,
      matchupsImported: result.matchupsImported,
      tradesImported: result.tradesImported,
    });
  } catch (error) {
    console.error('Yahoo sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
