'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skull, Calendar, TrendingDown, Target } from 'lucide-react';
import { getToiletTrophyUrlWithFallback, hasToiletTrophy } from '@/lib/utils/trophy-map';
import type { ShameInductee } from '@/lib/supabase/queries';

interface SeasonInducteesProps {
  inductees: ShameInductee[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * SeasonInductees - Year-by-Year Hall of Shame Timeline
 *
 * Shows all last place finishers organized by season,
 * with unified cards that include trophy image and stats.
 */
export function SeasonInductees({ inductees, className }: SeasonInducteesProps) {
  if (inductees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Skull className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No inductees yet. The shame awaits...</p>
      </div>
    );
  }

  // Group inductees by decade for visual organization
  const groupedByDecade = inductees.reduce((acc, inductee) => {
    const decade = Math.floor(inductee.season_year / 10) * 10;
    const decadeLabel = `${decade}s`;
    if (!acc[decadeLabel]) {
      acc[decadeLabel] = [];
    }
    acc[decadeLabel].push(inductee);
    return acc;
  }, {} as Record<string, ShameInductee[]>);

  const decades = Object.keys(groupedByDecade).sort().reverse();

  return (
    <div className={cn('space-y-8', className)}>
      {decades.map((decade) => {
        const decadeInductees = groupedByDecade[decade] ?? [];
        return (
          <div key={decade} className="space-y-4">
            {/* Decade header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-display text-lg text-foreground">{decade}</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {decadeInductees.length} inductee{decadeInductees.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Unified inductee cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {decadeInductees.map((inductee) => {
                const trophyUrl = getToiletTrophyUrlWithFallback(inductee.season_year);
                const isCustomTrophy = hasToiletTrophy(inductee.season_year);

                return (
                  <Card
                    key={`${inductee.season_year}-${inductee.member_id}`}
                    className="relative overflow-hidden border-loss/30 hover:border-loss/50 transition-colors"
                  >
                    {/* Background skull watermark */}
                    <div className="absolute top-4 right-4 opacity-5">
                      <Skull className="h-24 w-24" />
                    </div>

                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Trophy image section */}
                        <div className="relative w-32 sm:w-40 shrink-0">
                          <Image
                            src={trophyUrl}
                            alt={`${inductee.display_name}'s Toilet Trophy - ${inductee.season_year}`}
                            width={160}
                            height={160}
                            className={cn(
                              'w-full h-full object-cover',
                              !isCustomTrophy && 'opacity-70'
                            )}
                          />
                          {/* Year badge on image */}
                          <Badge
                            className="absolute top-2 left-2 bg-loss/90 text-white border-0"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {inductee.season_year}
                          </Badge>
                        </div>

                        {/* Info section */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          {/* Member info */}
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 border-2 border-loss/30">
                              <AvatarImage src={`/avatars/${inductee.display_name.toLowerCase().replace(/\s+/g, '-')}.png`} />
                              <AvatarFallback className="bg-loss/10 text-loss text-sm">
                                {getInitials(inductee.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {inductee.display_name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {inductee.team_name}
                              </p>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1 text-loss">
                              <TrendingDown className="h-4 w-4" />
                              <span className="font-mono text-sm font-medium">
                                {inductee.wins}-{inductee.losses}
                                {inductee.ties > 0 && `-${inductee.ties}`}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {inductee.points_for.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              #{inductee.final_rank}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Timeline connector decoration */}
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 flex flex-col items-center">
          <div className="w-px h-8 bg-border" />
          <Skull className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/50 mt-1">
            The Shame Continues...
          </p>
        </div>
      </div>
    </div>
  );
}
