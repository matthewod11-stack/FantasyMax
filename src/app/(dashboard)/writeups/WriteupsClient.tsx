'use client';

import { useState, useCallback, useEffect, useRef, useTransition } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  WriteupsBySeason,
  WriteupDetailDrawer,
  SearchResultsList,
} from '@/components/features/writeups';
import type {
  WriteupsBySeason as WriteupsBySeasonType,
  WriteupWithDetails,
  WriteupSearchResult,
} from '@/types/contracts/queries';
import { getWriteupByIdAction, searchWriteupsAction } from './actions';

interface WriteupsClientProps {
  seasonWriteups: WriteupsBySeasonType[];
  defaultExpandedYear: number | null;
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
}: WriteupsClientProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WriteupSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drawer state
  const [selectedWriteupId, setSelectedWriteupId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine if we're in search mode (non-empty query with results)
  const isSearchMode = searchQuery.length >= MIN_SEARCH_LENGTH;

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
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search writeups... (e.g., playoffs, championship, draft)"
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
                onClick={handleClearSearch}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
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
        <WriteupsBySeason
          seasons={seasonWriteups}
          displayMode="list"
          onWriteupClick={handleWriteupClick}
          defaultExpanded={defaultExpandedYear ? [defaultExpandedYear] : []}
        />
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
