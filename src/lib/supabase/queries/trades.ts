import { createAdminClient } from '../server';
import { formatTradeChampionshipImpact } from '@/lib/trades/story';

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
  championshipImpact: string | null;
}

interface TradeTimelineItemWithMemberIds extends TradeTimelineItem {
  team1MemberId?: string;
  team2MemberId?: string;
}

export async function getTradeTimeline(options?: {
  seasonId?: string;
  seasonYear?: number;
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
        is_champion,
        member:members(id, display_name)
      ),
      team_2:teams!trades_team_2_id_fkey(
        team_name,
        is_champion,
        member:members(id, display_name)
      )
    `,
    )
    .order('trade_date', { ascending: false });

  if (options?.seasonId) {
    query = query.eq('season_id', options.seasonId);
  }

  if (options?.seasonYear) {
    query = query.eq('seasons.year', options.seasonYear);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  let items: TradeTimelineItemWithMemberIds[] = (data ?? []).map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t1 = t.team_1 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t2 = t.team_2 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seasons = t.seasons as any;

    const seasonYear = seasons?.year ?? 0;
    const team1MemberName = t1?.member?.display_name ?? 'Unknown';
    const team2MemberName = t2?.member?.display_name ?? 'Unknown';

    return {
      id: t.id,
      tradeDate: t.trade_date,
      week: t.week,
      seasonYear,
      team1Name: t1?.team_name ?? 'Team 1',
      team2Name: t2?.team_name ?? 'Team 2',
      team1MemberName,
      team2MemberName,
      team1Sends: (t.team_1_sends as { name: string; position?: string }[]) ?? [],
      team2Sends: (t.team_2_sends as { name: string; position?: string }[]) ?? [],
      championshipImpact: formatTradeChampionshipImpact({
        seasonYear,
        team1MemberName,
        team2MemberName,
        team1IsChampion: Boolean(t1?.is_champion),
        team2IsChampion: Boolean(t2?.is_champion),
      }),
      team1MemberId: t1?.member?.id,
      team2MemberId: t2?.member?.id,
    };
  });

  if (options?.memberId) {
    items = items.filter(
      (t) =>
        t.team1MemberId === options.memberId ||
        t.team2MemberId === options.memberId,
    );
  }

  return items.map((item) => ({
    id: item.id,
    tradeDate: item.tradeDate,
    week: item.week,
    seasonYear: item.seasonYear,
    team1Name: item.team1Name,
    team2Name: item.team2Name,
    team1MemberName: item.team1MemberName,
    team2MemberName: item.team2MemberName,
    team1Sends: item.team1Sends,
    team2Sends: item.team2Sends,
    championshipImpact: item.championshipImpact,
  }));
}

export async function getSeasonArcTrades(
  seasonId: string,
  limit: number = 4,
): Promise<TradeTimelineItem[]> {
  try {
    return await getTradeTimeline({ seasonId, limit });
  } catch (error) {
    console.error('[getSeasonArcTrades] Error:', error);
    return [];
  }
}

export async function getTradeCount(): Promise<number> {
  const supabase = await createAdminClient();
  const { count } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
