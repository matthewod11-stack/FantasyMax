'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Skull,
  Medal,
  Zap,
  Calendar,
  Award,
} from 'lucide-react';
import type { LeagueRecordRow, RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

interface RecordFullCardProps {
  record: LeagueRecordRow;
  topEntries: TopNEntry[];
  className?: string;
}

/**
 * Get the appropriate icon for a record type
 */
function getRecordIcon(recordType: RecordType) {
  const iconClass = 'h-5 w-5';

  switch (recordType) {
    case 'highest_single_week_score':
      return <Flame className={cn(iconClass, 'text-orange-500')} />;
    case 'lowest_single_week_score':
      return <Skull className={cn(iconClass, 'text-gray-500')} />;
    case 'biggest_blowout_margin':
      return <Zap className={cn(iconClass, 'text-yellow-500')} />;
    case 'closest_game_margin':
      return <Target className={cn(iconClass, 'text-blue-500')} />;
    case 'most_season_wins':
    case 'career_wins':
      return <Trophy className={cn(iconClass, 'text-gold')} />;
    case 'most_season_points':
    case 'career_points':
      return <TrendingUp className={cn(iconClass, 'text-green-500')} />;
    case 'best_season_record':
      return <Medal className={cn(iconClass, 'text-gold')} />;
    case 'worst_season_record':
      return <Skull className={cn(iconClass, 'text-gray-500')} />;
    case 'most_championships':
      return <Trophy className={cn(iconClass, 'text-gold')} />;
    case 'most_last_places':
      return <Skull className={cn(iconClass, 'text-loss')} />;
    default:
      return <Trophy className={cn(iconClass, 'text-gold')} />;
  }
}

/**
 * Get display name for a record type
 */
function getRecordTitle(recordType: RecordType): string {
  const titles: Record<RecordType, string> = {
    highest_single_week_score: 'Highest Weekly Score',
    lowest_single_week_score: 'Lowest Weekly Score',
    biggest_blowout_margin: 'Biggest Blowout',
    closest_game_margin: 'Closest Game',
    most_season_wins: 'Most Season Wins',
    most_season_points: 'Most Season Points',
    best_season_record: 'Best Season Record',
    worst_season_record: 'Worst Season Record',
    career_wins: 'Career Wins',
    career_points: 'Career Points',
    longest_win_streak: 'Longest Win Streak',
    most_championships: 'Most Championships',
    most_last_places: 'Most Last Places',
  };
  return titles[recordType] || recordType;
}

/**
 * Format the record value for display
 */
function formatValue(recordType: RecordType, value: number): string {
  if (recordType === 'best_season_record' || recordType === 'worst_season_record') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (
    recordType === 'highest_single_week_score' ||
    recordType === 'lowest_single_week_score' ||
    recordType === 'most_season_points' ||
    recordType === 'career_points'
  ) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  if (recordType === 'biggest_blowout_margin' || recordType === 'closest_game_margin') {
    return value.toFixed(1);
  }

  return value.toLocaleString('en-US');
}

/**
 * Get the unit/suffix for a record value
 */
function getRecordUnit(recordType: RecordType): string {
  if (
    recordType === 'highest_single_week_score' ||
    recordType === 'lowest_single_week_score' ||
    recordType === 'most_season_points' ||
    recordType === 'career_points' ||
    recordType === 'biggest_blowout_margin' ||
    recordType === 'closest_game_margin'
  ) {
    return 'pts';
  }

  if (recordType === 'most_season_wins' || recordType === 'career_wins') {
    return 'wins';
  }

  if (recordType === 'most_championships') {
    return 'titles';
  }

  if (recordType === 'most_last_places') {
    return 'times';
  }

  return '';
}

/**
 * Check if this is a "dubious" (negative) record
 */
function isDubiousRecord(recordType: RecordType): boolean {
  return [
    'lowest_single_week_score',
    'worst_season_record',
    'most_last_places',
  ].includes(recordType);
}

/**
 * Get rank icon based on position
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-gold" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-700" />;
    default:
      return <span className="text-xs text-muted-foreground font-mono w-4 text-center">{rank}</span>;
  }
}

/**
 * RecordFullCard - Full expanded record card with inline leaderboard
 *
 * Displays the record holder hero section and the complete leaderboard
 * without requiring a click/drawer interaction.
 */
export function RecordFullCard({
  record,
  topEntries,
  className,
}: RecordFullCardProps) {
  const isDubious = isDubiousRecord(record.record_type);
  const hasLeaderboard = topEntries.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 bg-gradient-to-br from-card via-card to-secondary/30',
        isDubious
          ? 'border-muted-foreground/20'
          : 'border-gold/30',
        className
      )}
    >
      {/* Header: Icon + Title */}
      <div className="flex items-center gap-2 mb-4">
        {getRecordIcon(record.record_type)}
        <h3 className="font-display text-lg tracking-wide text-foreground uppercase">
          {getRecordTitle(record.record_type)}
        </h3>
      </div>

      {/* Record Holder Hero Section */}
      <div className={cn(
        'rounded-lg border p-4 mb-4',
        isDubious
          ? 'bg-muted/30 border-muted-foreground/20'
          : 'bg-gold/5 border-gold/20'
      )}>
        <div className="flex items-center gap-1 text-xs uppercase tracking-wider mb-3">
          <Trophy className={cn('h-3.5 w-3.5', isDubious ? 'text-muted-foreground' : 'text-gold')} />
          <span className={isDubious ? 'text-muted-foreground' : 'text-gold'}>
            Record Holder
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ManagerAvatar
            avatarUrl={null}
            displayName={record.holder_display_name}
            size="lg"
            showChampionRing={!isDubious && record.record_type === 'most_championships'}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{record.holder_display_name}</p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                'font-display text-2xl',
                isDubious ? 'text-muted-foreground' : 'text-gold'
              )}>
                {formatValue(record.record_type, record.value)}
              </span>
              <span className="text-sm text-muted-foreground">
                {getRecordUnit(record.record_type)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {record.season_year && record.week && (
                <span>Week {record.week}, {record.season_year}</span>
              )}
              {record.season_year && !record.week && (
                <span>{record.season_year} Season</span>
              )}
              {!record.season_year && (
                <span>All-Time</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {hasLeaderboard && (
        <div className="space-y-2">
          <h4 className="font-display text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Leaderboard
          </h4>
          <div className="space-y-1">
            {topEntries.map((entry, index) => (
              <div
                key={`${entry.member_id}-${entry.matchup_id || index}`}
                className={cn(
                  'flex items-center gap-2.5 py-2 px-2 rounded-lg transition-colors',
                  entry.rank === 1 && !isDubious && 'bg-gold/10',
                  entry.rank === 2 && 'bg-muted/30',
                  entry.rank === 3 && 'bg-amber-900/10'
                )}
              >
                {/* Rank */}
                <div className="w-6 flex justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <ManagerAvatar
                  avatarUrl={null}
                  displayName={entry.display_name}
                  size="sm"
                />

                {/* Name & Context */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    entry.rank === 1 && !isDubious && 'text-gold'
                  )}>
                    {entry.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.context}
                  </p>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <span className={cn(
                    'font-mono text-sm font-semibold',
                    entry.rank === 1 && !isDubious && 'text-gold'
                  )}>
                    {formatValue(record.record_type, entry.value)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {getRecordUnit(record.record_type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For record types without leaderboard */}
      {!hasLeaderboard && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Career achievement - no leaderboard
        </p>
      )}
    </div>
  );
}
