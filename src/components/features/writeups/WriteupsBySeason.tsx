'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WriteupCard, WriteupListItem } from './WriteupCard';
import { Calendar, FileText, ChevronDown } from 'lucide-react';
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

          <AccordionContent className="px-4 pb-4">
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
