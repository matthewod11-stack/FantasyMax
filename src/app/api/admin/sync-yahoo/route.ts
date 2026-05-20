import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { syncYahooLeague } from '@/lib/yahoo/sync';
import type { YahooOAuthTokens } from '@/lib/yahoo/types';
import { saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  leagueKey: z.string().optional(),
  mode: z.enum(['full', 'incremental']).optional(),
  weeks: z.array(z.number()).optional(),
});

async function ensureAdminAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const hasLeagueAccess = cookieStore.get('league_access')?.value === 'granted';
  if (process.env.BYPASS_AUTH === 'true' || hasLeagueAccess) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!(await ensureAdminAccess())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.parse(body);

    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('yahoo_tokens');

    let sessionTokens: YahooOAuthTokens | undefined;
    if (tokensCookie?.value) {
      sessionTokens = JSON.parse(tokensCookie.value) as YahooOAuthTokens;
      const supabase = await createAdminClient();
      const { data: league } = await supabase.from('league').select('id').single();
      if (league) {
        await saveYahooCredentials(league.id, sessionTokens);
      }
    }

    const result = await syncYahooLeague({
      leagueKey: parsed.leagueKey,
      mode: parsed.mode ?? 'incremental',
      weeks: parsed.weeks,
      source: 'yahoo',
      tokens: sessionTokens,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
