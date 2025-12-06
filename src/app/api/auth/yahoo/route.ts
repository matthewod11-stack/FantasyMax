import { NextResponse } from 'next/server';
import { YahooFantasyClient } from '@/lib/yahoo/client';

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const redirectUri = `${appUrl}/api/auth/yahoo/callback`;
    const clientId = process.env.YAHOO_CLIENT_ID;

    console.log('=== Yahoo OAuth Debug ===');
    console.log('NEXT_PUBLIC_APP_URL:', appUrl);
    console.log('Redirect URI:', redirectUri);
    console.log('Client ID:', clientId?.substring(0, 20) + '...');

    const authUrl = YahooFantasyClient.getAuthUrl(redirectUri);
    console.log('Full Auth URL:', authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Yahoo auth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import/yahoo?error=auth_failed`,
    );
  }
}
