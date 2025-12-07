'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import {
  Search,
  User,
  Calendar,
  Trophy,
  Swords,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommandPaletteProps, CommandPaletteItem } from '@/types/contracts/components';

/**
 * CommandPalette Component
 *
 * Global command palette accessible via Cmd+K / Ctrl+K.
 * Provides fuzzy search across managers, seasons, matchups, and records.
 *
 * Design Notes (from ROADMAP.md):
 * - "The power-user navigation hub - makes the app feel fast, professional"
 * - "Same library as Vercel, Linear, Raycast - proven UX pattern"
 * - "Phase 1 stepping stone to Natural Language Query"
 *
 * Features:
 * - Fuzzy search with highlighted matches
 * - Categorized results (managers, seasons, etc.)
 * - Keyboard navigation (arrow keys, enter)
 * - Recent searches (managed by parent)
 *
 * @example
 * <CommandPalette
 *   isOpen={isPaletteOpen}
 *   onClose={() => setIsPaletteOpen(false)}
 *   items={searchResults}
 *   onSearch={handleSearch}
 *   onSelect={handleSelect}
 * />
 */

const categoryIcons: Record<CommandPaletteItem['category'], React.ComponentType<{ className?: string }>> = {
  manager: User,
  season: Calendar,
  matchup: Swords,
  record: Trophy,
  action: Settings,
};

const categoryLabels: Record<CommandPaletteItem['category'], string> = {
  manager: 'Managers',
  season: 'Seasons',
  matchup: 'Matchups',
  record: 'Records',
  action: 'Actions',
};

export interface CommandPaletteComponentProps extends CommandPaletteProps {
  /** Placeholder text in search input */
  placeholder?: string;
  /** Loading state while searching */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  className?: string;
}

const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteComponentProps>(
  (
    {
      isOpen,
      onClose,
      items,
      onSearch,
      onSelect,
      placeholder = 'Search managers, seasons, records...',
      isLoading = false,
      emptyMessage = 'No results found.',
      className,
    },
    ref
  ) => {
    const [search, setSearch] = React.useState('');

    // Group items by category
    const groupedItems = React.useMemo(() => {
      const groups: Record<string, CommandPaletteItem[]> = {};
      items.forEach((item) => {
        if (!groups[item.category]) {
          groups[item.category] = [];
        }
        groups[item.category]!.push(item);
      });
      return groups;
    }, [items]);

    // Handle search input
    const handleSearchChange = (value: string) => {
      setSearch(value);
      onSearch(value);
    };

    // Handle item selection
    const handleSelect = (item: CommandPaletteItem) => {
      onSelect(item);
      onClose();
      setSearch('');
    };

    // Close on escape
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Command dialog */}
        <div className="absolute inset-x-4 top-[20%] mx-auto max-w-xl">
          <Command
            ref={ref}
            className={cn(
              'rounded-lg border border-border bg-card shadow-2xl overflow-hidden',
              className
            )}
            shouldFilter={false} // We handle filtering externally
          >
            {/* Search input */}
            <div className="flex items-center border-b border-border px-3">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Command.Input
                value={search}
                onValueChange={handleSearchChange}
                placeholder={placeholder}
                className={cn(
                  'flex-1 bg-transparent py-3 px-2 text-sm',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none'
                )}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="p-1 rounded hover:bg-secondary"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Results */}
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              {isLoading && (
                <Command.Loading className="py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </Command.Loading>
              )}

              {!isLoading && items.length === 0 && search && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </Command.Empty>
              )}

              {!isLoading && items.length === 0 && !search && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Type to search...
                </div>
              )}

              {/* Grouped results */}
              {Object.entries(groupedItems).map(([category, categoryItems]) => {
                const Icon = categoryIcons[category as CommandPaletteItem['category']];
                const label = categoryLabels[category as CommandPaletteItem['category']];

                return (
                  <Command.Group key={category} heading={label}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {label}
                    </div>
                    {categoryItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className={cn(
                          'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer',
                          'text-sm text-foreground',
                          'aria-selected:bg-secondary aria-selected:text-foreground',
                          'hover:bg-secondary/50'
                        )}
                      >
                        {item.icon || <Icon className="size-4 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.label}</p>
                          {item.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>

            {/* Footer with keyboard hints */}
            <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">
                  &uarr;&darr;
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">
                  &crarr;
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">
                  esc
                </kbd>
                Close
              </span>
            </div>
          </Command>
        </div>
      </div>
    );
  }
);

CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
