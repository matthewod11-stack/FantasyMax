import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YahooFantasyClient } from '@/lib/yahoo/client';
import { saveYahooCredentials } from '@/lib/yahoo/credentials';
import { createAdminClient } from '@/lib/supabase/server';
import { getCanonicalAppUrl, getYahooRedirectUri } from '@/lib/yahoo/oauth';

const OAUTH_STATE_COOKIE = 'yahoo_oauth_state';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const returnedState = searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (error || !code) {
    cookieStore.delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(
      `${getCanonicalAppUrl()}/admin/import/yahoo?error=${error || 'no_code'}`,
    );
  }

  if (!expectedState || !returnedState || returnedState !== expectedState) {
    cookieStore.delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(
      `${getCanonicalAppUrl()}/admin/import/yahoo?error=invalid_state`,
    );
  }

  cookieStore.delete(OAUTH_STATE_COOKIE);

  try {
    const redirectUri = getYahooRedirectUri();
    const tokens = await YahooFantasyClient.exchangeCodeForTokens(code, redirectUri);

    const supabase = await createAdminClient();
    const { data: league } = await supabase.from('league').select('id').single();
    if (league) {
      await saveYahooCredentials(league.id, tokens);
    }

    return NextResponse.redirect(
      `${getCanonicalAppUrl()}/admin/import/yahoo?success=true`,
    );
  } catch (err) {
    console.error('Yahoo callback error:', err);
    return NextResponse.redirect(
      `${getCanonicalAppUrl()}/admin/import/yahoo?error=token_exchange_failed`,
    );
  }
}
