import { createAdminClient } from '../server';

export interface TradeTimelineItem {
  id: string;
  tradeDate: string;
  week: number | null;
  seasonYear: number;
  team1Name: string;
  team2Name: string;
  team1MemberName: string;
  team2MemberName: string;
  team1Sends: { name: string; position?: string }[];
  team2Sends: { name: string; position?: string }[];
}

export async function getTradeTimeline(options?: {
  seasonId?: string;
  memberId?: string;
  limit?: number;
}): Promise<TradeTimelineItem[]> {
  const supabase = await createAdminClient();

  let query = supabase
    .from('trades')
    .select(
      `
      id,
      trade_date,
      week,
      team_1_sends,
      team_2_sends,
      seasons!inner(year),
      team_1:teams!trades_team_1_id_fkey(
        team_name,
        member:members(display_name)
      ),
      team_2:teams!trades_team_2_id_fkey(
        team_name,
        member:members(display_name)
      )
    `,
    )
    .order('trade_date', { ascending: false });

  if (options?.seasonId) {
    query = query.eq('season_id', options.seasonId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  let items = (data ?? []).map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t1 = t.team_1 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t2 = t.team_2 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seasons = t.seasons as any;

    return {
      id: t.id,
      tradeDate: t.trade_date,
      week: t.week,
      seasonYear: seasons?.year ?? 0,
      team1Name: t1?.team_name ?? 'Team 1',
      team2Name: t2?.team_name ?? 'Team 2',
      team1MemberName: t1?.member?.display_name ?? 'Unknown',
      team2MemberName: t2?.member?.display_name ?? 'Unknown',
      team1Sends: (t.team_1_sends as { name: string; position?: string }[]) ?? [],
      team2Sends: (t.team_2_sends as { name: string; position?: string }[]) ?? [],
      team1MemberId: t1?.member?.id,
      team2MemberId: t2?.member?.id,
    };
  });

  if (options?.memberId) {
    items = items.filter(
      (t) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t as any).team1MemberId === options.memberId ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t as any).team2MemberId === options.memberId,
    );
  }

  return items.map(({ team1MemberId: _a, team2MemberId: _b, ...rest }) => rest);
}

export async function getTradeCount(): Promise<number> {
  const supabase = await createAdminClient();
  const { count } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
