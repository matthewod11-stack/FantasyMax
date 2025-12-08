'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface WeeklyData {
  week: number;
  rank: number;
  points: number;
  record: string;
}

interface TeamJourney {
  id: string;
  teamName: string;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  weeklyData: WeeklyData[];
  isChampion: boolean;
  isLastPlace: boolean;
  color: string;
}

interface SeasonJourneyChartProps {
  teams: TeamJourney[];
  totalWeeks: number;
  playoffStartWeek?: number;
  onTeamClick?: (memberId: string) => void;
}

// Color palette for teams (12 distinct colors)
const TEAM_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
];

export function SeasonJourneyChart({
  teams,
  totalWeeks,
  playoffStartWeek,
  onTeamClick,
}: SeasonJourneyChartProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'rank' | 'points'>('rank');
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  // Assign colors to teams - ensure every team has a color
  const teamsWithColors = useMemo(() => {
    return teams.map((team, index): TeamJourney => {
      const fallbackColor = TEAM_COLORS[index % TEAM_COLORS.length] ?? '#6b7280';
      return {
        ...team,
        color: team.color || fallbackColor,
      };
    });
  }, [teams]);

  // Calculate chart dimensions
  const chartHeight = 300;
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 40 };
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // Get min/max for scaling
  const numTeams = teams.length;

  // Scale functions
  const xScale = (week: number) => {
    const usableWidth = 100 - (chartPadding.left + chartPadding.right) / 8;
    return chartPadding.left + (week - 1) / (totalWeeks - 1) * usableWidth * 8;
  };

  const yScaleRank = (rank: number) => {
    const usableHeight = chartHeight - chartPadding.top - chartPadding.bottom;
    // Invert so rank 1 is at top
    return chartPadding.top + ((rank - 1) / (numTeams - 1)) * usableHeight;
  };

  // Generate path for a team's journey
  const generatePath = (team: TeamJourney, mode: 'rank' | 'points') => {
    const data = team.weeklyData.filter(w => w.week <= totalWeeks);
    if (data.length === 0) return '';

    const points = data.map(w => {
      const x = xScale(w.week);
      const y = mode === 'rank' ? yScaleRank(w.rank) : yScaleRank(w.rank);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={displayMode === 'rank' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplayMode('rank')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Rank
          </Button>
          <Button
            variant={displayMode === 'points' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplayMode('points')}
            disabled
            title="Coming soon"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Points
          </Button>
        </div>

        {selectedTeam && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTeam(null)}
          >
            Show All
          </Button>
        )}
      </div>

      {/* Chart */}
      <div className="relative bg-card rounded-lg border p-4">
        <svg
          viewBox={`0 0 ${chartPadding.left + totalWeeks * 60 + chartPadding.right} ${chartHeight}`}
          className="w-full"
          style={{ height: chartHeight }}
        >
          {/* Grid lines */}
          <g className="text-muted-foreground/20">
            {/* Horizontal grid lines for each rank */}
            {Array.from({ length: numTeams }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={chartPadding.left}
                y1={yScaleRank(i + 1)}
                x2={chartPadding.left + totalWeeks * 60}
                y2={yScaleRank(i + 1)}
                stroke="currentColor"
                strokeDasharray="2,4"
              />
            ))}
            {/* Vertical grid lines for each week */}
            {weeks.map(week => (
              <line
                key={`v-${week}`}
                x1={xScale(week)}
                y1={chartPadding.top}
                x2={xScale(week)}
                y2={chartHeight - chartPadding.bottom}
                stroke="currentColor"
                strokeDasharray={week === playoffStartWeek ? "0" : "2,4"}
                strokeWidth={week === playoffStartWeek ? 2 : 1}
                className={week === playoffStartWeek ? "text-primary/50" : ""}
              />
            ))}
          </g>

          {/* Playoff zone indicator */}
          {playoffStartWeek && (
            <rect
              x={xScale(playoffStartWeek)}
              y={chartPadding.top}
              width={xScale(totalWeeks) - xScale(playoffStartWeek) + 20}
              height={chartHeight - chartPadding.top - chartPadding.bottom}
              fill="currentColor"
              className="text-primary/5"
            />
          )}

          {/* Y-axis labels (ranks) */}
          <g className="text-xs fill-muted-foreground">
            {[1, Math.ceil(numTeams / 2), numTeams].map(rank => (
              <text
                key={rank}
                x={chartPadding.left - 8}
                y={yScaleRank(rank)}
                textAnchor="end"
                dominantBaseline="middle"
              >
                #{rank}
              </text>
            ))}
          </g>

          {/* X-axis labels (weeks) */}
          <g className="text-xs fill-muted-foreground">
            {weeks.filter((_, i) => i % Math.ceil(totalWeeks / 10) === 0 || _ === totalWeeks).map(week => (
              <text
                key={week}
                x={xScale(week)}
                y={chartHeight - chartPadding.bottom + 16}
                textAnchor="middle"
              >
                W{week}
              </text>
            ))}
          </g>

          {/* Team paths */}
          {teamsWithColors.map(team => {
            const isSelected = selectedTeam === team.id;
            const isOther = selectedTeam && selectedTeam !== team.id;

            return (
              <g key={team.id}>
                <path
                  d={generatePath(team, displayMode)}
                  fill="none"
                  stroke={team.color}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeOpacity={isOther ? 0.15 : isSelected ? 1 : 0.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-opacity"
                  onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                />
                {/* End point marker */}
                {team.weeklyData.length > 0 && (() => {
                  const lastData = team.weeklyData[team.weeklyData.length - 1];
                  if (!lastData) return null;
                  return (
                    <circle
                      cx={xScale(lastData.week)}
                      cy={yScaleRank(lastData.rank)}
                      r={isSelected ? 6 : 4}
                      fill={team.color}
                      opacity={isOther ? 0.15 : 1}
                      className="cursor-pointer"
                      onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                    />
                  );
                })()}
              </g>
            );
          })}

          {/* Hover indicator */}
          {hoveredWeek && (
            <line
              x1={xScale(hoveredWeek)}
              y1={chartPadding.top}
              x2={xScale(hoveredWeek)}
              y2={chartHeight - chartPadding.bottom}
              stroke="currentColor"
              strokeWidth={1}
              className="text-foreground/50"
            />
          )}
        </svg>

        {/* Playoff label */}
        {playoffStartWeek && (
          <div
            className="absolute text-xs text-primary font-medium"
            style={{
              top: chartPadding.top - 4,
              left: `${(playoffStartWeek / totalWeeks) * 100}%`,
            }}
          >
            Playoffs →
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {teamsWithColors.map(team => {
          const isSelected = selectedTeam === team.id;
          const isOther = selectedTeam && selectedTeam !== team.id;

          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(isSelected ? null : team.id)}
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-all',
                'border hover:bg-accent/50',
                isSelected && 'bg-accent border-primary',
                isOther && 'opacity-40'
              )}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <span className="truncate max-w-[100px]">
                {team.member.display_name}
              </span>
              {team.isChampion && <span className="text-yellow-500">🏆</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
