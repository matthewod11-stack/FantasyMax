import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CareerTimeline, RivalryCard, type CareerStats, type SeasonHistoryData } from '@/components/features/managers';
import { SeasonHistoryClient } from './SeasonHistoryClient';
import { Trophy, ArrowLeft, Calendar, Target, TrendingUp, Medal } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils/avatar-map';
import type { Member } from '@/types/database.types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


interface RivalryData {
  opponent: Member;
  wins: number;
  losses: number;
  ties: number;
  totalMatchups: number;
}

async function getManagerProfile(memberId: string) {
  const supabase = await createAdminClient();

  // Fetch member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return null;
  }

  // Fetch all teams for this member
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      team_name,
      final_record_wins,
      final_record_losses,
      final_record_ties,
      total_points_for,
      total_points_against,
      final_rank,
      is_champion,
      is_last_place,
      made_playoffs,
      season_id,
      seasons (
        id,
        year
      )
    `)
    .eq('member_id', memberId);

  if (teamsError) {
    console.error('[getManagerProfile] Teams query error:', teamsError);
  }

  // Sort by season year descending (can't use nested order in Supabase)
  const sortedTeams = (teams ?? []).sort((a, b) => {
    const yearA = (a.seasons as { year: number } | null)?.year ?? 0;
    const yearB = (b.seasons as { year: number } | null)?.year ?? 0;
    return yearB - yearA;
  });

  // Calculate career stats
  const careerStats: CareerStats = {
    memberId,
    totalWins: 0,
    totalLosses: 0,
    totalTies: 0,
    winPercentage: 0,
    totalPointsFor: 0,
    totalPointsAgainst: 0,
    seasonsPlayed: 0,
    championships: 0,
    playoffAppearances: 0,
    lastPlaceFinishes: 0,
  };

  const seasonData: SeasonHistoryData[] = [];

  for (const team of sortedTeams) {
    const season = team.seasons as { id: string; year: number } | null;
    if (!season) continue;

    careerStats.totalWins += team.final_record_wins ?? 0;
    careerStats.totalLosses += team.final_record_losses ?? 0;
    careerStats.totalTies += team.final_record_ties ?? 0;
    careerStats.totalPointsFor += team.total_points_for ?? 0;
    careerStats.totalPointsAgainst += team.total_points_against ?? 0;
    careerStats.seasonsPlayed += 1;
    if (team.is_champion) careerStats.championships += 1;
    if (team.made_playoffs) careerStats.playoffAppearances += 1;
    if (team.is_last_place) careerStats.lastPlaceFinishes += 1;

    seasonData.push({
      year: season.year,
      seasonId: season.id,
      teamId: team.id,
      teamName: team.team_name,
      wins: team.final_record_wins ?? 0,
      losses: team.final_record_losses ?? 0,
      ties: team.final_record_ties ?? 0,
      pointsFor: team.total_points_for ?? 0,
      pointsAgainst: team.total_points_against ?? 0,
      finalRank: team.final_rank,
      isChampion: team.is_champion ?? false,
      isLastPlace: team.is_last_place ?? false,
      madePlayoffs: team.made_playoffs ?? false,
    });
  }

  const totalGames = careerStats.totalWins + careerStats.totalLosses + careerStats.totalTies;
  careerStats.winPercentage = totalGames > 0
    ? (careerStats.totalWins + careerStats.totalTies * 0.5) / totalGames
    : 0;

  // Fetch H2H records using the existing view
  const { data: h2hRecords } = await supabase
    .from('head_to_head_records')
    .select('*')
    .or(`member_1_id.eq.${memberId},member_2_id.eq.${memberId}`)
    .order('total_matchups', { ascending: false });

  // Fetch all members for opponent lookups
  const { data: allMembers } = await supabase.from('members').select('*');
  const membersMap = new Map(allMembers?.map((m) => [m.id, m]) ?? []);

  // Process rivalries
  const rivalries: RivalryData[] = [];
  for (const record of h2hRecords ?? []) {
    const isPlayer1 = record.member_1_id === memberId;
    const opponentId = isPlayer1 ? record.member_2_id : record.member_1_id;
    const opponent = membersMap.get(opponentId!);

    if (!opponent) continue;

    rivalries.push({
      opponent,
      wins: isPlayer1 ? record.member_1_wins ?? 0 : record.member_1_losses ?? 0,
      losses: isPlayer1 ? record.member_1_losses ?? 0 : record.member_1_wins ?? 0,
      ties: 0, // Not in the current view
      totalMatchups: record.total_matchups ?? 0,
    });
  }

  // Find nemesis (most losses to) and victim (most wins against)
  const nemesis = rivalries
    .filter((r) => r.losses > r.wins)
    .sort((a, b) => b.losses - a.losses)[0] ?? null;

  const victim = rivalries
    .filter((r) => r.wins > r.losses)
    .sort((a, b) => b.wins - a.wins)[0] ?? null;

  // Get unique team names for team name history
  const teamNames = [...new Set(seasonData.map((s) => s.teamName))];

  return {
    member,
    careerStats,
    seasonData,
    rivalries,
    nemesis,
    victim,
    teamNames,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const profile = await getManagerProfile(id);

  if (!profile) {
    return { title: 'Manager Not Found | League of Degenerates' };
  }

  return {
    title: `${profile.member.display_name} | League of Degenerates`,
    description: `Career stats and history for ${profile.member.display_name}`,
  };
}

export default async function ManagerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getManagerProfile(id);

  if (!profile) {
    notFound();
  }

  const { member, careerStats, seasonData, nemesis, victim, teamNames } = profile;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/managers" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Managers
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-border">
            <AvatarImage
              src={member.avatar_url || getAvatarUrl(member.display_name)}
              className="object-cover"
            />
            <AvatarFallback className="text-3xl font-bold">
              {getInitials(member.display_name)}
            </AvatarFallback>
          </Avatar>
          {careerStats.championships > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5">
              <Trophy className="h-4 w-4 text-yellow-900" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{member.display_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Since {member.joined_year}
            </Badge>
            <Badge variant="secondary">
              {careerStats.seasonsPlayed} seasons
            </Badge>
            {careerStats.championships > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
                {careerStats.championships}x Champion
              </Badge>
            )}
            {!member.is_active && (
              <Badge variant="outline" className="text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Championships display */}
        {careerStats.championships > 0 && (
          <div className="flex gap-1">
            {Array.from({ length: careerStats.championships }).map((_, i) => (
              <Trophy key={i} className="h-6 w-6 text-yellow-500" />
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Career Record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {careerStats.totalWins}-{careerStats.totalLosses}
              {careerStats.totalTies > 0 && `-${careerStats.totalTies}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Win Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {(careerStats.winPercentage * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Medal className="h-3.5 w-3.5" />
              Playoff Appearances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {careerStats.playoffAppearances}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Points</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {careerStats.totalPointsFor.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Career Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Career Timeline</CardTitle>
          <CardDescription>Season-by-season performance</CardDescription>
        </CardHeader>
        <CardContent>
          {seasonData.length > 0 ? (
            <CareerTimeline seasons={seasonData} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No season data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rivalries */}
      <div>
        <h2 className="text-xl font-bold mb-4">Rivalries</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {nemesis && (
            <RivalryCard
              member={member}
              opponent={nemesis.opponent}
              memberWins={nemesis.wins}
              opponentWins={nemesis.losses}
              ties={nemesis.ties}
              rivalryType="nemesis"
            />
          )}
          {victim && (
            <RivalryCard
              member={member}
              opponent={victim.opponent}
              memberWins={victim.wins}
              opponentWins={victim.losses}
              ties={victim.ties}
              rivalryType="victim"
            />
          )}
          {!nemesis && !victim && (
            <Card className="col-span-2">
              <CardContent className="py-8 text-center text-muted-foreground">
                No rivalry data available yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Name History */}
      {teamNames.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Name History</CardTitle>
            <CardDescription>Names used across seasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamNames.map((name, i) => (
                <Badge key={i} variant="outline">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Details Table - Click row for full breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Season History</CardTitle>
          <CardDescription>Click a season to see week-by-week results</CardDescription>
        </CardHeader>
        <CardContent>
          <SeasonHistoryClient seasons={seasonData} memberId={member.id} />
        </CardContent>
      </Card>
    </div>
  );
}
