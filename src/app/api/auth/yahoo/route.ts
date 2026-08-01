import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { YahooFantasyClient } from '@/lib/yahoo/client';
import { getCanonicalAppUrl, getYahooRedirectUri } from '@/lib/yahoo/oauth';

const OAUTH_STATE_COOKIE = 'yahoo_oauth_state';

export async function GET() {
  try {
    const redirectUri = getYahooRedirectUri();
    const state = randomBytes(32).toString('hex');
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/api/auth/yahoo',
    });

    const authUrl = YahooFantasyClient.getAuthUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Yahoo auth error:', error);
    return NextResponse.redirect(
      `${getCanonicalAppUrl()}/admin/import/yahoo?error=auth_failed`,
    );
  }
}
