'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WriteupCard, WriteupListItem } from './WriteupCard';
import { Calendar, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { WriteupsBySeason as WriteupsBySeasonType } from '@/types/contracts/queries';

interface WriteupsBySeasonProps {
  seasons: WriteupsBySeasonType[];
  className?: string;
  /**
   * Display mode: 'cards' shows expanded cards, 'list' shows compact items
   */
  displayMode?: 'cards' | 'list';
  /**
   * Callback when a writeup is clicked
   */
  onWriteupClick?: (writeupId: string) => void;
  /**
   * Default expanded seasons (by year)
   */
  defaultExpanded?: number[];
}

/**
 * WriteupsBySeason - Accordion view of writeups grouped by season
 *
 * Displays commissioner writeups organized by season year.
 * Each season expands to show its writeups as cards or list items.
 */
export function WriteupsBySeason({
  seasons,
  className,
  displayMode = 'list',
  onWriteupClick,
  defaultExpanded,
}: WriteupsBySeasonProps) {
  // Convert default expanded years to string keys for accordion
  const defaultValue = defaultExpanded?.map((y) => String(y)) ?? [];

  if (seasons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No writeups yet</p>
        <p className="text-sm">Commissioner writeups will appear here</p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className={cn('space-y-2', className)}
    >
      {seasons.map((season) => (
        <AccordionItem
          key={season.season_year}
          value={String(season.season_year)}
          className={cn(
            'border rounded-lg overflow-hidden',
            'bg-card/50 hover:bg-card transition-colors'
          )}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 w-full">
              {/* Year icon */}
              <div className="shrink-0 p-2 rounded-lg bg-secondary">
                <Calendar className="h-5 w-5 text-gold" />
              </div>

              {/* Year and count */}
              <div className="flex-1 text-left">
                <h3 className="font-display text-lg uppercase tracking-wide">
                  {season.season_year} Season
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  {season.writeups.length} writeup{season.writeups.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Type breakdown badges */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                {getTypeBreakdown(season.writeups).slice(0, 3).map(({ type, count }) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                  >
                    {count} {formatTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4 space-y-6">
            {/* AI Season Review */}
            {season.ai_review && (
              <AIReviewSection review={season.ai_review} />
            )}

            {/* Commissioner Writeups */}
            {season.writeups.length > 0 && (
              <div className="space-y-3">
                {season.ai_review && (
                  <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Commissioner Writeups ({season.writeups.length})
                  </h4>
                )}
                {displayMode === 'cards' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {season.writeups.map((writeup) => (
                      <WriteupCard
                        key={writeup.id}
                        writeup={writeup}
                        onClick={onWriteupClick ? () => onWriteupClick(writeup.id) : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-background/50 overflow-hidden">
                    {season.writeups.map((writeup) => (
                      <WriteupListItem
                        key={writeup.id}
                        writeup={writeup}
                        onClick={onWriteupClick ? () => onWriteupClick(writeup.id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * Get breakdown of writeup types for a season
 */
function getTypeBreakdown(
  writeups: WriteupsBySeasonType['writeups']
): Array<{ type: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const w of writeups) {
    counts[w.writeup_type] = (counts[w.writeup_type] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Format type label for display (shorter versions)
 */
function formatTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    weekly_recap: 'recaps',
    playoff_preview: 'playoff',
    season_recap: 'season',
    draft_notes: 'draft',
    standings_update: 'standings',
    power_rankings: 'rankings',
    announcement: 'news',
    other: 'other',
  };
  return labels[type] || type;
}

// ============================================
// AI Review Section Component (Simplified with ReactMarkdown)
// ============================================

/**
 * AI Review Section - Displays AI-generated season review with ReactMarkdown
 */
function AIReviewSection({ review }: { review: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = review.length > 400;

  return (
    <div className="rounded-lg border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gold/20 bg-gold/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h4 className="font-display text-sm uppercase tracking-wider text-gold">
            AI Season Review
          </h4>
        </div>
      </div>

      {/* Content with ReactMarkdown */}
      <div className="px-4 py-4">
        <div
          className={cn(
            'prose prose-sm prose-invert max-w-none',
            'prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2',
            'prose-strong:text-foreground prose-strong:font-semibold',
            'prose-headings:font-display prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2',
            !isExpanded && needsTruncation && 'line-clamp-[8]'
          )}
        >
          <ReactMarkdown>{review}</ReactMarkdown>
        </div>

        {/* Expand/Collapse button */}
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'mt-4 flex items-center gap-1.5 text-sm font-medium',
              'text-gold hover:text-gold/80 transition-colors'
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Read Full Review
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
