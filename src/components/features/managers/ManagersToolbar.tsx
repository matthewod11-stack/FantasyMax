'use client';

import { LayoutGrid, List, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'power-rank';
export type SortField = 'championships' | 'wins' | 'winPct' | 'points' | 'seasons' | 'name';
export type SortDirection = 'asc' | 'desc';

interface ManagersToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (dir: SortDirection) => void;
  showInactive: boolean;
  onShowInactiveChange: (show: boolean) => void;
  totalCount: number;
  activeCount: number;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'championships', label: 'Championships' },
  { value: 'wins', label: 'Total Wins' },
  { value: 'winPct', label: 'Win %' },
  { value: 'points', label: 'Total Points' },
  { value: 'seasons', label: 'Seasons Played' },
  { value: 'name', label: 'Name' },
];

export function ManagersToolbar({
  viewMode,
  onViewModeChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  showInactive,
  onShowInactiveChange,
  totalCount,
  activeCount,
}: ManagersToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      {/* Left side - View toggles */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">View:</span>
        <div className="flex rounded-lg border bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3',
              viewMode === 'grid' && 'bg-background shadow-sm'
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Grid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3',
              viewMode === 'list' && 'bg-background shadow-sm'
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4 mr-1.5" />
            List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3',
              viewMode === 'power-rank' && 'bg-background shadow-sm'
            )}
            onClick={() => onViewModeChange('power-rank')}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Power Rank
          </Button>
        </div>
      </div>

      {/* Right side - Sort and filter */}
      <div className="flex items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortField} onValueChange={(v) => onSortFieldChange(v as SortField)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2"
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'desc' ? '↓' : '↑'}
          </Button>
        </div>

        {/* Filter inactive */}
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          className="h-9"
          onClick={() => onShowInactiveChange(!showInactive)}
        >
          {showInactive ? `All (${totalCount})` : `Active (${activeCount})`}
        </Button>
      </div>
    </div>
  );
}
