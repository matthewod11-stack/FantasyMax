'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Trophy, Flame, Target, TrendingUp, Skull, Medal, Zap, Calendar } from 'lucide-react';
import type { LeagueRecordRow, RecordType } from '@/types/contracts/queries';

interface RecordCardProps {
  record: LeagueRecordRow;
  className?: string;
  /**
   * Show "Record Broken!" effect for recently set records
   */
  isRecent?: boolean;
  /**
   * Show previous holder for context
   */
  previousHolder?: {
    name: string;
    value: number;
  };
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
function formatRecordValue(recordType: RecordType, value: number): string {
  // Percentage-based records
  if (recordType === 'best_season_record' || recordType === 'worst_season_record') {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Points (show decimal)
  if (
    recordType === 'highest_single_week_score' ||
    recordType === 'lowest_single_week_score' ||
    recordType === 'most_season_points' ||
    recordType === 'career_points'
  ) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  // Margin records
  if (recordType === 'biggest_blowout_margin' || recordType === 'closest_game_margin') {
    return value.toFixed(1);
  }

  // Integer records (wins, championships, etc.)
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
 * RecordCard - Digital Trophy Plaque
 *
 * Displays a league record as a premium "digital plaque" design
 * featuring the holder's avatar, record value, and context.
 */
export function RecordCard({
  record,
  className,
  isRecent = false,
  previousHolder,
}: RecordCardProps) {
  const isDubious = isDubiousRecord(record.record_type);

  return (
    <div
      className={cn(
        // Base plaque design
        'relative overflow-hidden rounded-xl border-2 p-5',
        'bg-gradient-to-br from-card via-card to-secondary/30',
        'transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
        // Border styling based on record type
        isDubious
          ? 'border-muted-foreground/20 hover:border-muted-foreground/40'
          : 'border-gold/30 hover:border-gold/50',
        // Recent record glow
        isRecent && !isDubious && 'ring-2 ring-gold/50 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {/* Trophy watermark background */}
      <div
        className={cn(
          'absolute -right-4 -top-4 opacity-5',
          isDubious ? 'text-muted-foreground' : 'text-gold'
        )}
      >
        {isDubious ? (
          <Skull className="h-32 w-32" />
        ) : (
          <Trophy className="h-32 w-32" />
        )}
      </div>

      {/* "Record Broken!" badge */}
      {isRecent && (
        <div className={cn(
          'absolute -right-8 top-4 rotate-45 px-10 py-1 text-xs font-bold uppercase tracking-wider',
          isDubious
            ? 'bg-loss text-white'
            : 'bg-gold text-black'
        )}>
          New!
        </div>
      )}

      {/* Content */}
      <div className="relative space-y-4">
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2">
          {getRecordIcon(record.record_type)}
          <h3 className="font-display text-lg tracking-wide text-foreground uppercase">
            {getRecordTitle(record.record_type)}
          </h3>
        </div>

        {/* Main content: Avatar + Value */}
        <div className="flex items-center gap-4">
          <ManagerAvatar
            avatarUrl={null} // Would need to add avatar_url to view
            displayName={record.holder_display_name}
            size="lg"
            showChampionRing={!isDubious && record.record_type === 'most_championships'}
          />

          <div className="flex-1 min-w-0">
            {/* Holder name */}
            <p className="font-body font-semibold text-foreground truncate">
              {record.holder_display_name}
            </p>

            {/* Record value - large and prominent */}
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                'font-display text-3xl tabular-nums',
                isDubious ? 'text-muted-foreground' : 'text-gold'
              )}>
                {formatRecordValue(record.record_type, record.value)}
              </span>
              <span className="text-sm text-muted-foreground font-body">
                {getRecordUnit(record.record_type)}
              </span>
            </div>
          </div>
        </div>

        {/* Context: When the record was set */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
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

        {/* Previous holder (optional) */}
        {previousHolder && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Previous: <span className="font-medium">{previousHolder.name}</span>
              {' '}({formatRecordValue(record.record_type, previousHolder.value)} {getRecordUnit(record.record_type)})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
