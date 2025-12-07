'use client';

import { useState } from 'react';
import { Trophy, Skull, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonData {
  year: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  finalRank: number | null;
  isChampion: boolean;
  isLastPlace: boolean;
  madePlayoffs: boolean;
}

interface CareerTimelineProps {
  seasons: SeasonData[];
  onSeasonClick?: (year: number) => void;
}

export function CareerTimeline({ seasons, onSeasonClick }: CareerTimelineProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Sort by year ascending
  const sortedSeasons = [...seasons].sort((a, b) => a.year - b.year);

  // Calculate win percentage for each season
  const seasonsWithWinPct = sortedSeasons.map((season) => {
    const totalGames = season.wins + season.losses + season.ties;
    const winPct = totalGames > 0
      ? (season.wins + season.ties * 0.5) / totalGames
      : 0;
    return { ...season, winPct };
  });

  // Find min/max win percentages for scaling
  const minWinPct = Math.min(...seasonsWithWinPct.map((s) => s.winPct), 0.3);
  const maxWinPct = Math.max(...seasonsWithWinPct.map((s) => s.winPct), 0.7);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2" />

      {/* Timeline points */}
      <div className="relative flex justify-between items-end min-h-[200px] pb-8 pt-16">
        {seasonsWithWinPct.map((season) => {
          const isHovered = hoveredYear === season.year;
          // Calculate height based on win percentage (30% to 100% of container)
          const heightPercent = 30 + ((season.winPct - minWinPct) / (maxWinPct - minWinPct)) * 70;
          // Calculate position trend
          const prevSeason = seasonsWithWinPct.find((s) => s.year === season.year - 1);
          const trend = prevSeason
            ? season.winPct > prevSeason.winPct
              ? 'up'
              : season.winPct < prevSeason.winPct
                ? 'down'
                : 'neutral'
            : 'neutral';

          return (
            <div
              key={season.year}
              className="flex flex-col items-center relative group cursor-pointer"
              onMouseEnter={() => setHoveredYear(season.year)}
              onMouseLeave={() => setHoveredYear(null)}
              onClick={() => onSeasonClick?.(season.year)}
            >
              {/* Hover card */}
              <div
                className={cn(
                  'absolute bottom-full mb-2 p-3 bg-popover border rounded-lg shadow-lg z-10',
                  'transition-all duration-200 min-w-[180px]',
                  isHovered
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                )}
              >
                <div className="text-sm font-bold mb-1">{season.teamName}</div>
                <div className="text-lg font-bold tabular-nums">
                  {season.wins}-{season.losses}
                  {season.ties > 0 && `-${season.ties}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(season.winPct * 100).toFixed(1)}% Win Rate
                </div>
                {season.finalRank && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Finished #{season.finalRank}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {season.madePlayoffs && (
                    <span className="text-green-500">Made Playoffs</span>
                  )}
                  {!season.madePlayoffs && (
                    <span className="text-muted-foreground">Missed Playoffs</span>
                  )}
                </div>
              </div>

              {/* Bar / point */}
              <div
                className={cn(
                  'w-3 rounded-t-full transition-all duration-300',
                  season.isChampion
                    ? 'bg-yellow-500'
                    : season.isLastPlace
                      ? 'bg-red-500'
                      : season.madePlayoffs
                        ? 'bg-green-500'
                        : 'bg-muted-foreground/50',
                  isHovered && 'scale-110'
                )}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Icon overlay for special seasons */}
              {season.isChampion && (
                <div className="absolute top-0 -translate-y-6">
                  <Trophy
                    className={cn(
                      'h-5 w-5 text-yellow-500',
                      isHovered && 'animate-bounce'
                    )}
                  />
                </div>
              )}
              {season.isLastPlace && (
                <div className="absolute top-0 -translate-y-6">
                  <Skull className="h-5 w-5 text-red-500" />
                </div>
              )}

              {/* Year label */}
              <div
                className={cn(
                  'absolute -bottom-6 text-xs font-medium transition-colors',
                  isHovered ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {season.year}
              </div>

              {/* Trend indicator */}
              <div className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <span>Champion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Playoffs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted-foreground/50" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span>Last Place</span>
        </div>
      </div>
    </div>
  );
}
