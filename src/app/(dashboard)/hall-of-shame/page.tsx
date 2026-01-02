import { Suspense } from 'react';
import { Skull, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShameCard,
  ShameLeaderboard,
  SeasonInductees,
  TrophyGallery,
  ShameSkeleton,
  ToiletTrophyImage,
} from '@/components/features/hall-of-shame';
import {
  getHallOfShame,
  getShameInducteesBySeason,
} from '@/lib/supabase/queries';
import { hasToiletTrophy, getToiletTrophyYears } from '@/lib/utils/trophy-map';

export const dynamic = 'force-dynamic';

/**
 * Hall of Shame content - fetches and displays shame data
 */
async function HallOfShameContent() {
  // Fetch data in parallel
  const [shameLeaderboard, seasonInductees] = await Promise.all([
    getHallOfShame(),
    getShameInducteesBySeason(),
  ]);

  const totalInductees = seasonInductees.length;
  const mostShamed = shameLeaderboard[0];
  const latestInductee = seasonInductees[0];
  const latestHasTrophy = latestInductee ? hasToiletTrophy(latestInductee.season_year) : false;

  // Empty state
  if (totalInductees === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-display text-muted-foreground mb-2">
          No Shame Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The Hall of Shame awaits its first inductee. Someone has to finish last...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero section - Most recent inductee */}
      {latestInductee && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-loss" />
            <h2 className="font-display text-xl uppercase tracking-wide text-foreground">
              Latest Inductee
            </h2>
          </div>
          <div className={cn(
            "flex flex-col md:flex-row gap-6",
            !latestHasTrophy && "max-w-md"
          )}>
            <ShameCard 
              inductee={latestInductee} 
              featured 
              className={cn("flex-1", !latestHasTrophy && "w-full")} 
            />
            {latestHasTrophy && (
              <div className="flex-shrink-0">
                <ToiletTrophyImage 
                  year={latestInductee.season_year}
                  memberName={latestInductee.display_name}
                  size="lg"
                  className="mx-auto md:mx-0"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="h-auto gap-1 p-1">
          <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:text-loss">
            <Skull className="h-4 w-4" />
            <span>Shame Leaderboard</span>
            <span className="text-xs text-muted-foreground">({shameLeaderboard.length})</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 data-[state=active]:text-loss">
            <Trophy className="h-4 w-4" />
            <span>By Season</span>
            <span className="text-xs text-muted-foreground">({totalInductees})</span>
          </TabsTrigger>
          <TabsTrigger value="trophies" className="gap-2 data-[state=active]:text-loss">
            <Skull className="h-4 w-4" />
            <span>Trophy Room</span>
            <span className="text-xs text-muted-foreground">({getToiletTrophyYears().length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Shame Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wide text-loss">
                  Most Last Places
                </h2>
                <p className="text-sm text-muted-foreground">
                  The distinguished members who&apos;ve earned their place in infamy
                </p>
              </div>
              {mostShamed && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Current King of Shame
                  </p>
                  <p className="font-display text-lg text-loss">
                    {mostShamed.display_name}
                  </p>
                </div>
              )}
            </div>
            <ShameLeaderboard members={shameLeaderboard} />
          </section>
        </TabsContent>

        {/* Season-by-Season Tab */}
        <TabsContent value="timeline">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide text-muted-foreground">
                Season Inductees
              </h2>
              <p className="text-sm text-muted-foreground">
                A chronological journey through failure
              </p>
            </div>
            <SeasonInductees inductees={seasonInductees} />
          </section>
        </TabsContent>

        {/* Trophy Room Tab */}
        <TabsContent value="trophies">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide text-loss">
                Toilet Trophy Winners
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-generated memorials of the most historic flushes
              </p>
            </div>
            <TrophyGallery inductees={seasonInductees} />
          </section>
        </TabsContent>
      </Tabs>

      {/* Fun stats footer */}
      <section className="border-t border-border pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Inductees"
            value={totalInductees.toString()}
            icon={<Skull className="h-4 w-4" />}
          />
          <StatCard
            label="Unique Members"
            value={shameLeaderboard.length.toString()}
            icon={<Skull className="h-4 w-4" />}
          />
          <StatCard
            label="Most Shamed"
            value={mostShamed?.last_place_finishes.toString() ?? '0'}
            subtext={mostShamed?.display_name}
            icon={<Skull className="h-4 w-4" />}
          />
          <StatCard
            label="Seasons Tracked"
            value={new Set(seasonInductees.map(i => i.season_year)).size.toString()}
            icon={<Trophy className="h-4 w-4" />}
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
 * Hall of Shame Page
 *
 * Immortalizes the last place finishers with a dedicated "trophy room of failure".
 * Features:
 * - Latest inductee highlight
 * - Shame leaderboard (most last places)
 * - Season-by-season timeline of inductees
 * - Fun stats about the hall
 */
export default function HallOfShamePage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Skull className="h-8 w-8 text-loss" />
          <h1 className="font-display text-4xl tracking-wide text-foreground">
            HALL OF SHAME
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          Where legends go to... not be remembered fondly
        </p>
      </div>

      {/* Content with loading state */}
      <Suspense fallback={<ShameSkeleton />}>
        <HallOfShameContent />
      </Suspense>
    </div>
  );
}
