import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { getYahooClient } from '@/lib/yahoo/client';
import type { YahooOAuthTokens } from '@/lib/yahoo/types';

const syncRequestSchema = z.object({
  leagueKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting Yahoo Sync ===');

    // Skip auth check for now during development
    // TODO: Re-enable auth check when Supabase auth is set up
    /*
    const supabase = await createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('members')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'commissioner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    */

    const supabase = await createAdminClient();

    // Get Yahoo tokens
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('yahoo_tokens');

    if (!tokensCookie?.value) {
      return NextResponse.json({ error: 'Yahoo not connected' }, { status: 400 });
    }

    const tokens: YahooOAuthTokens = JSON.parse(tokensCookie.value);
    const yahoo = getYahooClient(tokens);

    const body = await request.json();
    const { leagueKey } = syncRequestSchema.parse(body);

    // Skip import log for now (requires member)
    const importLog = null;
    /*
    const { data: importLog } = await supabase
      .from('import_logs')
      .insert({
        source: 'yahoo',
        status: 'processing',
        started_by: member.id,
      })
      .select()
      .single();
    */

    // Get or create league record
    let { data: league } = await supabase.from('league').select('id').single();

    // Fetch Yahoo league data
    console.log('Fetching Yahoo league:', leagueKey);
    const yahooLeague = await yahoo.getLeague(leagueKey);
    console.log('Yahoo league data:', JSON.stringify(yahooLeague).substring(0, 500));

    if (!league) {
      const { data: newLeague } = await supabase
        .from('league')
        .insert({
          name: yahooLeague.name,
          founded_year: parseInt(yahooLeague.season),
          yahoo_league_key: leagueKey,
        })
        .select()
        .single();
      league = newLeague;
    } else {
      await supabase.from('league').update({ yahoo_league_key: leagueKey }).eq('id', league.id);
    }

    if (!league) {
      throw new Error('Failed to create/get league');
    }

    // Get or create season
    const seasonYear = parseInt(yahooLeague.season);
    let { data: season } = await supabase
      .from('seasons')
      .select('id')
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
          num_weeks: parseInt(yahooLeague.end_week),
          yahoo_league_key: leagueKey,
          data_source: 'yahoo',
          import_status: 'in_progress',
        })
        .select()
        .single();
      season = newSeason;
    }

    if (!season) {
      throw new Error('Failed to create/get season');
    }

    // Fetch and import teams
    console.log('Fetching Yahoo teams...');
    const yahooTeams = await yahoo.getLeagueTeams(leagueKey);
    console.log('Yahoo teams count:', yahooTeams?.length || 0);
    console.log('First team:', JSON.stringify(yahooTeams?.[0]).substring(0, 300));
    let teamsImported = 0;

    for (const yahooTeam of yahooTeams) {
      const manager = yahooTeam.managers[0];
      if (!manager) continue;

      // Find or create member
      let { data: memberRecord } = await supabase
        .from('members')
        .select('id')
        .eq('yahoo_manager_id', manager.guid)
        .single();

      if (!memberRecord) {
        // Try to find by name
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

      if (!memberRecord) continue;

      const standings = yahooTeam.team_standings;

      // Upsert team
      await supabase.from('teams').upsert(
        {
          season_id: season.id,
          member_id: memberRecord.id,
          team_name: yahooTeam.name,
          logo_url: yahooTeam.team_logo || null,
          yahoo_team_key: yahooTeam.team_key,
          yahoo_team_id: parseInt(yahooTeam.team_id),
          final_rank: standings?.rank || null,
          final_record_wins: standings?.outcome_totals.wins || 0,
          final_record_losses: standings?.outcome_totals.losses || 0,
          final_record_ties: standings?.outcome_totals.ties || 0,
          total_points_for: standings?.points_for || 0,
          total_points_against: standings?.points_against || 0,
          playoff_seed: standings?.playoff_seed || null,
          is_champion: standings?.rank === 1,
        },
        {
          onConflict: 'season_id,member_id',
        },
      );

      teamsImported++;
    }

    // Fetch and import matchups
    const totalWeeks = parseInt(yahooLeague.end_week);
    let matchupsImported = 0;

    for (let week = 1; week <= Math.min(totalWeeks, yahooLeague.current_week); week++) {
      const weekMatchups = await yahoo.getScoreboard(leagueKey, week);

      for (const matchup of weekMatchups) {
        if (matchup.teams.length !== 2) continue;

        const [team1, team2] = matchup.teams;
        if (!team1 || !team2) continue;

        // Find team IDs
        const { data: homeTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('season_id', season.id)
          .eq('yahoo_team_key', team1.team_key)
          .single();

        const { data: awayTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('season_id', season.id)
          .eq('yahoo_team_key', team2.team_key)
          .single();

        if (!homeTeam || !awayTeam) continue;

        const homeScore = team1.team_points.total;
        const awayScore = team2.team_points.total;
        const winnerId =
          homeScore > awayScore ? homeTeam.id : awayScore > homeScore ? awayTeam.id : null;

        await supabase.from('matchups').upsert(
          {
            season_id: season.id,
            week: parseInt(matchup.week),
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            home_score: homeScore,
            away_score: awayScore,
            winner_team_id: winnerId,
            is_tie: homeScore === awayScore,
            is_playoff: matchup.is_playoffs,
            is_championship: false, // Would need additional logic
            is_consolation: matchup.is_consolation,
            status: matchup.status === 'postevent' ? 'final' : 'in_progress',
          },
          {
            onConflict: 'season_id,week,home_team_id,away_team_id',
          },
        );

        matchupsImported++;
      }
    }

    // Update season and import log
    await supabase
      .from('seasons')
      .update({
        import_status: 'complete',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', season.id);

    if (importLog?.id) {
      await supabase
        .from('import_logs')
        .update({
          season_id: season.id,
          status: 'completed',
          records_created: teamsImported + matchupsImported,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLog.id);
    }

    // Update tokens if refreshed
    const updatedTokens = yahoo.getTokens();
    if (updatedTokens) {
      cookieStore.set('yahoo_tokens', JSON.stringify(updatedTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return NextResponse.json({
      success: true,
      teamsImported,
      matchupsImported,
    });
  } catch (error) {
    console.error('Yahoo sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
