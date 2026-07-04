import type { YahooTransaction, YahooTransactionPlayer } from './types';

export interface YahooTradeAuditPlayer {
  name: string | null;
  sourceTeamKey: string | null;
  destinationTeamKey: string | null;
  transactionType: string | null;
}

export interface YahooTradeAuditSummary {
  transactionKey: string | null;
  transactionId: string | null;
  type: string | null;
  status: string | null;
  timestamp: number | null;
  timestampIso: string | null;
  traderTeamKey: string | null;
  tradeeTeamKey: string | null;
  playerCount: number;
  players: YahooTradeAuditPlayer[];
  topLevelKeys: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function numericValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  return Object.keys(value)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key]);
}

function flattenYahooArray(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, unknown>>((acc, item) => {
      if (Array.isArray(item)) {
        Object.assign(acc, flattenYahooArray(item));
      } else if (isRecord(item)) {
        Object.assign(acc, item);
      }
      return acc;
    }, {});
  }

  return isRecord(value) ? value : {};
}

function topLevelKeysFromNode(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((item) => (isRecord(item) ? Object.keys(item) : []));
  }

  if (isRecord(node)) {
    return Object.keys(node);
  }

  return [];
}

function unwrapLeagueParts(response: unknown): unknown[] {
  const fantasyContent = isRecord(response) ? response.fantasy_content : null;
  const league = isRecord(fantasyContent) ? fantasyContent.league : null;
  return numericValues(league);
}

export function extractYahooTransactionNodes(response: unknown): unknown[] {
  const leagueParts = unwrapLeagueParts(response);
  const transactionsPart = leagueParts.find(
    (part) => isRecord(part) && isRecord(part.transactions),
  );

  if (!isRecord(transactionsPart)) return [];

  const transactionNodes = numericValues(transactionsPart.transactions);
  return transactionNodes
    .map((node) => (isRecord(node) && 'transaction' in node ? node.transaction : node))
    .filter(Boolean);
}

function normalizeTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function timestampIso(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  return new Date(timestamp * 1000).toISOString();
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function extractPlayerNodes(players: unknown): unknown[] {
  return numericValues(players)
    .map((node) => (isRecord(node) && 'player' in node ? node.player : node))
    .filter(Boolean);
}

function sanitizePlayerForAudit(playerNode: unknown): YahooTradeAuditPlayer {
  const playerParts = numericValues(playerNode);
  const playerInfo = flattenYahooArray(playerParts[0] ?? playerNode);
  const transactionInfo = flattenYahooArray(
    isRecord(playerParts[1]) ? playerParts[1].transaction_data : playerInfo.transaction_data,
  );
  const name = isRecord(playerInfo.name) ? stringOrNull(playerInfo.name.full) : null;

  return {
    name,
    sourceTeamKey: stringOrNull(transactionInfo.source_team_key),
    destinationTeamKey: stringOrNull(transactionInfo.destination_team_key),
    transactionType: stringOrNull(transactionInfo.type),
  };
}

function parsePlayerForImport(playerNode: unknown): YahooTransactionPlayer {
  const playerParts = numericValues(playerNode);
  const playerInfo = flattenYahooArray(playerParts[0] ?? playerNode);
  const transactionInfo = flattenYahooArray(
    isRecord(playerParts[1]) ? playerParts[1].transaction_data : playerInfo.transaction_data,
  );
  const name = isRecord(playerInfo.name) ? playerInfo.name : {};

  return {
    player_key: stringOrNull(playerInfo.player_key) ?? '',
    player_id: stringOrNull(playerInfo.player_id) ?? '',
    name: {
      full: stringOrNull(name.full) ?? 'Unknown',
      first: stringOrNull(name.first) ?? '',
      last: stringOrNull(name.last) ?? '',
    },
    transaction_data: {
      type: 'trade',
      source_team_key: stringOrNull(transactionInfo.source_team_key) ?? undefined,
      destination_team_key: stringOrNull(transactionInfo.destination_team_key) ?? undefined,
    },
  };
}

export function sanitizeYahooTransactionForAudit(node: unknown): YahooTradeAuditSummary {
  const transaction = flattenYahooArray(node);
  const timestamp = normalizeTimestamp(transaction.timestamp);
  const players = extractPlayerNodes(transaction.players).map(sanitizePlayerForAudit);

  return {
    transactionKey: stringOrNull(transaction.transaction_key),
    transactionId: stringOrNull(transaction.transaction_id),
    type: stringOrNull(transaction.type),
    status: stringOrNull(transaction.status),
    timestamp,
    timestampIso: timestampIso(timestamp),
    traderTeamKey: stringOrNull(transaction.trader_team_key),
    tradeeTeamKey: stringOrNull(transaction.tradee_team_key),
    playerCount: players.length,
    players,
    topLevelKeys: topLevelKeysFromNode(node),
  };
}

export function parseYahooTradeTransactions(response: unknown): YahooTransaction[] {
  const trades: YahooTransaction[] = [];

  for (const node of extractYahooTransactionNodes(response)) {
    const transaction = flattenYahooArray(node);
    const type = stringOrNull(transaction.type);
    if (type !== 'trade') continue;

    trades.push({
      transaction_key: stringOrNull(transaction.transaction_key) ?? '',
      transaction_id: stringOrNull(transaction.transaction_id) ?? '',
      type,
      status: stringOrNull(transaction.status) ?? '',
      timestamp: normalizeTimestamp(transaction.timestamp) ?? 0,
      players: extractPlayerNodes(transaction.players).map(parsePlayerForImport),
      trader_team_key: stringOrNull(transaction.trader_team_key) ?? undefined,
      tradee_team_key: stringOrNull(transaction.tradee_team_key) ?? undefined,
    });
  }

  return trades;
}
