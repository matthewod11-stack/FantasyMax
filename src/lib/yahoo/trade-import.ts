import type { YahooTransaction, YahooTransactionPlayer } from './types';

export interface YahooTradeDbRow {
  season_id: string;
  team_1_id: string;
  team_2_id: string;
  team_1_sends: Array<{ name: string; position: string }>;
  team_2_sends: Array<{ name: string; position: string }>;
  trade_date: string;
  yahoo_trade_key: string;
}

export type YahooTradeSkipReason =
  | 'missing-team-key'
  | 'missing-team'
  | 'missing-timestamp'
  | 'missing-yahoo-trade-key';

export interface YahooTradeImportContext {
  seasonId: string;
  teamIdByYahooKey: Map<string, string>;
}

function tradeDateFromTimestamp(timestamp: number): string | null {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return new Date(timestamp * 1000).toISOString().split('T')[0] ?? null;
}

function inferTeamKeys(transaction: YahooTransaction): [string | null, string | null] {
  if (transaction.trader_team_key && transaction.tradee_team_key) {
    return [transaction.trader_team_key, transaction.tradee_team_key];
  }

  const sourceTeamKeys = new Set(
    transaction.players
      ?.map((player) => player.transaction_data?.source_team_key)
      .filter((key): key is string => Boolean(key)),
  );
  const [team1Key, team2Key] = Array.from(sourceTeamKeys);
  return [team1Key ?? null, team2Key ?? null];
}

function playerPayload(player: YahooTransactionPlayer) {
  return {
    name: player.name?.full || 'Unknown',
    position: '',
  };
}

export function mapYahooTradeToDbRow(
  transaction: YahooTransaction,
  context: YahooTradeImportContext,
): { row: YahooTradeDbRow | null; skippedReason: YahooTradeSkipReason | null } {
  const [team1Key, team2Key] = inferTeamKeys(transaction);
  if (!team1Key || !team2Key) {
    return { row: null, skippedReason: 'missing-team-key' };
  }

  const team1Id = context.teamIdByYahooKey.get(team1Key);
  const team2Id = context.teamIdByYahooKey.get(team2Key);
  if (!team1Id || !team2Id) {
    return { row: null, skippedReason: 'missing-team' };
  }

  const tradeDate = tradeDateFromTimestamp(transaction.timestamp);
  if (!tradeDate) {
    return { row: null, skippedReason: 'missing-timestamp' };
  }

  if (!transaction.transaction_key) {
    return { row: null, skippedReason: 'missing-yahoo-trade-key' };
  }

  return {
    row: {
      season_id: context.seasonId,
      team_1_id: team1Id,
      team_2_id: team2Id,
      team_1_sends: transaction.players
        ?.filter((player) => player.transaction_data?.source_team_key === team1Key)
        .map(playerPayload) ?? [],
      team_2_sends: transaction.players
        ?.filter((player) => player.transaction_data?.source_team_key === team2Key)
        .map(playerPayload) ?? [],
      trade_date: tradeDate,
      yahoo_trade_key: transaction.transaction_key,
    },
    skippedReason: null,
  };
}
