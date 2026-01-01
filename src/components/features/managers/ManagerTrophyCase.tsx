import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, DollarSign, Star } from 'lucide-react';
import type { WeeklyHighScoreData } from '@/lib/supabase/queries';

interface ManagerTrophyCaseProps {
  championships: {
    years: number[];
    total: number;
  };
  weeklyHighScores: WeeklyHighScoreData;
}

export function ManagerTrophyCase({
  championships,
  weeklyHighScores,
}: ManagerTrophyCaseProps) {
  const hasChampionships = championships.total > 0;
  const hasWeeklyHighScores = weeklyHighScores.count > 0;
  const isEmpty = !hasChampionships && !hasWeeklyHighScores;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Trophy Case
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

            {/* Divider if both sections exist */}
            {hasChampionships && (
              <div className="border-t" />
            )}

            {/* Career Earnings */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Career Earnings
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Weekly High Scores */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500 tabular-nums">
                      ${weeklyHighScores.earnings.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {weeklyHighScores.count} weekly high score{weeklyHighScores.count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Championship Winnings - Coming Soon */}
                <div className="p-4 rounded-lg bg-muted/30 opacity-60">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Championship winnings
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
