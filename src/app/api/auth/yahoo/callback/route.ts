import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YahooFantasyClient } from '@/lib/yahoo/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import/yahoo?error=${error || 'no_code'}`,
    );
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yahoo/callback`;
    const tokens = await YahooFantasyClient.exchangeCodeForTokens(code, redirectUri);

    // Store tokens in httpOnly cookie (encrypted in production)
    const cookieStore = await cookies();
    cookieStore.set('yahoo_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import/yahoo?success=true`,
    );
  } catch (err) {
    console.error('Yahoo callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import/yahoo?error=token_exchange_failed`,
    );
  }
}
