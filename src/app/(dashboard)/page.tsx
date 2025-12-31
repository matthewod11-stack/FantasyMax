import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import {
  getLeagueStats,
  getLeagueWeekHistory,
  getLatestSeason,
  getCareerLeaderboard,
  getBiggestRivalries,
  getTopHighestScores,
  getTopBlowouts,
  getTopClosestGames,
} from '@/lib/supabase/queries';
import {
  AllTimeLeaderboard,
  HotRivalries,
  RecentHighlights,
  LeagueHistoryWidget,
  LatestSeasonCard,
  DashboardSkeleton,
} from '@/components/features/dashboard';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Swords } from 'lucide-react';

export const metadata = {
  title: 'Dashboard | League of Degenerates',
  description: 'Fantasy football league history and stats',
};

async function getCurrentWeek(): Promise<number> {
  const supabase = await createAdminClient();

  // Find the most recent season
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!currentSeason) return 1;

  // Find highest week with scheduled matchups (upcoming week)
  const { data: scheduledMatchup } = await supabase
    .from('matchups')
    .select('week')
    .eq('season_id', currentSeason.id)
    .eq('status', 'scheduled')
    .order('week', { ascending: true })
    .limit(1)
    .single();

  if (scheduledMatchup) {
    return scheduledMatchup.week;
  }

  // Fallback: find highest week with final matchups (season ended)
  const { data: finalMatchup } = await supabase
    .from('matchups')
    .select('week')
    .eq('season_id', currentSeason.id)
    .eq('status', 'final')
    .order('week', { ascending: false })
    .limit(1)
    .single();

  return finalMatchup?.week ?? 1;
}

async function LeagueDashboardContent() {
  // Fetch all data in parallel
  const [
    leagueStats,
    currentWeek,
    latestSeason,
    championLeaders,
    biggestRivalries,
    topHighScore,
    topBlowout,
    topClosest,
  ] = await Promise.all([
    getLeagueStats(),
    getCurrentWeek(),
    getLatestSeason(),
    getCareerLeaderboard('championships', 5),
    getBiggestRivalries(4),
    getTopHighestScores(1),
    getTopBlowouts(1),
    getTopClosestGames(1),
  ]);

  // Fetch week history (depends on currentWeek)
  const weekHistory = await getLeagueWeekHistory(currentWeek, 4);

  // Fetch member names for rivalries
  const supabase = await createAdminClient();
  const memberIds = new Set<string>();
  biggestRivalries.forEach((r) => {
    memberIds.add(r.member_1_id);
    memberIds.add(r.member_2_id);
  });

  const { data: members } = await supabase
    .from('members')
    .select('id, display_name')
    .in('id', Array.from(memberIds));

  const memberMap = new Map(members?.map((m) => [m.id, m]) ?? []);

  // Enrich rivalries with member names
  const enrichedRivalries = biggestRivalries.map((r) => ({
    ...r,
    member_1: memberMap.get(r.member_1_id),
    member_2: memberMap.get(r.member_2_id),
  }));

  return (
    <div className="space-y-8">
      {/* League Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {leagueStats.leagueName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Est. {leagueStats.foundedYear}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            {leagueStats.totalSeasons} Seasons
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {leagueStats.activeMembers} Active Managers
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5" />
            {leagueStats.totalMatchups.toLocaleString()} Matchups
          </Badge>
        </div>
      </div>

      {/* Main Widget Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AllTimeLeaderboard leaders={championLeaders} />
        <HotRivalries rivalries={enrichedRivalries} />
        <RecentHighlights
          highScore={topHighScore[0] ?? null}
          biggestBlowout={topBlowout[0] ?? null}
          closestGame={topClosest[0] ?? null}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeagueHistoryWidget events={weekHistory} currentWeek={currentWeek} />
        {latestSeason && <LatestSeasonCard season={latestSeason} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LeagueDashboardContent />
    </Suspense>
  );
}
