'use client';

import { useState, useCallback, useEffect, useMemo, useRef, useTransition } from 'react';
import { Filter, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  WriteupsBySeason,
  WriteupDetailDrawer,
  SearchResultsList,
} from '@/components/features/writeups';
import type {
  WriteupsBySeason as WriteupsBySeasonType,
  WriteupWithDetails,
  WriteupSearchResult,
  WriteupLoreTopic,
  WriteupType,
} from '@/types/contracts/queries';
import {
  filterWriteupSeasons,
  formatLoreTopicLabel,
  getWriteupFilterOptions,
} from '@/lib/writeups/lore';
import { getWriteupByIdAction, searchWriteupsAction } from './actions';

interface WriteupsClientProps {
  seasonWriteups: WriteupsBySeasonType[];
  defaultExpandedYear: number | null;
  initialSeasonFilter?: number | null;
  initialWriteupId?: string | null;
}

/**
 * Debounce delay for search input (ms)
 *
 * UX consideration: 400ms provides a good balance between
 * responsiveness and reducing unnecessary server calls.
 * Users typically pause briefly between words when searching.
 */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Minimum characters required to trigger search
 */
const MIN_SEARCH_LENGTH = 2;
const ALL_FILTER_VALUE = 'all';

const WRITEUP_TYPE_LABELS: Record<WriteupType, string> = {
  weekly_recap: 'Weekly Recaps',
  playoff_preview: 'Playoff Previews',
  season_recap: 'Season Recaps',
  draft_notes: 'Draft Notes',
  standings_update: 'Standings',
  power_rankings: 'Power Rankings',
  announcement: 'Announcements',
  other: 'Other',
};

/**
 * WriteupsClient - Client-side interactive wrapper for writeups
 *
 * Features two modes:
 * 1. Browse mode: Season accordion (default)
 * 2. Search mode: Flat ranked results from full-text search
 *
 * Handles:
 * - Debounced full-text search via PostgreSQL
 * - Writeup selection and drawer display
 * - Season accordion expansion
 */
export function WriteupsClient({
  seasonWriteups,
  defaultExpandedYear,
  initialSeasonFilter = null,
  initialWriteupId = null,
}: WriteupsClientProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WriteupSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [seasonFilter, setSeasonFilter] = useState(
    initialSeasonFilter ? String(initialSeasonFilter) : ALL_FILTER_VALUE,
  );
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);
  const [topicFilter, setTopicFilter] = useState(ALL_FILTER_VALUE);
  const [memberFilter, setMemberFilter] = useState(ALL_FILTER_VALUE);

  // Drawer state
  const [selectedWriteupId, setSelectedWriteupId] = useState<string | null>(initialWriteupId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(Boolean(initialWriteupId));

  // Determine if we're in search mode (non-empty query with results)
  const isSearchMode = searchQuery.length >= MIN_SEARCH_LENGTH;
  const filterOptions = useMemo(() => getWriteupFilterOptions(seasonWriteups), [seasonWriteups]);
  const activeFilterCount = [seasonFilter, typeFilter, topicFilter, memberFilter].filter(
    (value) => value !== ALL_FILTER_VALUE
  ).length;
  const filteredSeasonWriteups = useMemo(
    () => filterWriteupSeasons(seasonWriteups, {
      seasonYear: seasonFilter === ALL_FILTER_VALUE ? undefined : Number(seasonFilter),
      type: typeFilter === ALL_FILTER_VALUE ? undefined : typeFilter as WriteupType,
      topic: topicFilter === ALL_FILTER_VALUE ? undefined : topicFilter as WriteupLoreTopic,
      memberId: memberFilter === ALL_FILTER_VALUE ? undefined : memberFilter,
    }),
    [memberFilter, seasonFilter, seasonWriteups, topicFilter, typeFilter]
  );
  const expandedYears = seasonFilter !== ALL_FILTER_VALUE
    ? [Number(seasonFilter)]
    : defaultExpandedYear
      ? [defaultExpandedYear]
      : [];

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is too short, clear results immediately
    if (value.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      return;
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchWriteupsAction(value);
        setSearchResults(results);
      });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSeasonFilter(ALL_FILTER_VALUE);
    setTypeFilter(ALL_FILTER_VALUE);
    setTopicFilter(ALL_FILTER_VALUE);
    setMemberFilter(ALL_FILTER_VALUE);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle writeup click (from either browse or search mode)
  const handleWriteupClick = useCallback((writeupId: string) => {
    setSelectedWriteupId(writeupId);
    setIsDrawerOpen(true);
  }, []);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Clear selection after animation
    setTimeout(() => setSelectedWriteupId(null), 300);
  }, []);

  // Fetch writeup for drawer (calls server action)
  const fetchWriteup = useCallback(async (id: string): Promise<WriteupWithDetails | null> => {
    return getWriteupByIdAction(id);
  }, []);

  return (
    <>
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search writeups"
            type="text"
            placeholder="Search writeups…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {/* Clear button or loading spinner */}
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {!isSearchMode && (
          <div className="flex flex-col gap-3 rounded-lg border bg-card/40 p-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Filter className="hidden h-4 w-4 text-muted-foreground sm:mb-2 sm:block" />
            <FilterSelect
              label="Season"
              value={seasonFilter}
              onValueChange={setSeasonFilter}
              options={[
                { value: ALL_FILTER_VALUE, label: 'All Seasons' },
                ...filterOptions.seasons.map((year) => ({
                  value: String(year),
                  label: `${year}`,
                })),
              ]}
            />
            <FilterSelect
              label="Type"
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                { value: ALL_FILTER_VALUE, label: 'All Types' },
                ...filterOptions.types.map((type) => ({
                  value: type,
                  label: WRITEUP_TYPE_LABELS[type],
                })),
              ]}
            />
            <FilterSelect
              label="Topic"
              value={topicFilter}
              onValueChange={setTopicFilter}
              options={[
                { value: ALL_FILTER_VALUE, label: 'All Topics' },
                ...filterOptions.topics.map((topic) => ({
                  value: topic,
                  label: formatLoreTopicLabel(topic),
                })),
              ]}
            />
            <FilterSelect
              label="Member"
              value={memberFilter}
              onValueChange={setMemberFilter}
              options={[
                { value: ALL_FILTER_VALUE, label: 'All Members' },
                ...filterOptions.members.map((member) => ({
                  value: member.id,
                  label: member.displayName,
                })),
              ]}
            />
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="sm:mb-0.5"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search mode: Show ranked results */}
      {isSearchMode && (
        <SearchResultsList
          results={searchResults}
          query={searchQuery}
          onResultClick={handleWriteupClick}
          isLoading={isSearching}
        />
      )}

      {/* Browse mode: Show season accordion */}
      {!isSearchMode && (
        filteredSeasonWriteups.length > 0 ? (
          <WriteupsBySeason
            seasons={filteredSeasonWriteups}
            displayMode="list"
            onWriteupClick={handleWriteupClick}
            defaultExpanded={expandedYears}
          />
        ) : (
          <div className="rounded-lg border bg-card/40 py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No Writeups Match</p>
            <p className="mt-1 text-sm">Clear a filter to broaden the archive.</p>
          </div>
        )
      )}

      {/* Writeup detail drawer */}
      <WriteupDetailDrawer
        writeupId={selectedWriteupId}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        fetchWriteup={fetchWriteup}
      />
    </>
  );
}

function FilterSelect({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="grid min-w-[150px] gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <span>{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={`Filter by ${label.toLowerCase()}`} className="w-full sm:w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
