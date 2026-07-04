#!/usr/bin/env npx tsx
/**
 * Import Yahoo Trades
 *
 * Controlled Task 8 importer. Defaults to dry-run and only writes when --run is passed.
 *
 * Usage:
 *   npx tsx scripts/import-yahoo-trades.ts
 *   npx tsx scripts/import-yahoo-trades.ts --run
 *   npx tsx scripts/import-yahoo-trades.ts --season=2024
 *   npx tsx scripts/import-yahoo-trades.ts --env-file=/tmp/fantasymax-production.env --run
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { decryptJson } from '../src/lib/crypto/tokens';
import { mapYahooTradeToDbRow, type YahooTradeSkipReason } from '../src/lib/yahoo/trade-import';
import { YahooFantasyClient } from '../src/lib/yahoo/client';
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

async function loadYahooTokens(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: league, error: leagueError } = await supabase
    .from('league')
    .select('id')
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

  return decryptJson<YahooOAuthTokens>(credentials.encrypted_tokens as string);
}

async function main() {
  const dryRun = !hasFlag('run');
  const onlySeason = argValue('season') ? Number(argValue('season')) : null;
  const supabase = createSupabaseClient();
  const tokens = await loadYahooTokens(supabase);
  const yahoo = new YahooFantasyClient(tokens);
  const yahooLeagues = await yahoo.getAllUserLeagues();

  const { data: seasons, error: seasonsError } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: true });

  if (seasonsError) {
    throw new Error(`Unable to load seasons: ${seasonsError.message}`);
  }

  const seasonByYear = new Map((seasons ?? []).map((season) => [season.year, season.id]));
  const skipCounts: Record<YahooTradeSkipReason | 'no-season' | 'write-error', number> = {
    'missing-team-key': 0,
    'missing-team': 0,
    'missing-timestamp': 0,
    'missing-yahoo-trade-key': 0,
    'no-season': 0,
    'write-error': 0,
  };
  const seasonResults = [];
  let yahooTradesFound = 0;
  let mappedRows = 0;
  let writtenRows = 0;

  for (const yahooLeague of yahooLeagues) {
    const seasonYear = Number(yahooLeague.season);
    if (!seasonYear || (onlySeason && seasonYear !== onlySeason)) continue;

    const seasonId = seasonByYear.get(seasonYear);
    if (!seasonId) {
      const trades = await yahoo.getTrades(yahooLeague.league_key);
      if (trades.length > 0) skipCounts['no-season'] += trades.length;
      continue;
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, yahoo_team_key')
      .eq('season_id', seasonId);

    if (teamsError) {
      throw new Error(`Unable to load teams for ${seasonYear}: ${teamsError.message}`);
    }

    const teamIdByYahooKey = new Map(
      (teams ?? [])
        .filter((team) => team.yahoo_team_key)
        .map((team) => [team.yahoo_team_key as string, team.id as string]),
    );
    const trades = await yahoo.getTrades(yahooLeague.league_key);
    let seasonMapped = 0;
    let seasonWritten = 0;

    yahooTradesFound += trades.length;

    for (const trade of trades) {
      const { row, skippedReason } = mapYahooTradeToDbRow(trade, {
        seasonId,
        teamIdByYahooKey,
      });

      if (!row) {
        if (skippedReason) skipCounts[skippedReason]++;
        continue;
      }

      mappedRows++;
      seasonMapped++;

      if (!dryRun) {
        const { error } = await supabase.from('trades').upsert(
          row,
          { onConflict: 'yahoo_trade_key', ignoreDuplicates: false },
        );

        if (error) {
          skipCounts['write-error']++;
          console.error(`Write error for ${row.yahoo_trade_key}: ${error.message}`);
          continue;
        }

        writtenRows++;
        seasonWritten++;
      }
    }

    if (trades.length > 0) {
      seasonResults.push({
        season: seasonYear,
        leagueKey: yahooLeague.league_key,
        leagueName: yahooLeague.name,
        yahooTrades: trades.length,
        mappedRows: seasonMapped,
        writtenRows: seasonWritten,
      });
    }
  }

  console.log('='.repeat(64));
  console.log('YAHOO TRADE IMPORT');
  console.log('='.repeat(64));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE WRITE'}`);
  console.log(`Season filter: ${onlySeason ?? 'all app seasons'}`);
  console.log(`Yahoo trades found: ${yahooTradesFound}`);
  console.log(`Rows mapped: ${mappedRows}`);
  console.log(`Rows written: ${writtenRows}`);
  console.log(`Skipped: ${Object.values(skipCounts).reduce((sum, count) => sum + count, 0)}`);
  console.log('');
  console.log('By season:');
  console.log(JSON.stringify(seasonResults, null, 2));
  console.log('');
  console.log('Skip counts:');
  console.log(JSON.stringify(skipCounts, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
