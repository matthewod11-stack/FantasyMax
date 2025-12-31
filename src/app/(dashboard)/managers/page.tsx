import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { ManagersGrid, ManagerCardSkeleton, type CareerStats } from '@/components/features/managers';
import type { Member } from '@/types/database.types';

export const metadata = {
  title: 'Managers | League of Degenerates',
  description: 'View all league managers and their career stats',
};

interface ManagerWithStats extends Member {
  stats: CareerStats;
}

/**
 * Calculate career stats for a member from their teams data.
 *
 * NOTE: This is a temporary solution. Agent B will create a materialized view
 * (mv_career_stats) that pre-calculates these stats for performance.
 * When that's ready, we can query the view directly instead of calculating here.
 */
async function getManagersWithStats(): Promise<ManagerWithStats[]> {
  // TODO: Switch to createClient() when auth is enabled
  const supabase = await createAdminClient();

  // Fetch all members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .order('display_name');

  if (membersError || !members) {
    console.error('Error fetching members:', membersError);
    return [];
  }

  // Fetch all teams with their season data to calculate career stats
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      member_id,
      season_id,
      team_name,
      final_record_wins,
      final_record_losses,
      final_record_ties,
      total_points_for,
      total_points_against,
      is_champion,
      is_last_place,
      made_playoffs,
      seasons!teams_season_id_fkey (
        year
      )
    `);

  if (teamsError || !teams) {
    console.error('Error fetching teams:', teamsError);
    return [];
  }

  // Group teams by member and calculate stats
  const statsByMember = new Map<string, CareerStats>();

  for (const team of teams) {
    const memberId = team.member_id;
    const season = team.seasons as { year: number } | null;

    let memberStats = statsByMember.get(memberId);
    if (!memberStats) {
      memberStats = {
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
      statsByMember.set(memberId, memberStats);
    }

    memberStats.totalWins += team.final_record_wins ?? 0;
    memberStats.totalLosses += team.final_record_losses ?? 0;
    memberStats.totalTies += team.final_record_ties ?? 0;
    memberStats.totalPointsFor += team.total_points_for ?? 0;
    memberStats.totalPointsAgainst += team.total_points_against ?? 0;
    memberStats.seasonsPlayed += 1;

    if (team.is_champion) memberStats.championships += 1;
    if (team.made_playoffs) memberStats.playoffAppearances += 1;
    if (team.is_last_place) memberStats.lastPlaceFinishes += 1;
  }

  // Calculate win percentages
  for (const stats of statsByMember.values()) {
    const totalGames = stats.totalWins + stats.totalLosses + stats.totalTies;
    stats.winPercentage = totalGames > 0
      ? (stats.totalWins + stats.totalTies * 0.5) / totalGames
      : 0;
  }

  // Combine members with their stats
  const managersWithStats: ManagerWithStats[] = members.map((member) => ({
    ...member,
    stats: statsByMember.get(member.id) ?? {
      memberId: member.id,
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
    },
  }));

  return managersWithStats;
}

async function ManagersContent() {
  const managers = await getManagersWithStats();

  return <ManagersGrid managers={managers} />;
}

export default function ManagersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
        <p className="text-muted-foreground">
          The people who make this league legendary
        </p>
      </div>

      <Suspense fallback={<ManagerCardSkeleton variant="grid" count={8} />}>
        <ManagersContent />
      </Suspense>
    </div>
  );
}
