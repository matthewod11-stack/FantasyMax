'use client';

import { useState } from 'react';
import { DetailModal } from '@/components/ui/detail-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Member } from '@/types/database.types';

interface MatchupDetail {
  id: string;
  seasonYear: number;
  week: number;
  member1Score: number;
  member2Score: number;
  isPlayoff: boolean;
  isChampionship: boolean;
  winnerId: string | null;
}

interface H2HDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member1: Member;
  member2: Member;
  matchups: MatchupDetail[];
  member1Wins: number;
  member2Wins: number;
  /** AI-generated rivalry recap (optional) */
  aiRecap?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function H2HDrawer({
  isOpen,
  onClose,
  member1,
  member2,
  matchups,
  member1Wins,
  member2Wins,
  aiRecap,
}: H2HDrawerProps) {
  const [isRecapExpanded, setIsRecapExpanded] = useState(false);

  // Sort matchups by year (desc) then week (desc)
  const sortedMatchups = [...matchups].sort((a, b) => {
    if (a.seasonYear !== b.seasonYear) return b.seasonYear - a.seasonYear;
    return b.week - a.week;
  });

  // Group by season
  const matchupsBySeason = sortedMatchups.reduce((acc, matchup) => {
    const year = matchup.seasonYear;
    if (!acc[year]) acc[year] = [];
    acc[year].push(matchup);
    return acc;
  }, {} as Record<number, MatchupDetail[]>);

  const member1Leading = member1Wins > member2Wins;
  const member2Leading = member2Wins > member1Wins;
  const isEven = member1Wins === member2Wins;

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="Head-to-Head History"
      description="Complete matchup history between these managers"
      size="md"
    >
      {/* Header with avatars and overall record */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center flex-1">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={member1.avatar_url ?? undefined} />
            <AvatarFallback>{getInitials(member1.display_name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-center truncate max-w-full">
            {member1.display_name}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-3xl font-bold tabular-nums">
            <span className={cn(member1Leading && 'text-green-500', member2Leading && 'text-red-500')}>
              {member1Wins}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className={cn(member2Leading && 'text-green-500', member1Leading && 'text-red-500')}>
              {member2Wins}
            </span>
          </div>
          <Badge variant="outline" className="mt-1">
            {matchups.length} total matchups
          </Badge>
        </div>

        <div className="flex flex-col items-center flex-1">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={member2.avatar_url ?? undefined} />
            <AvatarFallback>{getInitials(member2.display_name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-center truncate max-w-full">
            {member2.display_name}
          </span>
        </div>
      </div>

      {/* Rivalry indicator */}
      <div className="mt-4 text-center">
        {member1Leading && (
          <Badge className="bg-green-500/10 text-green-600">
            {member1.display_name} leads the rivalry
          </Badge>
        )}
        {member2Leading && (
          <Badge className="bg-green-500/10 text-green-600">
            {member2.display_name} leads the rivalry
          </Badge>
        )}
        {isEven && (
          <Badge variant="secondary">
            Series tied!
          </Badge>
        )}
      </div>

      {/* AI Rivalry Recap */}
      {aiRecap && (
        <div className="mt-6 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Rivalry Analysis</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <div
              className={cn(
                'prose prose-sm prose-invert max-w-none',
                'prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2',
                'prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2',
                'prose-strong:text-foreground prose-strong:font-semibold',
                'prose-ul:my-2 prose-li:text-muted-foreground',
                !isRecapExpanded && 'line-clamp-[6]'
              )}
            >
              <ReactMarkdown>{aiRecap}</ReactMarkdown>
            </div>

            {/* Expand/Collapse button */}
            {aiRecap.length > 400 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 h-7 px-2 text-xs text-primary hover:text-primary/80"
                onClick={() => setIsRecapExpanded(!isRecapExpanded)}
              >
                {isRecapExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Read full analysis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Matchup history by season */}
      <div className="space-y-6">
        {Object.entries(matchupsBySeason)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, yearMatchups]) => (
            <div key={year}>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                {year} Season
              </h4>
              <div className="space-y-2">
                {yearMatchups.map((matchup) => {
                  const member1Won = matchup.winnerId === member1.id ||
                    (matchup.winnerId === null && matchup.member1Score > matchup.member2Score);
                  const member2Won = matchup.winnerId === member2.id ||
                    (matchup.winnerId === null && matchup.member2Score > matchup.member1Score);
                  const isTie = matchup.member1Score === matchup.member2Score;

                  return (
                    <div
                      key={matchup.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        member1Won && 'bg-green-500/10',
                        member2Won && 'bg-red-500/10',
                        isTie && 'bg-yellow-500/10'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-16">
                          Week {matchup.week}
                        </span>
                        {matchup.isPlayoff && (
                          <Badge variant="secondary" className="text-xs">
                            Playoff
                          </Badge>
                        )}
                        {matchup.isChampionship && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 text-xs">
                            🏆 Championship
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className={cn(
                          'font-semibold',
                          member1Won && 'text-green-600',
                          member2Won && 'text-muted-foreground'
                        )}>
                          {matchup.member1Score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span className={cn(
                          'font-semibold',
                          member2Won && 'text-green-600',
                          member1Won && 'text-muted-foreground'
                        )}>
                          {matchup.member2Score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {matchups.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No matchups found between these managers
        </div>
      )}
    </DetailModal>
  );
}
