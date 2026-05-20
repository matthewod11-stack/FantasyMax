import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { YahooFantasyClient } from './client';
import { loadYahooCredentials, saveYahooCredentials } from './credentials';
import { withRetry } from './retry';
import type { YahooOAuthTokens, YahooLeague, YahooMatchup } from './types';
import { generateWeeklyDigest } from '@/lib/supabase/queries/weekly-digest';

export interface SyncOptions {
  leagueKey?: string;
  mode?: 'full' | 'incremental';
  weeks?: number[];
  startedBy?: string | null;
  source?: 'yahoo' | 'cron';
  /** Session tokens (cookie) — used when DB credentials are not yet stored */
  tokens?: YahooOAuthTokens;
}

export interface SyncResult {
  success: boolean;
  seasonId?: string;
  seasonYear?: number;
  teamsImported: number;
  matchupsImported: number;
  tradesImported: number;
  weekSynced?: number;
  error?: string;
}

function mapMatchupStatus(yahooStatus: string): 'final' | 'in_progress' | 'scheduled' {
  if (yahooStatus === 'postevent') return 'final';
  if (yahooStatus === 'midevent') return 'in_progress';
  return 'scheduled';
}

function isChampionshipMatchup(matchup: YahooMatchup, totalWeeks: number): boolean {
  const weekNum = parseInt(matchup.week, 10);
  return matchup.is_playoffs && !matchup.is_consolation && weekNum >= totalWeeks;
}

async function upsertMemberForTeam(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yahooTeam: any,
  seasonYear: number,
) {
  const managerWrapper = yahooTeam.managers?.[0];
  const manager = managerWrapper?.manager || managerWrapper;
  if (!manager) return null;

  let { data: memberRecord } = await supabase
    .from('members')
    .select('id')
    .eq('yahoo_manager_id', manager.guid)
    .single();

  if (!memberRecord) {
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('display_name', manager.nickname)
      .single();

    if (existingMember) {
      await supabase
        .from('members')
        .update({ yahoo_manager_id: manager.guid })
        .eq('id', existingMember.id);
      memberRecord = existingMember;
    } else {
      const { data: newMember } = await supabase
        .from('members')
        .insert({
          display_name: manager.nickname,
          email: manager.email || null,
          yahoo_manager_id: manager.guid,
          joined_year: seasonYear,
          role: manager.is_commissioner ? 'commissioner' : 'member',
        })
        .select()
        .single();
      memberRecord = newMember;
    }
  }

  return memberRecord;
}

async function syncTeams(
  supabase: SupabaseClient,
  yahoo: YahooFantasyClient,
  leagueKey: string,
  seasonId: string,
  seasonYear: number,
): Promise<number> {
  const yahooTeams = await withRetry(() => yahoo.getLeagueTeams(leagueKey));
  let count = 0;

  for (const yahooTeam of yahooTeams) {
    const memberRecord = await upsertMemberForTeam(supabase, yahooTeam, seasonYear);
    if (!memberRecord) continue;

    const standings = yahooTeam.team_standings;
    await supabase.from('teams').upsert(
      {
        season_id: seasonId,
        member_id: memberRecord.id,
        team_name: yahooTeam.name,
        logo_url: yahooTeam.team_logo || null,
        yahoo_team_key: yahooTeam.team_key,
        yahoo_team_id: parseInt(yahooTeam.team_id, 10),
        final_rank: standings?.rank || null,
        final_record_wins: standings?.outcome_totals?.wins || 0,
        final_record_losses: standings?.outcome_totals?.losses || 0,
        final_record_ties: standings?.outcome_totals?.ties || 0,
        total_points_for: standings?.points_for || 0,
        total_points_against: standings?.points_against || 0,
        playoff_seed: standings?.playoff_seed || null,
        is_champion: standings?.rank === 1,
      },
      { onConflict: 'season_id,member_id' },
    );
    count++;
  }

  return count;
}

async function syncMatchupsForWeek(
  supabase: SupabaseClient,
  yahoo: YahooFantasyClient,
  leagueKey: string,
  seasonId: string,
  week: number,
  totalWeeks: number,
): Promise<number> {
  const weekMatchups = await withRetry(() => yahoo.getScoreboard(leagueKey, week));
  let count = 0;

  for (const matchup of weekMatchups) {
    if (!matchup.teams || matchup.teams.length !== 2) continue;

    const [team1, team2] = matchup.teams;
    if (!team1 || !team2) continue;

    const { data: homeTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('yahoo_team_key', team1.team_key)
      .single();

    const { data: awayTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('yahoo_team_key', team2.team_key)
      .single();

    if (!homeTeam || !awayTeam) continue;

    const homeScore = team1.team_points?.total ?? 0;
    const awayScore = team2.team_points?.total ?? 0;
    const winnerId =
      homeScore > awayScore ? homeTeam.id : awayScore > homeScore ? awayTeam.id : null;

    await supabase.from('matchups').upsert(
      {
        season_id: seasonId,
        week: parseInt(matchup.week, 10) || week,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_score: homeScore,
        away_score: awayScore,
        winner_team_id: winnerId,
        is_tie: homeScore === awayScore,
        is_playoff: matchup.is_playoffs,
        is_championship: isChampionshipMatchup(matchup, totalWeeks),
        is_consolation: matchup.is_consolation,
        status: mapMatchupStatus(matchup.status),
      },
      { onConflict: 'season_id,week,home_team_id,away_team_id' },
    );
    count++;
  }

  return count;
}

async function syncTrades(
  supabase: SupabaseClient,
  yahoo: YahooFantasyClient,
  leagueKey: string,
  seasonId: string,
): Promise<number> {
  const transactions = await withRetry(() => yahoo.getTrades(leagueKey));
  let count = 0;

  for (const tx of transactions) {
    const traderKey = tx.trader_team_key;
    const tradeeKey = tx.tradee_team_key;
    if (!traderKey || !tradeeKey) continue;

    const { data: team1 } = await supabase
      .from('teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('yahoo_team_key', traderKey)
      .single();

    const { data: team2 } = await supabase
      .from('teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('yahoo_team_key', tradeeKey)
      .single();

    if (!team1 || !team2) continue;

    const team1Sends =
      tx.players
        ?.filter((p) => p.transaction_data?.source_team_key === traderKey)
        .map((p) => ({ name: p.name?.full || 'Unknown', position: '' })) || [];

    const team2Sends =
      tx.players
        ?.filter((p) => p.transaction_data?.source_team_key === tradeeKey)
        .map((p) => ({ name: p.name?.full || 'Unknown', position: '' })) || [];

    const tradeDate = tx.timestamp
      ? new Date(tx.timestamp * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('trades').upsert(
      {
        season_id: seasonId,
        team_1_id: team1.id,
        team_2_id: team2.id,
        team_1_sends: team1Sends,
        team_2_sends: team2Sends,
        trade_date: tradeDate,
        yahoo_trade_key: tx.transaction_key,
      },
      { onConflict: 'yahoo_trade_key', ignoreDuplicates: false },
    );

    if (!error) count++;
  }

  return count;
}

function getWeeksToSync(
  yahooLeague: YahooLeague,
  mode: 'full' | 'incremental',
  explicitWeeks?: number[],
): number[] {
  if (explicitWeeks?.length) return explicitWeeks;

  const endWeek = parseInt(yahooLeague.end_week, 10);
  const currentWeek = yahooLeague.current_week;

  if (mode === 'full') {
    const maxWeek =
      currentWeek >= endWeek ? endWeek : Math.min(endWeek, currentWeek);
    return Array.from({ length: maxWeek }, (_, i) => i + 1);
  }

  const priorWeek = Math.max(1, currentWeek - 1);
  return [priorWeek, currentWeek].filter((w, i, arr) => arr.indexOf(w) === i);
}

export async function syncYahooLeague(options: SyncOptions = {}): Promise<SyncResult> {
  const supabase = await createAdminClient();
  const mode = options.mode ?? 'incremental';
  const source = options.source ?? 'yahoo';
  let importLogId: string | null = null;

  try {
    let tokens: YahooOAuthTokens | null =
      options.tokens ?? (await loadYahooCredentials());

    if (!tokens) {
      throw new Error('Yahoo not connected. Connect Yahoo in admin import first.');
    }

    const yahoo = new YahooFantasyClient(tokens);

    let { data: league } = await supabase.from('league').select('id, yahoo_league_key').single();

    const leagueKey = options.leagueKey || league?.yahoo_league_key;
    if (!leagueKey) {
      throw new Error('No Yahoo league key configured');
    }

    let startedBy = options.startedBy ?? null;
    if (!startedBy) {
      const { data: commissioner } = await supabase
        .from('members')
        .select('id')
        .eq('role', 'commissioner')
        .limit(1)
        .single();
      startedBy = commissioner?.id ?? null;
    }

    if (startedBy) {
      const { data: importLog } = await supabase
        .from('import_logs')
        .insert({
          source: source === 'cron' ? 'yahoo' : source,
          status: 'processing',
          started_by: startedBy,
        })
        .select('id')
        .single();
      importLogId = importLog?.id ?? null;
    }

    const yahooLeague = await withRetry(() => yahoo.getLeague(leagueKey));

    if (!league) {
      const { data: newLeague } = await supabase
        .from('league')
        .insert({
          name: yahooLeague.name,
          founded_year: parseInt(yahooLeague.season, 10),
          yahoo_league_key: leagueKey,
        })
        .select()
        .single();
      league = newLeague;
    } else {
      await supabase
        .from('league')
        .update({ yahoo_league_key: leagueKey, name: yahooLeague.name })
        .eq('id', league.id);
    }

    if (!league) throw new Error('Failed to get league');

    const seasonYear = parseInt(yahooLeague.season, 10);
    let { data: season } = await supabase
      .from('seasons')
      .select('id, year')
      .eq('league_id', league.id)
      .eq('year', seasonYear)
      .single();

    if (!season) {
      const { data: newSeason } = await supabase
        .from('seasons')
        .insert({
          league_id: league.id,
          year: seasonYear,
          name: `${seasonYear} Season`,
          num_teams: yahooLeague.num_teams,
          num_weeks: parseInt(yahooLeague.end_week, 10),
          yahoo_league_key: leagueKey,
          data_source: 'yahoo',
          import_status: 'in_progress',
        })
        .select()
        .single();
      season = newSeason;
    }

    if (!season) throw new Error('Failed to get season');

    const teamsImported = await syncTeams(
      supabase,
      yahoo,
      leagueKey,
      season.id,
      seasonYear,
    );

    const totalWeeks = parseInt(yahooLeague.end_week, 10);
    const weeks = getWeeksToSync(yahooLeague, mode, options.weeks);
    let matchupsImported = 0;

    for (const week of weeks) {
      matchupsImported += await syncMatchupsForWeek(
        supabase,
        yahoo,
        leagueKey,
        season.id,
        week,
        totalWeeks,
      );
    }

    const tradesImported = await syncTrades(supabase, yahoo, leagueKey, season.id);

    await supabase
      .from('seasons')
      .update({
        import_status: 'complete',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', season.id);

    const updatedTokens = yahoo.getTokens() ?? options.tokens ?? null;
    if (updatedTokens?.refresh_token) {
      await saveYahooCredentials(league.id, updatedTokens);
    }

    await refreshMaterializedViews(supabase);

    const priorWeek = Math.max(1, yahooLeague.current_week - 1);
    if (mode === 'incremental') {
      try {
        await generateWeeklyDigest(season.id, priorWeek);
      } catch (digestError) {
        console.error('Weekly digest generation failed:', digestError);
      }
    }

    if (importLogId) {
      await supabase
        .from('import_logs')
        .update({
          season_id: season.id,
          status: 'completed',
          records_created: teamsImported + matchupsImported + tradesImported,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLogId);
    }

    return {
      success: true,
      seasonId: season.id,
      seasonYear,
      teamsImported,
      matchupsImported,
      tradesImported,
      weekSynced: priorWeek,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';

    if (importLogId) {
      const supabase = await createAdminClient();
      await supabase
        .from('import_logs')
        .update({
          status: 'failed',
          errors: [{ message }],
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLogId);
    }

    return { success: false, teamsImported: 0, matchupsImported: 0, tradesImported: 0, error: message };
  }
}

async function refreshMaterializedViews(supabase: SupabaseClient): Promise<void> {
  const { data: member } = await supabase.from('members').select('id').limit(1).single();
  if (member) {
    await supabase
      .from('members')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', member.id);
  }
}

export async function syncCurrentSeason(): Promise<SyncResult> {
  if (process.env.SYNC_ENABLED === 'false') {
    return { success: false, teamsImported: 0, matchupsImported: 0, tradesImported: 0, error: 'Sync disabled' };
  }

  const supabase = await createAdminClient();
  const { data: league } = await supabase.from('league').select('yahoo_league_key').single();

  if (!league?.yahoo_league_key) {
    return {
      success: false,
      teamsImported: 0,
      matchupsImported: 0,
      tradesImported: 0,
      error: 'No yahoo_league_key on league record',
    };
  }

  return syncYahooLeague({
    leagueKey: league.yahoo_league_key,
    mode: 'incremental',
    source: 'cron',
  });
}
