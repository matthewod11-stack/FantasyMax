import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteYahooCredentials } from '@/lib/yahoo/credentials';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('yahoo_tokens');
    await deleteYahooCredentials();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Yahoo disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
