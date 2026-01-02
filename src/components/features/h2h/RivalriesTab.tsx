'use client';

import { useState, useMemo } from 'react';
import { H2HRivalryCard } from './H2HRivalryCard';
import { H2HDrawer } from './H2HDrawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy, Skull, Swords, Users } from 'lucide-react';
import type { H2HRecapWithRivalry } from '@/types/contracts/queries';
import type { Member } from '@/types/database.types';

interface RivalriesTabProps {
  /** The member whose rivalries we're viewing */
  viewingMember: Member;
  /** All rivalries with AI recaps */
  rivalries: H2HRecapWithRivalry[];
  /** Matchups for the drawer (keyed by opponent ID) */
  matchupsByOpponent: Record<string, MatchupDetail[]>;
}

interface MatchupDetail {
  id: string;
  seasonYear: number;
  week: number;
  member1Score: number;
  member2Score: number;
  isPlayoff: boolean;
  isChampionship: boolean;
  winnerId: string | null;
}

type FilterType = 'all' | 'nemesis' | 'victim' | 'rival';
type SortType = 'matchups' | 'record' | 'streak';

const filterOptions: { value: FilterType; label: string; icon: typeof Users }[] = [
  { value: 'all', label: 'All', icon: Users },
  { value: 'victim', label: 'Victims', icon: Trophy },
  { value: 'nemesis', label: 'Nemeses', icon: Skull },
  { value: 'rival', label: 'Rivals', icon: Swords },
];

export function RivalriesTab({
  viewingMember,
  rivalries,
  matchupsByOpponent,
}: RivalriesTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('matchups');
  const [selectedRivalry, setSelectedRivalry] = useState<H2HRecapWithRivalry | null>(null);

  // Filter and sort rivalries
  const displayRivalries = useMemo(() => {
    let filtered = rivalries;

    // Apply filter
    if (filter !== 'all') {
      filtered = rivalries.filter((r) => r.rivalry_type === filter);
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'matchups':
          return b.total_matchups - a.total_matchups;
        case 'record':
          // Sort by win percentage (wins / total)
          const aWinPct = a.wins / (a.wins + a.losses + a.ties || 1);
          const bWinPct = b.wins / (b.wins + b.losses + b.ties || 1);
          return bWinPct - aWinPct;
        case 'streak':
          // Sort by current streak (positive = winning)
          return b.streak - a.streak;
        default:
          return 0;
      }
    });
  }, [rivalries, filter, sortBy]);

  // Stats summary
  const stats = useMemo(() => {
    const victims = rivalries.filter((r) => r.rivalry_type === 'victim').length;
    const nemeses = rivalries.filter((r) => r.rivalry_type === 'nemesis').length;
    const rivals = rivalries.filter((r) => r.rivalry_type === 'rival').length;
    const totalWins = rivalries.reduce((sum, r) => sum + r.wins, 0);
    const totalLosses = rivalries.reduce((sum, r) => sum + r.losses, 0);

    return { victims, nemeses, rivals, totalWins, totalLosses };
  }, [rivalries]);

  const handleRivalryClick = (rivalry: H2HRecapWithRivalry) => {
    setSelectedRivalry(rivalry);
  };

  const getDrawerMatchups = () => {
    if (!selectedRivalry) return [];
    return matchupsByOpponent[selectedRivalry.opponent.id] || [];
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">{stats.victims}</div>
          <div className="text-xs text-muted-foreground">Victims</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-500">{stats.nemeses}</div>
          <div className="text-xs text-muted-foreground">Nemeses</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-500">{stats.rivals}</div>
          <div className="text-xs text-muted-foreground">Rivals</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold">
            <span className="text-green-500">{stats.totalWins}</span>
            <span className="text-muted-foreground mx-1">-</span>
            <span className="text-red-500">{stats.totalLosses}</span>
          </div>
          <div className="text-xs text-muted-foreground">H2H Record</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <div className="flex rounded-lg border bg-muted p-1">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-3 gap-1.5',
                    filter === option.value && 'bg-background shadow-sm'
                  )}
                  onClick={() => setFilter(option.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="h-8 px-2 text-sm bg-muted border rounded-lg"
          >
            <option value="matchups">Most Matchups</option>
            <option value="record">Best Record</option>
            <option value="streak">Current Streak</option>
          </select>
        </div>
      </div>

      {/* Rivalries list */}
      <div className="space-y-4">
        {displayRivalries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filter === 'all'
              ? 'No rivalry data available'
              : `No ${filter === 'nemesis' ? 'nemeses' : filter + 's'} found`}
          </div>
        ) : (
          displayRivalries.map((rivalry) => (
            <H2HRivalryCard
              key={rivalry.opponent.id}
              rivalry={rivalry}
              onClick={() => handleRivalryClick(rivalry)}
            />
          ))
        )}
      </div>

      {/* Count indicator */}
      {displayRivalries.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {displayRivalries.length} of {rivalries.length} rivalries
        </div>
      )}

      {/* H2H Drawer for selected rivalry */}
      {selectedRivalry && (
        <H2HDrawer
          isOpen={true}
          onClose={() => setSelectedRivalry(null)}
          member1={viewingMember}
          member2={selectedRivalry.opponent}
          matchups={getDrawerMatchups()}
          member1Wins={selectedRivalry.wins}
          member2Wins={selectedRivalry.losses}
          aiRecap={selectedRivalry.ai_recap}
        />
      )}
    </div>
  );
}
