import { NextResponse } from 'next/server';
import { YahooFantasyClient } from '@/lib/yahoo/client';

export async function GET() {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yahoo/callback`;
    const authUrl = YahooFantasyClient.getAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Yahoo auth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import/yahoo?error=auth_failed`,
    );
  }
}
