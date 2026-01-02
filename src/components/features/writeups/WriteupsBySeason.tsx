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
import { Calendar, FileText, Sparkles, ChevronDown, ChevronUp, Trophy, Flame, Skull, Quote } from 'lucide-react';
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
              <AIReviewSection review={season.ai_review} year={season.season_year} />
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
// AI Review Parsing Types & Logic
// ============================================

interface ParsedSection {
  type: 'title' | 'intro' | 'highlight' | 'body' | 'pullquote' | 'conclusion';
  content: string;
  icon?: 'trophy' | 'flame' | 'skull';
}

/**
 * Split wall of text into logical sections based on topic shifts
 */
function splitIntoLogicalSections(text: string): string[] {
  const sections: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentSection: string[] = [];
  let sentenceCount = 0;

  // Topic shift indicators
  const topicShifters = [
    /^(but|however|meanwhile|speaking of|let's|at the|the middle|the opposite|as confetti|the degenerates)/i,
  ];

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    sentenceCount++;

    const isTopicShift = topicShifters.some(pattern => pattern.test(trimmed));

    // Start new section on topic shift or every 3-4 sentences
    if ((isTopicShift || sentenceCount >= 3) && currentSection.length > 0) {
      sections.push(currentSection.join(' '));
      currentSection = [trimmed];
      sentenceCount = 1;
    } else {
      currentSection.push(trimmed);
    }
  });

  if (currentSection.length > 0) {
    sections.push(currentSection.join(' '));
  }

  return sections;
}

/**
 * Check if paragraph contains highlight-worthy content
 */
function containsHighlightContent(text: string): boolean {
  const patterns = [
    /\d{3}(\.\d)?\s*points/i,
    /dropped\s+\d{3}/i,
    /nuclear|explosion|obliterat/i,
    /record.*\d+-\d+/i,
    /blowout|beatdown|disaster/i,
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Detect which icon to use based on content
 */
function detectIcon(text: string): 'trophy' | 'flame' | 'skull' {
  if (/champion|victory|crown|title|winner/i.test(text)) return 'trophy';
  if (/disaster|worst|terrible|last.*place|shame|embarrass/i.test(text)) return 'skull';
  return 'flame';
}

/**
 * Extract a dramatic sentence suitable for pull quote
 */
function extractPullQuote(text: string): string | null {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (
      trimmed.length > 40 &&
      trimmed.length < 150 &&
      /cruel|irony|glorious|brutal|poor|obliterat|somehow|stumbl|blood|execution/i.test(trimmed)
    ) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Intelligently parse the review into structured sections
 */
function parseReviewContent(review: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Split by newlines first, fall back to sentence parsing
  let paragraphs = review.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length <= 1) {
    paragraphs = splitIntoLogicalSections(review);
  }

  let pullQuoteUsed = false;

  paragraphs.forEach((para, index) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // First paragraph that looks like a title (short, no period)
    if (index === 0 && trimmed.length < 80 && !trimmed.includes('.')) {
      sections.push({ type: 'title', content: trimmed });
      return;
    }

    // First real paragraph is intro
    if (sections.length === 0 || (sections.length === 1 && sections[0]?.type === 'title')) {
      sections.push({ type: 'intro', content: trimmed });
      return;
    }

    // Detect highlight-worthy paragraphs
    if (containsHighlightContent(trimmed)) {
      const icon = detectIcon(trimmed);
      sections.push({ type: 'highlight', content: trimmed, icon });
      return;
    }

    // Detect pull-quote worthy sentences (max 1)
    if (!pullQuoteUsed) {
      const pullQuote = extractPullQuote(trimmed);
      if (pullQuote) {
        pullQuoteUsed = true;
        sections.push({ type: 'pullquote', content: pullQuote });
        const remainder = trimmed.replace(pullQuote, '').trim();
        if (remainder) {
          sections.push({ type: 'body', content: remainder });
        }
        return;
      }
    }

    // Last paragraph is conclusion
    if (index === paragraphs.length - 1) {
      sections.push({ type: 'conclusion', content: trimmed });
      return;
    }

    sections.push({ type: 'body', content: trimmed });
  });

  return sections;
}

// ============================================
// AI Review Section Component
// ============================================

/**
 * AI Review Section - Expandable AI-generated season review with rich formatting
 */
function AIReviewSection({ review }: { review: string; year: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = parseReviewContent(review);

  // For collapsed view, show only first 3 sections
  const previewSections = sections.slice(0, 3);
  const needsTruncation = sections.length > 3;
  const displaySections = isExpanded ? sections : previewSections;

  const renderIcon = (icon?: 'trophy' | 'flame' | 'skull') => {
    switch (icon) {
      case 'trophy': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'flame': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'skull': return <Skull className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

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

      {/* Content */}
      <div className="px-4 py-4">
        <div className="space-y-4">
          {displaySections.map((section, index) => {
            switch (section.type) {
              case 'title':
                return (
                  <h3
                    key={index}
                    className="text-lg font-bold text-foreground tracking-tight"
                  >
                    {section.content}
                  </h3>
                );

              case 'intro':
                return (
                  <p
                    key={index}
                    className="text-muted-foreground leading-relaxed first-letter:text-2xl first-letter:font-bold first-letter:text-gold first-letter:float-left first-letter:mr-2 first-letter:mt-0.5"
                  >
                    {section.content}
                  </p>
                );

              case 'highlight':
                return (
                  <div
                    key={index}
                    className="relative pl-4 border-l-2 border-gold/50 bg-gold/5 py-3 pr-4 rounded-r-lg"
                  >
                    {section.icon && (
                      <div className="absolute -left-3 top-3 bg-background p-1 rounded-full border border-gold/20">
                        {renderIcon(section.icon)}
                      </div>
                    )}
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {section.content}
                    </p>
                  </div>
                );

              case 'pullquote':
                return (
                  <blockquote
                    key={index}
                    className="relative my-4 py-3 px-4 bg-muted/30 rounded-lg border-l-4 border-gold"
                  >
                    <Quote className="absolute -top-2 -left-2 h-5 w-5 text-gold/40" />
                    <p className="text-foreground/90 italic text-sm leading-relaxed">
                      {section.content}
                    </p>
                  </blockquote>
                );

              case 'conclusion':
                return (
                  <div key={index} className="pt-3 border-t border-border/30">
                    <p className="text-muted-foreground leading-relaxed italic text-sm">
                      {section.content}
                    </p>
                  </div>
                );

              default:
                return (
                  <p key={index} className="text-muted-foreground leading-relaxed text-sm">
                    {section.content}
                  </p>
                );
            }
          })}
        </div>

        {/* Expand/Collapse button */}
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "mt-4 flex items-center gap-1.5 text-sm font-medium",
              "text-gold hover:text-gold/80 transition-colors"
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
                Read Full Review ({sections.length - 3} more sections)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
