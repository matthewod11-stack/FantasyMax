'use client';

import { cn } from '@/lib/utils';
import { AwardCard } from './AwardCard';
import { Trophy, Calendar } from 'lucide-react';
import type { AwardsBySeason } from '@/lib/supabase/queries';

interface AwardsByYearProps {
  seasons: AwardsBySeason[];
  className?: string;
}

/**
 * AwardsByYear - Timeline view of awards grouped by season
 *
 * Displays all awards organized by year with visual timeline connectors.
 * Awards within each year are shown in a responsive grid.
 */
export function AwardsByYear({ seasons, className }: AwardsByYearProps) {
  if (seasons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No awards have been given yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {seasons.map((season, seasonIndex) => (
        <div key={season.year} className="relative">
          {/* Timeline connector (except for last item) */}
          {seasonIndex < seasons.length - 1 && (
            <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-border" />
          )}

          {/* Year header with badge */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gold/20 border-2 border-gold/50">
              <Calendar className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-2xl tracking-wide text-foreground">
                {season.year}
              </h3>
              <p className="text-xs text-muted-foreground">
                {season.awards.length} award{season.awards.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Awards grid for this year */}
          <div className="ml-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sort: positive awards first, then by name */}
            {[...season.awards]
              .sort((a, b) => {
                if (a.is_positive !== b.is_positive) {
                  return a.is_positive ? -1 : 1;
                }
                return a.award_type_name.localeCompare(b.award_type_name);
              })
              .map((award) => (
                <AwardCard key={award.id} award={award} hideYear />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
