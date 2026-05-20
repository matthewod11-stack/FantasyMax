import { createAdminClient } from '@/lib/supabase/server';
import { getOpenPolls } from '@/lib/supabase/queries/governance';
import { VotingClient } from '@/components/features/governance/VotingClient';

export const metadata = {
  title: 'Voting | League of Degenerates',
};

export default async function VotingPage() {
  const supabase = await createAdminClient();
  const polls = await getOpenPolls();
  const { data: members } = await supabase
    .from('members')
    .select('id, display_name')
    .eq('is_active', true)
    .order('display_name');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase">League Voting</h1>
        <p className="text-muted-foreground">Degenerate democracy — every vote on the record</p>
      </div>
      <VotingClient polls={polls} members={members ?? []} />
    </div>
  );
}
