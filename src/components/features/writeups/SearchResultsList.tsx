'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  FileText,
  Trophy,
  BarChart3,
  Megaphone,
  ClipboardList,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { WriteupSearchResult, WriteupType } from '@/types/contracts/queries';

interface SearchResultsListProps {
  results: WriteupSearchResult[];
  query: string;
  onResultClick: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Icon mapping for writeup types (shared with WriteupCard)
 */
const TYPE_ICONS: Record<WriteupType, typeof FileText> = {
  weekly_recap: FileText,
  playoff_preview: Trophy,
  season_recap: Trophy,
  draft_notes: ClipboardList,
  standings_update: BarChart3,
  power_rankings: TrendingUp,
  announcement: Megaphone,
  other: HelpCircle,
};

const TYPE_COLORS: Record<WriteupType, string> = {
  weekly_recap: 'text-blue-400',
  playoff_preview: 'text-gold',
  season_recap: 'text-gold',
  draft_notes: 'text-green-400',
  standings_update: 'text-purple-400',
  power_rankings: 'text-orange-400',
  announcement: 'text-red-400',
  other: 'text-muted-foreground',
};

/**
 * SearchResultsList - Display ranked full-text search results
 *
 * Shows a flat list of writeups sorted by PostgreSQL ts_rank relevance.
 * Highlights that results are ranked by search relevance.
 */
export function SearchResultsList({
  results,
  query,
  onResultClick,
  isLoading = false,
}: SearchResultsListProps) {
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No writeups found</p>
        <p className="text-sm mt-1">
          Try different keywords or check spelling
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Results header with count and relevance indicator */}
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-border/50">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-sm text-muted-foreground">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </span>
        <span className="text-xs text-muted-foreground/60 ml-auto">
          Ranked by relevance
        </span>
      </div>

      {/* Results list */}
      <div className="divide-y divide-border/50 rounded-lg border bg-card overflow-hidden">
        {results.map((result, index) => (
          <SearchResultItem
            key={result.id}
            result={result}
            rank={index + 1}
            onClick={() => onResultClick(result.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual search result item
 */
function SearchResultItem({
  result,
  rank,
  onClick,
}: {
  result: WriteupSearchResult;
  rank: number;
  onClick: () => void;
}) {
  const Icon = TYPE_ICONS[result.writeup_type];
  const typeColor = TYPE_COLORS[result.writeup_type];

  return (
    <div
      className={cn(
        'group flex items-start gap-4 py-3 px-4',
        'hover:bg-secondary/30 transition-colors cursor-pointer'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Rank badge */}
      <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-xs font-mono text-muted-foreground">
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h4 className="text-sm font-medium text-foreground group-hover:text-gold transition-colors line-clamp-1">
          {result.title}
        </h4>

        {/* Excerpt preview */}
        {result.excerpt && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {result.excerpt}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Type badge */}
          <div className={cn('flex items-center gap-1', typeColor)}>
            <Icon className="h-3 w-3" />
            <span className="text-xs capitalize">
              {result.writeup_type.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Season year */}
          {result.season_year && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{result.season_year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
    </div>
  );
}

/**
 * Loading skeleton for search results
 */
function SearchResultsSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-border/50">
        <div className="h-4 w-4 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
      </div>

      {/* Results skeleton */}
      <div className="divide-y divide-border/50 rounded-lg border bg-card overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-3 px-4">
            <div className="w-6 h-6 bg-secondary rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
              <div className="h-3 w-full bg-secondary/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-secondary/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
