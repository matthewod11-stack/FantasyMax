import { Suspense } from 'react';
import { Trophy, Crown, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AwardCard,
  AwardsByYear,
  AwardLeaderboard,
  AwardsSkeleton,
} from '@/components/features/awards';
import {
  getAwardsBySeason,
  getAwardLeaderboard,
  getLatestSeasonAwards,
} from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

/**
 * Awards content - fetches and displays award data
 */
async function AwardsContent() {
  // Fetch data in parallel
  const [seasonAwards, leaderboard, latestSeason] = await Promise.all([
    getAwardsBySeason(),
    getAwardLeaderboard(10),
    getLatestSeasonAwards(),
  ]);

  const totalAwards = seasonAwards.reduce((sum, s) => sum + s.awards.length, 0);
  const totalSeasons = seasonAwards.length;
  const uniqueWinners = leaderboard.length;
  const mostDecorated = leaderboard[0];

  // Get the "featured" award - Champion from latest season, or first positive award
  const latestChampion = latestSeason?.awards.find(
    (a) => a.award_type_name === 'Champion'
  );
  const featuredAward = latestChampion || latestSeason?.awards.find((a) => a.is_positive);

  // Empty state
  if (totalAwards === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-display text-muted-foreground mb-2">
          No Awards Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Awards will appear here once the commissioner has granted them.
          Check back after the season ends!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero section - Featured award (latest champion) */}
      {featuredAward && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl uppercase tracking-wide text-foreground">
              {latestSeason?.year} Champion
            </h2>
          </div>
          <div className="max-w-md">
            <AwardCard award={featuredAward} featured />
          </div>
        </section>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="h-auto gap-1 p-1">
          <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:text-gold">
            <Trophy className="h-4 w-4" />
            <span>Most Decorated</span>
            <span className="text-xs text-muted-foreground">({uniqueWinners})</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 data-[state=active]:text-gold">
            <Calendar className="h-4 w-4" />
            <span>By Season</span>
            <span className="text-xs text-muted-foreground">({totalSeasons})</span>
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wide text-gold">
                  Most Decorated
                </h2>
                <p className="text-sm text-muted-foreground">
                  Members with the most positive awards
                </p>
              </div>
              {mostDecorated && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    All-Time Leader
                  </p>
                  <p className="font-display text-lg text-gold">
                    {mostDecorated.display_name}
                  </p>
                </div>
              )}
            </div>
            <AwardLeaderboard members={leaderboard} />
          </section>
        </TabsContent>

        {/* By Season Tab */}
        <TabsContent value="timeline">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide text-muted-foreground">
                Season Awards
              </h2>
              <p className="text-sm text-muted-foreground">
                A year-by-year history of league recognition
              </p>
            </div>
            <AwardsByYear seasons={seasonAwards} />
          </section>
        </TabsContent>
      </Tabs>

      {/* Stats footer */}
      <section className="border-t border-border pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Awards"
            value={totalAwards.toString()}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            label="Unique Winners"
            value={uniqueWinners.toString()}
            icon={<Crown className="h-4 w-4" />}
          />
          <StatCard
            label="Most Decorated"
            value={mostDecorated?.total_positive.toString() ?? '0'}
            subtext={mostDecorated?.display_name}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            label="Seasons Tracked"
            value={totalSeasons.toString()}
            icon={<Calendar className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Small stat card for footer
 */
function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl text-foreground">{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground truncate">{subtext}</p>
      )}
    </div>
  );
}

/**
 * Awards Page
 *
 * Displays end-of-season awards like MVP, Best Trade, Champion, etc.
 * Features:
 * - Latest champion highlight
 * - Most decorated member leaderboard
 * - Season-by-season timeline of all awards
 * - Summary stats footer
 */
export default function AwardsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-gold" />
          <h1 className="font-display text-4xl tracking-wide text-foreground">
            AWARDS
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          Season honors and league recognition
        </p>
      </div>

      {/* Content with loading state */}
      <Suspense fallback={<AwardsSkeleton />}>
        <AwardsContent />
      </Suspense>
    </div>
  );
}
