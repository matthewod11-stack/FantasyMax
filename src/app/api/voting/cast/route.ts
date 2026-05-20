import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { castVote } from '@/lib/supabase/queries/governance';

const schema = z.object({
  pollId: z.string().uuid(),
  memberId: z.string().uuid(),
  optionKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    await castVote(body.pollId, body.memberId, body.optionKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Vote failed' },
      { status: 500 },
    );
  }
}
