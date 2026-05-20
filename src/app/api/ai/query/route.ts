import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { getH2HBetweenMembers } from '@/lib/supabase/queries/h2h';

const schema = z.object({
  question: z.string().min(3).max(500),
});

/**
 * Simple NLQ: pattern-match common questions to DB lookups.
 */
export async function POST(request: NextRequest) {
  try {
    const { question } = schema.parse(await request.json());
    const q = question.toLowerCase();
    const supabase = await createAdminClient();

    const memberMatch = q.match(/against\s+([a-z\s]+)/i) || q.match(/vs\.?\s+([a-z\s]+)/i);
    if (memberMatch?.[1] && (q.includes('record') || q.includes('best'))) {
      const namePart = memberMatch[1].trim();
      const { data: members } = await supabase
        .from('members')
        .select('id, display_name')
        .ilike('display_name', `%${namePart}%`)
        .limit(5);

      if (members && members.length >= 2) {
        const m0 = members[0]!;
        const m1 = members[1]!;
        const record = await getH2HBetweenMembers(m0.id, m1.id);
        if (record) {
          return NextResponse.json({
            answer: `All-time: ${m0.display_name} ${record.member_1_wins}-${record.member_2_wins} vs ${m1.display_name} (${record.total_matchups} games).`,
            sql: 'getH2HBetweenMembers',
          });
        }
      }
      const single = members?.[0];
      if (single) {
        return NextResponse.json({
          answer: `Found ${single.display_name}. Ask with two names, e.g. "record against Paul".`,
        });
      }
    }

    if (q.includes('championship') || q.includes('won the most')) {
      const { data } = await supabase
        .from('teams')
        .select('member:members(display_name)')
        .eq('is_champion', true);

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (row.member as any)?.display_name ?? 'Unknown';
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) {
        return NextResponse.json({
          answer: `${top[0]} leads with ${top[1]} championship(s).`,
          sql: 'teams.is_champion count',
        });
      }
    }

    return NextResponse.json({
      answer:
        'Try: "Who has the best record against [name]?" or "Who won the most championships?"',
      suggestions: [
        'Best record against Mike',
        'Who won the most championships?',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 },
    );
  }
}
