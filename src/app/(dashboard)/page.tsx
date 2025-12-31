import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { getDashboardData, getThisWeekInHistory } from '@/lib/supabase/queries';
import {
  HistoryWidget,
  TrophyCase,
  RivalryTracker,
  DashboardSkeleton,
} from '@/components/features/dashboard';

export const metadata = {
  title: 'Dashboard | League of Degenerates',
  description: 'Your personalized fantasy football dashboard',
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

interface DashboardContentProps {
  memberId?: string;
}

async function DashboardContent({ memberId }: DashboardContentProps) {
  const supabase = await createAdminClient();

  // Get member from URL param, fallback to commissioner, then any member
  let member = null;

  if (memberId) {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();
    member = data;
  }

  if (!member) {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('role', 'commissioner')
      .limit(1)
      .single();
    member = data;
  }

  if (!member) {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    member = data;
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome to League of Degenerates</h2>
        <p className="text-muted-foreground">
          No league data found. Import your league to get started.
        </p>
      </div>
    );
  }

  // Fetch dashboard data and current week in parallel
  const [dashboardData, currentWeek] = await Promise.all([
    getDashboardData(member.id),
    getCurrentWeek(),
  ]);

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
        <p className="text-muted-foreground">
          There was an issue loading your stats. Please try again.
        </p>
      </div>
    );
  }

  // Fetch history events for the current week
  const historyEvents = await getThisWeekInHistory(member.id, currentWeek);

  const {
    careerStats,
    topNemesis,
    topVictim,
    championships,
    recordsHeld,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Personalized header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {member.display_name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          {careerStats.seasons_played > 0 ? (
            <>
              {careerStats.seasons_played} seasons | {careerStats.total_wins}-{careerStats.total_losses}
              {careerStats.total_ties > 0 && `-${careerStats.total_ties}`} career record
              {championships.total > 0 && ` | ${championships.total}x Champion`}
            </>
          ) : (
            'League member'
          )}
        </p>
      </div>

      {/* Widget grid - 3 tiles across */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TrophyCase
          championships={championships}
          recordsHeld={recordsHeld}
          careerStats={careerStats}
        />
        <HistoryWidget
          events={historyEvents}
          currentWeek={currentWeek}
        />
        <RivalryTracker
          member={member}
          topNemesis={topNemesis}
          topVictim={topVictim}
        />
      </div>
    </div>
  );
}

interface DashboardPageProps {
  searchParams: Promise<{ member?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent memberId={params.member} />
    </Suspense>
  );
}
