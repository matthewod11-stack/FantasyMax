import { NextRequest, NextResponse } from 'next/server';
import { syncCurrentSeason } from '@/lib/yahoo/sync';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncCurrentSeason();

  if (!result.success) {
    console.error('[cron/yahoo-sync]', result.error);
    return NextResponse.json({ error: result.error, result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result });
}
