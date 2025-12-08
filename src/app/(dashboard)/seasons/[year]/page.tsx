import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Users, TrendingUp, Brackets } from 'lucide-react';
import { SeasonStandings } from '@/components/features/seasons/SeasonStandings';
import { SeasonHighlights } from '@/components/features/seasons/SeasonHighlights';
import { SeasonJourneyChart } from '@/components/features/seasons/SeasonJourneyChart';
import { PlayoffBracket } from '@/components/features/seasons/PlayoffBracket';

interface PageProps {
  params: Promise<{ year: string }>;
}

export default async function SeasonDetailPage({ params }: PageProps) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);

  if (isNaN(year) || year < 2000 || year > 2100) {
    notFound();
  }

  // TODO: Switch back to createClient() when auth is enabled
  const supabase = await createAdminClient();

  // Fetch season with related data
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select(`
      *,
      champion_team:teams!fk_champion_team(
        id,
        team_name,
        final_record_wins,
        final_record_losses,
        final_record_ties,
        total_points_for,
        member:members(id, display_name, avatar_url)
      ),
      last_place_team:teams!fk_last_place_team(
        id,
        team_name,
        final_record_wins,
        final_record_losses,
        final_record_ties,
        member:members(id, display_name, avatar_url)
      )
    `)
    .eq('year', year)
    .single();

  if (seasonError || !season) {
    notFound();
  }

  // Fetch all teams for this season
  const { data: teams } = await supabase
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
      playoff_seed,
      member:members(id, display_name, avatar_url)
    `)
    .eq('season_id', season.id)
    .order('final_rank', { ascending: true });

  // Fetch all matchups for this season
  const { data: matchups } = await supabase
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
      is_championship,
      is_consolation
    `)
    .eq('season_id', season.id)
    .order('week', { ascending: true });

  // Transform teams for standings
  const standingsData = (teams || []).map((team) => ({
    id: team.id,
    teamName: team.team_name || 'Unknown Team',
    member: {
      id: team.member?.id || '',
      display_name: team.member?.display_name || 'Unknown',
      avatar_url: team.member?.avatar_url || null,
    },
    wins: team.final_record_wins || 0,
    losses: team.final_record_losses || 0,
    ties: team.final_record_ties || 0,
    pointsFor: team.total_points_for || 0,
    pointsAgainst: team.total_points_against || 0,
    finalRank: team.final_rank || 99,
    isChampion: team.is_champion || false,
    isLastPlace: team.is_last_place || false,
    madePlayoffs: team.made_playoffs || false,
    playoffSeed: team.playoff_seed,
  }));

  // Calculate week-by-week standings for journey chart
  const journeyData = calculateWeeklyStandings(teams || [], matchups || [], season.num_weeks);

  // Transform playoff matchups for bracket
  const playoffMatchups = transformPlayoffMatchups(matchups || [], teams || []);

  // Calculate season records
  const seasonRecords = calculateSeasonRecords(matchups || [], teams || []);

  // Transform champion data
  const championData = season.champion_team
    ? {
        member: {
          id: season.champion_team.member?.id || '',
          display_name: season.champion_team.member?.display_name || 'Unknown',
          avatar_url: season.champion_team.member?.avatar_url || null,
        },
        teamName: season.champion_team.team_name || 'Unknown Team',
        record: `${season.champion_team.final_record_wins || 0}-${season.champion_team.final_record_losses || 0}${(season.champion_team.final_record_ties || 0) > 0 ? `-${season.champion_team.final_record_ties}` : ''}`,
        pointsFor: season.champion_team.total_points_for || 0,
      }
    : null;

  // Transform last place data
  const lastPlaceData = season.last_place_team
    ? {
        member: {
          id: season.last_place_team.member?.id || '',
          display_name: season.last_place_team.member?.display_name || 'Unknown',
          avatar_url: season.last_place_team.member?.avatar_url || null,
        },
        teamName: season.last_place_team.team_name || 'Unknown Team',
        record: `${season.last_place_team.final_record_wins || 0}-${season.last_place_team.final_record_losses || 0}${(season.last_place_team.final_record_ties || 0) > 0 ? `-${season.last_place_team.final_record_ties}` : ''}`,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seasons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            {year} Season
          </h1>
          <p className="text-muted-foreground">
            {season.name || `${season.num_teams} teams • ${season.num_weeks} weeks`}
          </p>
        </div>
      </div>

      {/* Highlights */}
      <SeasonHighlights
        year={year}
        champion={championData}
        lastPlace={lastPlaceData}
        records={seasonRecords}
      />

      {/* Tabbed content */}
      <Tabs defaultValue="standings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standings" className="gap-2">
            <Users className="h-4 w-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="journey" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Season Journey
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="gap-2">
            <Brackets className="h-4 w-4" />
            Playoffs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <SeasonStandings standings={standingsData} />
        </TabsContent>

        <TabsContent value="journey">
          <Card>
            <CardHeader>
              <CardTitle>Season Journey</CardTitle>
            </CardHeader>
            <CardContent>
              {journeyData.length > 0 ? (
                <SeasonJourneyChart
                  teams={journeyData}
                  totalWeeks={season.num_weeks - (season.playoff_weeks || 0)}
                  playoffStartWeek={season.num_weeks - (season.playoff_weeks || 0) + 1}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Weekly standings data not available for this season.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playoffs">
          <Card>
            <CardHeader>
              <CardTitle>Playoff Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              {playoffMatchups.length > 0 ? (
                <PlayoffBracket
                  matchups={playoffMatchups}
                  totalRounds={season.playoff_weeks || 3}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Playoff data not available for this season.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions

interface TeamData {
  id: string;
  team_name: string | null;
  final_rank: number | null;
  final_record_wins: number | null;
  final_record_losses: number | null;
  final_record_ties: number | null;
  is_champion: boolean | null;
  is_last_place: boolean | null;
  playoff_seed: number | null;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface MatchupData {
  id: string;
  week: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  status: string | null;
  is_playoff: boolean | null;
  is_championship: boolean | null;
  is_consolation: boolean | null;
}

function calculateWeeklyStandings(
  teams: TeamData[],
  matchups: MatchupData[],
  totalWeeks: number
) {
  // Build a lookup of team ID to team data
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // For each team, calculate cumulative record through each week
  return teams.map((team) => {
    const weeklyData: { week: number; rank: number; points: number; record: string }[] = [];

    let wins = 0;
    let losses = 0;
    let ties = 0;
    let totalPoints = 0;

    for (let week = 1; week <= totalWeeks; week++) {
      // Find matchup for this team this week
      const matchup = matchups.find(
        (m) =>
          m.week === week &&
          (m.home_team_id === team.id || m.away_team_id === team.id) &&
          m.status === 'final' &&
          !m.is_playoff
      );

      if (matchup) {
        const isHome = matchup.home_team_id === team.id;
        const teamScore = isHome ? matchup.home_score : matchup.away_score;
        const oppScore = isHome ? matchup.away_score : matchup.home_score;

        if (teamScore !== null) {
          totalPoints += teamScore;
        }

        if (matchup.winner_team_id === team.id) {
          wins++;
        } else if (matchup.winner_team_id === null && teamScore === oppScore) {
          ties++;
        } else {
          losses++;
        }
      }

      // Calculate rank based on wins (simplified - real ranking would consider tiebreakers)
      const rank = team.final_rank || teams.length;

      weeklyData.push({
        week,
        rank,
        points: totalPoints,
        record: `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`,
      });
    }

    return {
      id: team.id,
      teamName: team.team_name || 'Unknown',
      member: {
        id: team.member?.id || '',
        display_name: team.member?.display_name || 'Unknown',
        avatar_url: team.member?.avatar_url || null,
      },
      weeklyData,
      isChampion: team.is_champion || false,
      isLastPlace: team.is_last_place || false,
      color: '',
    };
  });
}

function transformPlayoffMatchups(matchups: MatchupData[], teams: TeamData[]) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Filter to playoff matchups only
  const playoffMatchups = matchups.filter((m) => m.is_playoff && !m.is_consolation);

  // Group by week to determine round
  const weekGroups = new Map<number, MatchupData[]>();
  playoffMatchups.forEach((m) => {
    const existing = weekGroups.get(m.week) || [];
    existing.push(m);
    weekGroups.set(m.week, existing);
  });

  const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => a - b);

  return playoffMatchups.map((matchup) => {
    const round = sortedWeeks.indexOf(matchup.week) + 1;
    const weekMatchups = weekGroups.get(matchup.week) || [];
    const position = weekMatchups.findIndex((m) => m.id === matchup.id);

    const homeTeam = teamMap.get(matchup.home_team_id);
    const awayTeam = teamMap.get(matchup.away_team_id);

    return {
      id: matchup.id,
      round,
      position,
      homeTeam: homeTeam
        ? {
            id: homeTeam.id,
            teamName: homeTeam.team_name || 'Unknown',
            member: {
              id: homeTeam.member?.id || '',
              display_name: homeTeam.member?.display_name || 'Unknown',
              avatar_url: homeTeam.member?.avatar_url || null,
            },
            seed: homeTeam.playoff_seed || 0,
          }
        : null,
      awayTeam: awayTeam
        ? {
            id: awayTeam.id,
            teamName: awayTeam.team_name || 'Unknown',
            member: {
              id: awayTeam.member?.id || '',
              display_name: awayTeam.member?.display_name || 'Unknown',
              avatar_url: awayTeam.member?.avatar_url || null,
            },
            seed: awayTeam.playoff_seed || 0,
          }
        : null,
      homeScore: matchup.home_score,
      awayScore: matchup.away_score,
      winnerId: matchup.winner_team_id,
      week: matchup.week,
      isChampionship: matchup.is_championship || false,
    };
  });
}

function calculateSeasonRecords(matchups: MatchupData[], teams: TeamData[]) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const records: {
    type: 'high_score' | 'low_score' | 'biggest_blowout' | 'closest_game';
    value: number;
    description: string;
    member: { id: string; display_name: string; avatar_url: string | null };
    opponent?: { id: string; display_name: string; avatar_url: string | null };
    week: number;
  }[] = [];

  // Only consider final matchups
  const finalMatchups = matchups.filter((m) => m.status === 'final');

  if (finalMatchups.length === 0) return records;

  // High score
  let highScore = { score: 0, teamId: '', week: 0, oppTeamId: '' };
  let lowScore = { score: Infinity, teamId: '', week: 0, oppTeamId: '' };
  let biggestBlowout = { margin: 0, winnerId: '', loserId: '', week: 0 };
  let closestGame = { margin: Infinity, team1Id: '', team2Id: '', week: 0 };

  finalMatchups.forEach((m) => {
    if (m.home_score !== null && m.away_score !== null) {
      // Check high/low scores
      if (m.home_score > highScore.score) {
        highScore = { score: m.home_score, teamId: m.home_team_id, week: m.week, oppTeamId: m.away_team_id };
      }
      if (m.away_score > highScore.score) {
        highScore = { score: m.away_score, teamId: m.away_team_id, week: m.week, oppTeamId: m.home_team_id };
      }
      if (m.home_score < lowScore.score && m.home_score > 0) {
        lowScore = { score: m.home_score, teamId: m.home_team_id, week: m.week, oppTeamId: m.away_team_id };
      }
      if (m.away_score < lowScore.score && m.away_score > 0) {
        lowScore = { score: m.away_score, teamId: m.away_team_id, week: m.week, oppTeamId: m.home_team_id };
      }

      // Check margins
      const margin = Math.abs(m.home_score - m.away_score);
      if (margin > biggestBlowout.margin) {
        const winnerId = m.home_score > m.away_score ? m.home_team_id : m.away_team_id;
        const loserId = m.home_score > m.away_score ? m.away_team_id : m.home_team_id;
        biggestBlowout = { margin, winnerId, loserId, week: m.week };
      }
      if (margin < closestGame.margin && margin > 0) {
        closestGame = { margin, team1Id: m.home_team_id, team2Id: m.away_team_id, week: m.week };
      }
    }
  });

  // Build records array
  const getTeamMember = (teamId: string) => {
    const team = teamMap.get(teamId);
    return team?.member
      ? { id: team.member.id, display_name: team.member.display_name, avatar_url: team.member.avatar_url }
      : { id: '', display_name: 'Unknown', avatar_url: null };
  };

  if (highScore.score > 0) {
    const oppMember = getTeamMember(highScore.oppTeamId);
    records.push({
      type: 'high_score',
      value: highScore.score,
      description: `${highScore.score.toFixed(1)} points`,
      member: getTeamMember(highScore.teamId),
      opponent: oppMember.id ? oppMember : undefined,
      week: highScore.week,
    });
  }

  if (lowScore.score < Infinity) {
    records.push({
      type: 'low_score',
      value: lowScore.score,
      description: `${lowScore.score.toFixed(1)} points`,
      member: getTeamMember(lowScore.teamId),
      week: lowScore.week,
    });
  }

  if (biggestBlowout.margin > 0) {
    records.push({
      type: 'biggest_blowout',
      value: biggestBlowout.margin,
      description: `Won by ${biggestBlowout.margin.toFixed(1)}`,
      member: getTeamMember(biggestBlowout.winnerId),
      opponent: getTeamMember(biggestBlowout.loserId),
      week: biggestBlowout.week,
    });
  }

  if (closestGame.margin < Infinity) {
    records.push({
      type: 'closest_game',
      value: closestGame.margin,
      description: `Decided by ${closestGame.margin.toFixed(1)}`,
      member: getTeamMember(closestGame.team1Id),
      opponent: getTeamMember(closestGame.team2Id),
      week: closestGame.week,
    });
  }

  return records;
}
