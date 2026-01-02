'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ToiletTrophyImage } from './ToiletTrophyImage';
import { getToiletTrophyYears } from '@/lib/utils/trophy-map';
import { Skull, Ghost } from 'lucide-react';
import type { ShameInductee } from '@/lib/supabase/queries';

interface TrophyGalleryProps {
  inductees: ShameInductee[];
  className?: string;
}

/**
 * TrophyGallery - Display all AI-generated "toilet trophy" winners in a grid.
 * 
 * Provides a dedicated space to view all the humorous images of 
 * last-place finishers in one place.
 */
export function TrophyGallery({ inductees, className }: TrophyGalleryProps) {
  const trophyYears = getToiletTrophyYears();
  
  // Filter inductees to only those who have a trophy image
  const trophyWinners = trophyYears
    .map(year => {
      const inductee = inductees.find(i => i.season_year === year);
      return { year, inductee };
    })
    .filter(item => item.inductee)
    .sort((a, b) => b.year - a.year);

  if (trophyWinners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Ghost className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No trophy images have been generated yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {trophyWinners.map(({ year, inductee }) => (
          <div 
            key={year} 
            className="group flex flex-col items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="relative">
              <ToiletTrophyImage 
                year={year} 
                memberName={inductee!.display_name}
                size="md"
                className="shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Skull className="h-4 w-4 text-loss" />
                <span className="font-display text-xl uppercase tracking-wide text-foreground">
                  {year} Inductee
                </span>
              </div>
              <p className="font-body font-semibold text-muted-foreground">
                {inductee!.display_name}
              </p>
              <p className="text-xs text-muted-foreground italic">
                &quot;{inductee!.team_name}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

