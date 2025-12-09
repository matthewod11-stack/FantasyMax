'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { SeasonDetail, MatchupResult } from '@/components/features/managers/SeasonHistoryTable';

/**
 * Fetch detailed season data for a manager
 *
 * Returns week-by-week matchups, playoff results, and season stats
 * for display in the season detail drawer.
 */
export async function fetchSeasonDetailAction(
  memberId: string,
  year: number
): Promise<SeasonDetail | null> {
  try {
    const supabase = await createAdminClient();

    // Get the season
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .eq('year', year)
      .single();

    if (seasonError || !season) {
      console.error('[fetchSeasonDetail] Season not found:', year);
      return null;
    }

    // Get the team for this member in this season
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        final_rank,
        final_record_wins,
        final_record_losses,
        final_record_ties,
        total_points_for,
        total_points_against,
        is_champion,
        is_last_place,
        made_playoffs,
        playoff_seed
      `)
      .eq('member_id', memberId)
      .eq('season_id', season.id)
      .single();

    if (teamError || !team) {
      console.error('[fetchSeasonDetail] Team not found:', memberId, year);
      return null;
    }

    // Get all teams for this season (for opponent lookup)
    const { data: allTeams } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        member:members(id, display_name, avatar_url)
      `)
      .eq('season_id', season.id);

    const teamsMap = new Map(
      (allTeams ?? []).map((t) => [t.id, t])
    );

    // Get all matchups involving this team
    const { data: matchups, error: matchupsError } = await supabase
      .from('matchups')
      .select(`
        id,
        week,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        winner_team_id,
        status,
        is_playoff,
        is_championship
      `)
      .eq('season_id', season.id)
      .eq('status', 'final')
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order('week', { ascending: true });

    if (matchupsError) {
      console.error('[fetchSeasonDetail] Matchups error:', matchupsError);
      return null;
    }

    // Transform matchups
    const matchupResults: MatchupResult[] = [];
    let regularWins = 0;
    let regularLosses = 0;
    let playoffWins = 0;
    let playoffLosses = 0;
    let highScore: { week: number; score: number } | null = null;
    let lowScore: { week: number; score: number } | null = null;

    for (const m of matchups ?? []) {
      const isHome = m.home_team_id === team.id;
      const teamScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const opponentScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      const opponentTeamId = isHome ? m.away_team_id : m.home_team_id;
      const won = m.winner_team_id === team.id;

      const opponentTeam = teamsMap.get(opponentTeamId!);
      const opponentMember = opponentTeam?.member as { display_name: string; avatar_url: string | null } | null;

      matchupResults.push({
        week: m.week,
        opponentName: opponentMember?.display_name ?? opponentTeam?.team_name ?? 'Unknown',
        opponentAvatar: opponentMember?.avatar_url ?? null,
        teamScore,
        opponentScore,
        won,
        isPlayoff: m.is_playoff ?? false,
        isChampionship: m.is_championship ?? false,
      });

      // Track records
      if (m.is_playoff) {
        if (won) playoffWins++;
        else playoffLosses++;
      } else {
        if (won) regularWins++;
        else regularLosses++;
      }

      // Track high/low scores (regular season only for consistency)
      if (!m.is_playoff) {
        if (!highScore || teamScore > highScore.score) {
          highScore = { week: m.week, score: teamScore };
        }
        if (!lowScore || teamScore < lowScore.score) {
          lowScore = { week: m.week, score: teamScore };
        }
      }
    }

    return {
      year,
      teamName: team.team_name,
      record: {
        wins: team.final_record_wins ?? 0,
        losses: team.final_record_losses ?? 0,
        ties: team.final_record_ties ?? 0,
      },
      pointsFor: team.total_points_for ?? 0,
      pointsAgainst: team.total_points_against ?? 0,
      finalRank: team.final_rank,
      playoffSeed: team.playoff_seed,
      isChampion: team.is_champion ?? false,
      isLastPlace: team.is_last_place ?? false,
      madePlayoffs: team.made_playoffs ?? false,
      matchups: matchupResults,
      regularSeasonRecord: { wins: regularWins, losses: regularLosses },
      playoffRecord: { wins: playoffWins, losses: playoffLosses },
      highScore,
      lowScore,
    };
  } catch (error) {
    console.error('[fetchSeasonDetail] Error:', error);
    return null;
  }
}
