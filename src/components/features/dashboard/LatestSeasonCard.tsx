'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Trophy, Skull, ArrowRight, Users, Sparkles } from 'lucide-react';
import type { LatestSeasonInfo } from '@/lib/supabase/queries';

interface LatestSeasonCardProps {
  season: LatestSeasonInfo;
}

export function LatestSeasonCard({ season }: LatestSeasonCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5">
        <Calendar className="w-full h-full" />
      </div>

      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">{season.year} Season</h3>
            {season.name && (
              <p className="text-sm text-muted-foreground">{season.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{season.numTeams} teams</span>
          </div>
        </div>

        {/* Champion & Last Place */}
        {(season.championName || season.lastPlaceName) && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {season.championName && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Champion</p>
                  <p className="font-medium">{season.championName}</p>
                </div>
              </div>
            )}
            {season.lastPlaceName && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
                <Skull className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Place</p>
                  <p className="font-medium">{season.lastPlaceName}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Season Recap Preview */}
        {season.aiReviewPreview && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                {season.aiReviewPreview}
              </p>
            </div>
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={`/seasons/${season.year}`}>
            View Full Season
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
