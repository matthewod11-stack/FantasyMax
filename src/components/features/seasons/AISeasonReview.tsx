'use client';

import { Sparkles, Clock, Bot, Quote, Trophy, Flame, Skull } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface AISeasonReviewProps {
  review: string;
  generatedAt: string | null;
  model: string | null;
  year: number;
}

interface ParsedSection {
  type: 'title' | 'intro' | 'highlight' | 'body' | 'pullquote' | 'conclusion';
  content: string;
  icon?: 'trophy' | 'flame' | 'skull';
}

/**
 * Intelligently parse the review into structured sections
 */
function parseReviewContent(review: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Split by newlines first, fall back to sentence parsing
  let paragraphs = review.split(/\n\n+/).filter(p => p.trim());

  // If no paragraph breaks, try to split by natural sentence boundaries
  if (paragraphs.length <= 1) {
    paragraphs = splitIntoLogicalSections(review);
  }

  paragraphs.forEach((para, index) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // First paragraph that looks like a title (short, often starts with "The")
    if (index === 0 && trimmed.length < 80 && !trimmed.includes('.')) {
      sections.push({ type: 'title', content: trimmed });
      return;
    }

    // First real paragraph is intro
    if (sections.length === 0 || (sections.length === 1 && sections[0]?.type === 'title')) {
      sections.push({ type: 'intro', content: trimmed });
      return;
    }

    // Detect highlight-worthy paragraphs (big scores, records)
    if (containsHighlightContent(trimmed)) {
      const icon = detectIcon(trimmed);
      sections.push({ type: 'highlight', content: trimmed, icon });
      return;
    }

    // Detect pull-quote worthy sentences
    const pullQuote = extractPullQuote(trimmed);
    if (pullQuote && sections.filter(s => s.type === 'pullquote').length < 1) {
      sections.push({ type: 'pullquote', content: pullQuote });
      // Continue with rest of paragraph if there's more
      const remainder = trimmed.replace(pullQuote, '').trim();
      if (remainder) {
        sections.push({ type: 'body', content: remainder });
      }
      return;
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

/**
 * Split wall of text into logical sections based on topic shifts
 */
function splitIntoLogicalSections(text: string): string[] {
  const sections: string[] = [];

  // Split into sentences
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

    // Check for natural topic shifts
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
    /\d{3}(\.\d)?\s*points/i,           // Big scores like "202 points"
    /dropped\s+\d{3}/i,                  // "dropped 202"
    /nuclear|explosion|obliterat/i,      // Dramatic language
    /record.*\d+-\d+/i,                  // Records like "10-4"
    /blowout|beatdown|disaster/i,        // Extreme matchups
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
  // Look for dramatic sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Good pull quotes are medium length and contain dramatic words
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

export function AISeasonReview({ review, generatedAt, model, year }: AISeasonReviewProps) {
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const sections = useMemo(() => parseReviewContent(review), [review]);

  const renderIcon = (icon?: 'trophy' | 'flame' | 'skull') => {
    switch (icon) {
      case 'trophy': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'flame': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'skull': return <Skull className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle AI sparkle background */}
      <div className="absolute right-4 top-4 opacity-5">
        <Sparkles className="h-32 w-32 text-primary" />
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {year} Season Review
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            AI Generated
          </span>
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-6">
          {sections.map((section, index) => {
            switch (section.type) {
              case 'title':
                return (
                  <h3
                    key={index}
                    className="text-xl font-bold text-foreground tracking-tight"
                  >
                    {section.content}
                  </h3>
                );

              case 'intro':
                return (
                  <p
                    key={index}
                    className="text-muted-foreground leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-1"
                  >
                    {section.content}
                  </p>
                );

              case 'highlight':
                return (
                  <div
                    key={index}
                    className="relative pl-4 border-l-2 border-primary/50 bg-primary/5 py-3 pr-4 rounded-r-lg"
                  >
                    {section.icon && (
                      <div className="absolute -left-3 top-3 bg-background p-1 rounded-full">
                        {renderIcon(section.icon)}
                      </div>
                    )}
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                );

              case 'pullquote':
                return (
                  <blockquote
                    key={index}
                    className="relative my-6 py-4 px-6 bg-muted/30 rounded-lg border-l-4 border-primary"
                  >
                    <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/30" />
                    <p className="text-foreground italic text-base leading-relaxed">
                      {section.content}
                    </p>
                  </blockquote>
                );

              case 'conclusion':
                return (
                  <div key={index} className="pt-4 border-t border-border/30">
                    <p className="text-muted-foreground leading-relaxed italic">
                      {section.content}
                    </p>
                  </div>
                );

              default:
                return (
                  <p key={index} className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                );
            }
          })}
        </div>

        {/* Model info footer */}
        {model && (
          <div className="mt-8 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground/60 font-mono">
              Generated by {model}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no AI review exists
 */
export function AISeasonReviewEmpty({ year }: { year: number }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="py-12 text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          No AI review available for the {year} season yet.
        </p>
      </CardContent>
    </Card>
  );
}
