import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructured, trashTalkSchema } from '@/lib/ai/structured';
import { buildTrashTalkPrompt } from '@/lib/ai/prompts';
import { createAdminClient } from '@/lib/supabase/server';
import { getH2HBetweenMembers, getH2HMatchups } from '@/lib/supabase/queries/h2h';

const bodySchema = z.object({
  member1Id: z.string().uuid(),
  member2Id: z.string().uuid(),
  tone: z.enum(['friendly', 'savage', 'espn']).default('friendly'),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const supabase = await createAdminClient();

    const [{ data: m1 }, { data: m2 }] = await Promise.all([
      supabase.from('members').select('display_name').eq('id', body.member1Id).single(),
      supabase.from('members').select('display_name').eq('id', body.member2Id).single(),
    ]);

    if (!m1 || !m2) {
      return NextResponse.json({ error: 'Members not found' }, { status: 404 });
    }

    const record = await getH2HBetweenMembers(body.member1Id, body.member2Id);
    const history = await getH2HMatchups(body.member1Id, body.member2Id);

    const lastThree = history
      .slice(0, 3)
      .map((h) => `W${h.week} ${h.home_score}-${h.away_score}`)
      .join('; ');

    const prompt = buildTrashTalkPrompt({
      speaker: m1.display_name,
      target: m2.display_name,
      winsSpeaker: record?.member_1_wins ?? 0,
      winsTarget: record?.member_2_wins ?? 0,
      lastThree: lastThree || 'No recent matchups',
      tone: body.tone,
    });

    const result = await generateStructured({
      schema: trashTalkSchema,
      prompt,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
