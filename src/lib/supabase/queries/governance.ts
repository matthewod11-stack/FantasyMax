import { createAdminClient } from '../server';

export interface PollWithVotes {
  id: string;
  title: string;
  description: string | null;
  status: string;
  isAnonymous: boolean;
  endsAt: string | null;
  options: { key: string; label: string; votes: number }[];
}

export async function getOpenPolls(): Promise<PollWithVotes[]> {
  const supabase = await createAdminClient();

  const { data: polls } = await supabase
    .from('polls')
    .select('id, title, description, status, is_anonymous, closes_at, options')
    .in('status', ['open', 'closed'])
    .order('created_at', { ascending: false });

  const results: PollWithVotes[] = [];

  for (const poll of polls ?? []) {
    const { data: votes } = await supabase
      .from('votes')
      .select('selection')
      .eq('poll_id', poll.id);

    const options = (poll.options as { key: string; label: string }[]) ?? [];
    const counts = new Map<string, number>();
    for (const v of votes ?? []) {
      const sel = v.selection as { option?: string; optionKey?: string };
      const key = sel?.optionKey ?? sel?.option ?? '';
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    results.push({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status ?? 'draft',
      isAnonymous: poll.is_anonymous ?? false,
      endsAt: poll.closes_at,
      options: options.map((o) => ({
        ...o,
        votes: counts.get(o.key) ?? 0,
      })),
    });
  }

  return results;
}

export async function getRules(): Promise<
  { id: string; title: string; content: string; category: string | null; sortOrder: number }[]
> {
  const supabase = await createAdminClient();
  const { data: league } = await supabase.from('league').select('id').single();
  if (!league) return [];

  const { data } = await supabase
    .from('rules')
    .select('id, title, content, category, sort_order')
    .eq('league_id', league.id)
    .order('sort_order', { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    sortOrder: r.sort_order ?? 0,
  }));
}

export async function castVote(
  pollId: string,
  memberId: string,
  optionKey: string,
): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('votes').upsert(
    {
      poll_id: pollId,
      member_id: memberId,
      selection: { optionKey },
    },
    { onConflict: 'poll_id,member_id' },
  );
  if (error) throw error;
}
