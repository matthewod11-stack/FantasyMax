'use client';

import { useState } from 'react';
import { Trophy, Skull } from 'lucide-react';
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

  // Find max wins for scaling (minimum of 10 for reasonable chart)
  const maxWins = Math.max(...sortedSeasons.map((s) => s.wins), 10);

  // Chart dimensions
  const chartHeight = 160; // px
  const barMaxHeight = chartHeight - 20; // Leave room for icons

  // Calculate bar height based on wins
  const getBarHeight = (wins: number) => {
    return Math.max((wins / maxWins) * barMaxHeight, 4); // minimum 4px
  };

  // Get bar color based on season outcome
  const getBarColor = (season: SeasonData) => {
    if (season.isChampion) return 'bg-yellow-500';
    if (season.isLastPlace) return 'bg-red-500';
    if (season.madePlayoffs) return 'bg-green-500';
    return 'bg-muted-foreground/40';
  };

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">{maxWins}W</span>
        <span className="tabular-nums">{Math.round(maxWins / 2)}W</span>
        <span className="tabular-nums">0W</span>
      </div>

      {/* Chart area */}
      <div className="ml-10">
        {/* Grid lines */}
        <div className="absolute left-10 right-0 top-0" style={{ height: chartHeight }}>
          <div className="absolute left-0 right-0 top-0 border-t border-border/30" />
          <div className="absolute left-0 right-0 top-1/2 border-t border-border/30" />
          <div className="absolute left-0 right-0 bottom-0 border-t border-border" />
        </div>

        {/* Bars */}
        <div
          className="relative flex items-end justify-around gap-1"
          style={{ height: chartHeight }}
        >
          {sortedSeasons.map((season) => {
            const isHovered = hoveredYear === season.year;
            const barHeight = getBarHeight(season.wins);
            const winPct = season.wins + season.losses + season.ties > 0
              ? ((season.wins + season.ties * 0.5) / (season.wins + season.losses + season.ties) * 100).toFixed(1)
              : '0.0';

            return (
              <div
                key={season.year}
                className="flex-1 flex flex-col items-center relative group cursor-pointer min-w-0"
                onMouseEnter={() => setHoveredYear(season.year)}
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => onSeasonClick?.(season.year)}
              >
                {/* Hover tooltip */}
                <div
                  className={cn(
                    'absolute bottom-full mb-2 p-3 bg-popover border rounded-lg shadow-lg z-20',
                    'transition-all duration-200 min-w-[160px] whitespace-nowrap',
                    isHovered
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 pointer-events-none'
                  )}
                >
                  <div className="text-sm font-bold mb-1 truncate">{season.teamName}</div>
                  <div className="text-xl font-bold tabular-nums">
                    {season.wins}-{season.losses}
                    {season.ties > 0 && `-${season.ties}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {winPct}% Win Rate
                  </div>
                  {season.finalRank && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Finished #{season.finalRank}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {season.isChampion && (
                      <span className="text-yellow-500 font-medium">🏆 Champion</span>
                    )}
                    {season.isLastPlace && (
                      <span className="text-red-500 font-medium">💀 Last Place</span>
                    )}
                    {!season.isChampion && !season.isLastPlace && season.madePlayoffs && (
                      <span className="text-green-500">Made Playoffs</span>
                    )}
                    {!season.isChampion && !season.isLastPlace && !season.madePlayoffs && (
                      <span className="text-muted-foreground">Missed Playoffs</span>
                    )}
                  </div>
                </div>

                {/* Icon for special seasons */}
                {(season.isChampion || season.isLastPlace) && (
                  <div
                    className="absolute z-10 transition-transform"
                    style={{ bottom: barHeight + 4 }}
                  >
                    {season.isChampion && (
                      <Trophy
                        className={cn(
                          'h-4 w-4 text-yellow-500',
                          isHovered && 'scale-125'
                        )}
                      />
                    )}
                    {season.isLastPlace && !season.isChampion && (
                      <Skull
                        className={cn(
                          'h-4 w-4 text-red-500',
                          isHovered && 'scale-125'
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Bar */}
                <div
                  className={cn(
                    'w-full max-w-[24px] rounded-t transition-all duration-200',
                    getBarColor(season),
                    isHovered && 'opacity-80 scale-x-110'
                  )}
                  style={{ height: barHeight }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels (years) */}
        <div className="flex justify-around gap-1 mt-2">
          {sortedSeasons.map((season) => {
            const isHovered = hoveredYear === season.year;
            return (
              <div
                key={season.year}
                className={cn(
                  'flex-1 text-center text-xs tabular-nums transition-colors min-w-0',
                  isHovered ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {/* Show abbreviated year on small screens */}
                <span className="hidden sm:inline">{season.year}</span>
                <span className="sm:hidden">{String(season.year).slice(-2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 sm:gap-6 mt-6 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <span>Champion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Playoffs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted-foreground/40" />
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
