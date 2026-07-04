#!/usr/bin/env npx tsx
/**
 * Audit Yahoo Trade Availability
 *
 * Read-only diagnostic for Task 8. Fetches Yahoo trade transactions for the
 * configured league key and prints counts plus a sanitized sample shape.
 *
 * Usage:
 *   npx tsx scripts/audit-yahoo-trades.ts
 *   npx tsx scripts/audit-yahoo-trades.ts --league-key=461.l.175829
 *   npx tsx scripts/audit-yahoo-trades.ts --sample=3
 *   npx tsx scripts/audit-yahoo-trades.ts --all-leagues
 *   npx tsx scripts/audit-yahoo-trades.ts --env-file=/tmp/fantasymax-production.env
 *
 * This script does not write to Supabase and does not persist refreshed Yahoo tokens.
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { decryptJson } from '../src/lib/crypto/tokens';
import { YahooFantasyClient } from '../src/lib/yahoo/client';
import {
  extractYahooTransactionNodes,
  sanitizeYahooTransactionForAudit,
} from '../src/lib/yahoo/trade-diagnostics';
import type { YahooOAuthTokens } from '../src/lib/yahoo/types';

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

dotenv.config({ path: argValue('env-file') ?? '.env.local', quiet: true });

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadConfiguredLeagueAndTokens() {
  const supabase = createSupabaseClient();

  const { data: league, error: leagueError } = await supabase
    .from('league')
    .select('id, yahoo_league_key')
    .single();

  if (leagueError || !league) {
    throw new Error(`Unable to load league record: ${leagueError?.message ?? 'not found'}`);
  }

  const { data: credentials, error: credentialsError } = await supabase
    .from('yahoo_credentials')
    .select('encrypted_tokens')
    .eq('league_id', league.id)
    .maybeSingle();

  if (credentialsError) {
    throw new Error(`Unable to load Yahoo credentials: ${credentialsError.message}`);
  }

  if (!credentials) {
    throw new Error('No Yahoo credentials stored. Reconnect Yahoo from production Admin first.');
  }

  return {
    leagueKey: league.yahoo_league_key as string | null,
    tokens: decryptJson<YahooOAuthTokens>(credentials.encrypted_tokens as string),
  };
}

async function main() {
  const sampleLimit = Math.max(1, Number(argValue('sample') ?? 2));
  const configured = await loadConfiguredLeagueAndTokens();
  const leagueKeyOverride = argValue('league-key');
  const leagueKey = leagueKeyOverride ?? configured.leagueKey;

  if (!leagueKey) {
    throw new Error('No Yahoo league key configured. Pass --league-key=<key> to audit a specific league.');
  }

  const yahoo = new YahooFantasyClient(configured.tokens);
  const leagues = hasFlag('all-leagues')
    ? await yahoo.getAllUserLeagues()
    : [{ league_key: leagueKey, name: 'Configured league', season: 'configured' }];
  const auditTargets = leagues
    .filter((league): league is { league_key: string; name?: string; season?: string } => {
      return Boolean(league.league_key);
    })
    .filter((league) => !leagueKeyOverride || league.league_key === leagueKeyOverride);
  const allSummaries = [];
  const leagueResults = [];

  for (const league of auditTargets) {
    const raw = await yahoo.getLeagueTransactionsRaw(league.league_key);
    const transactionNodes = extractYahooTransactionNodes(raw);
    const summaries = transactionNodes.map(sanitizeYahooTransactionForAudit);
    const tradeSummaries = summaries.filter((summary) => summary.type === 'trade');

    allSummaries.push(...summaries.map((summary) => ({
      leagueKey: league.league_key,
      season: league.season ?? null,
      leagueName: league.name ?? null,
      ...summary,
    })));

    leagueResults.push({
      leagueKey: league.league_key,
      season: league.season ?? null,
      leagueName: league.name ?? null,
      transactionsReturned: transactionNodes.length,
      tradeTransactionsReturned: tradeSummaries.length,
    });
  }

  const totalTransactions = leagueResults.reduce(
    (sum, result) => sum + result.transactionsReturned,
    0,
  );
  const totalTrades = leagueResults.reduce(
    (sum, result) => sum + result.tradeTransactionsReturned,
    0,
  );

  console.log('='.repeat(64));
  console.log('YAHOO TRADE DIAGNOSTIC - READ ONLY');
  console.log('='.repeat(64));
  console.log(`League scope: ${hasFlag('all-leagues') ? `${auditTargets.length} accessible NFL leagues` : leagueKey}`);
  console.log(`Transactions returned: ${totalTransactions}`);
  console.log(`Trade transactions returned: ${totalTrades}`);
  console.log('Writes performed: 0');
  console.log('');

  if (hasFlag('all-leagues')) {
    console.log('League results:');
    console.log(JSON.stringify(leagueResults, null, 2));
    console.log('');
  }

  if (allSummaries.length === 0) {
    console.log('No trade transactions were returned by Yahoo for this league scope.');
    return;
  }

  console.log(`Sanitized sample (${Math.min(sampleLimit, allSummaries.length)} of ${allSummaries.length}):`);
  console.log(JSON.stringify(allSummaries.slice(0, sampleLimit), null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
