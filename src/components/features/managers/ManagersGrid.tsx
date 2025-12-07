'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ManagerCard, type CareerStats } from './ManagerCard';
import { ManagersToolbar, type ViewMode, type SortField, type SortDirection } from './ManagersToolbar';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/database.types';

interface ManagerWithStats extends Member {
  stats: CareerStats;
}

interface ManagersGridProps {
  managers: ManagerWithStats[];
}

export function ManagersGrid({ managers }: ManagersGridProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('championships');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showInactive, setShowInactive] = useState(false);

  const activeManagers = useMemo(
    () => managers.filter((m) => m.is_active),
    [managers]
  );

  const filteredManagers = useMemo(
    () => (showInactive ? managers : activeManagers),
    [managers, activeManagers, showInactive]
  );

  const sortedManagers = useMemo(() => {
    const sorted = [...filteredManagers].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'championships':
          aVal = a.stats.championships;
          bVal = b.stats.championships;
          break;
        case 'wins':
          aVal = a.stats.totalWins;
          bVal = b.stats.totalWins;
          break;
        case 'winPct':
          aVal = a.stats.winPercentage;
          bVal = b.stats.winPercentage;
          break;
        case 'points':
          aVal = a.stats.totalPointsFor;
          bVal = b.stats.totalPointsFor;
          break;
        case 'seasons':
          aVal = a.stats.seasonsPlayed;
          bVal = b.stats.seasonsPlayed;
          break;
        case 'name':
          aVal = a.display_name.toLowerCase();
          bVal = b.display_name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [filteredManagers, sortField, sortDirection]);

  const handleManagerClick = (memberId: string) => {
    router.push(`/managers/${memberId}`);
  };

  // Power rank view - cards sized by win percentage
  if (viewMode === 'power-rank') {
    const maxWinPct = Math.max(...sortedManagers.map((m) => m.stats.winPercentage), 0.5);

    return (
      <>
        <ManagersToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
          totalCount={managers.length}
          activeCount={activeManagers.length}
        />

        <div className="flex flex-wrap gap-4 items-end justify-center">
          {sortedManagers.map((manager, index) => {
            const scale = 0.7 + (manager.stats.winPercentage / maxWinPct) * 0.3;
            const opacity = 0.6 + (manager.stats.winPercentage / maxWinPct) * 0.4;

            return (
              <div
                key={manager.id}
                className="transition-all duration-500 ease-out"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <ManagerCard
                  member={manager}
                  stats={manager.stats}
                  variant="grid"
                  onClick={() => handleManagerClick(manager.id)}
                />
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <ManagersToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        totalCount={managers.length}
        activeCount={activeManagers.length}
      />

      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-3'
        )}
      >
        {sortedManagers.map((manager, index) => (
          <div
            key={manager.id}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <ManagerCard
              member={manager}
              stats={manager.stats}
              variant={viewMode === 'grid' ? 'grid' : 'full'}
              onClick={() => handleManagerClick(manager.id)}
            />
          </div>
        ))}
      </div>

      {sortedManagers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No managers found.
        </div>
      )}
    </>
  );
}
