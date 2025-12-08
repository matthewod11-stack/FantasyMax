'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CareerStatsRow, LeagueRecordRow } from '@/types/contracts/queries';

interface TrophyCaseProps {
  championships: { years: number[]; total: number };
  recordsHeld: LeagueRecordRow[];
  careerStats: CareerStatsRow;
}

function formatWinPercentage(pct: number): string {
  return (pct * 100).toFixed(1) + '%';
}

function RecordCard({ record }: { record: LeagueRecordRow }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-1.5 rounded bg-amber-500/10">
        <Award className="h-4 w-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{record.description}</p>
        <p className="text-xs text-muted-foreground">
          {record.record_type.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
}

export function TrophyCase({ championships, recordsHeld, careerStats }: TrophyCaseProps) {
  const hasChampionships = championships.total > 0;
  const hasRecords = recordsHeld.length > 0;
  const isEmpty = !hasChampionships && !hasRecords;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Trophy Case
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No trophies yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Keep competing to earn your place in history!
            </p>
          </div>
        ) : (
          <>
            {/* Championships */}
            {hasChampionships && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Championships
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <span className="text-3xl font-bold text-yellow-500">
                    {championships.total}x
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {championships.years.map((year) => (
                      <Badge
                        key={year}
                        className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                      >
                        {year}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Records held */}
            {hasRecords && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Records Held ({recordsHeld.length})
                </p>
                <div className="space-y-2">
                  {recordsHeld.slice(0, 3).map((record, idx) => (
                    <RecordCard key={idx} record={record} />
                  ))}
                  {recordsHeld.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{recordsHeld.length - 3} more records
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Career highlights always shown */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Career Highlights
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{formatWinPercentage(careerStats.win_percentage)}</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{careerStats.playoff_appearances}</p>
                <p className="text-xs text-muted-foreground">Playoff Apps</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
