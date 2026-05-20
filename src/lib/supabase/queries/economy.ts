import { getUntypedAdminClient } from '../server';

export async function getChampionshipPayouts(seasonId: string) {
  const supabase = await getUntypedAdminClient();
  const { data } = await supabase
    .from('championship_payouts')
    .select('*')
    .eq('season_id', seasonId)
    .single();
  return data;
}

export async function getMemberBalance(memberId: string, seasonId: string) {
  const supabase = await getUntypedAdminClient();
  const { data } = await supabase
    .from('member_balances')
    .select('balance')
    .eq('member_id', memberId)
    .eq('season_id', seasonId)
    .single();
  return (data?.balance as number | undefined) ?? 50;
}

export async function getOpenProps(seasonId: string, week?: number) {
  const supabase = await getUntypedAdminClient();
  let q = supabase.from('prop_bets').select('*').eq('season_id', seasonId);
  if (week !== undefined) q = q.eq('week', week);
  const { data } = await q.order('created_at', { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    question: string;
    week: number;
    status: string;
  }>;
}

export async function getPropLeaderboard(seasonId: string) {
  const supabase = await getUntypedAdminClient();
  const { data: balances } = await supabase
    .from('member_balances')
    .select('balance, member:members(display_name)')
    .eq('season_id', seasonId)
    .order('balance', { ascending: false });

  return (balances ?? []) as unknown as Array<{
    balance: number;
    member: { display_name: string } | null;
  }>;
}
