'use client';

import { cn } from '@/lib/utils';
import { ShameCard } from './ShameCard';
import { ToiletTrophyImage } from './ToiletTrophyImage';
import { Skull, Calendar } from 'lucide-react';
import { hasToiletTrophy } from '@/lib/utils/trophy-map';
import type { ShameInductee } from '@/lib/supabase/queries';

interface SeasonInducteesProps {
  inductees: ShameInductee[];
  className?: string;
}

/**
 * SeasonInductees - Year-by-Year Hall of Shame Timeline
 *
 * Shows all last place finishers organized by season,
 * creating a timeline of shame through the years.
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

            {/* Inductee cards for this decade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {decadeInductees.map((inductee) => {
                const hasTrophy = hasToiletTrophy(inductee.season_year);
                return (
                  <div
                    key={`${inductee.season_year}-${inductee.member_id}`}
                    className={cn(
                      'flex gap-4',
                      hasTrophy ? 'flex-row items-stretch' : 'flex-col'
                    )}
                  >
                    {/* Toilet Trophy Image */}
                    {hasTrophy && (
                      <ToiletTrophyImage
                        year={inductee.season_year}
                        memberName={inductee.display_name}
                        size="md"
                        showYearBadge={false}
                        className="flex-shrink-0"
                      />
                    )}
                    {/* Shame Card */}
                    <div className="flex-1">
                      <ShameCard inductee={inductee} className="h-full" />
                    </div>
                  </div>
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
