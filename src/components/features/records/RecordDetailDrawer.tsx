'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DetailModal } from '@/components/ui/detail-modal';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Trophy, Medal, Award, Calendar, Loader2 } from 'lucide-react';
import type { LeagueRecordRow, RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

interface RecordDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: LeagueRecordRow | null;
  /**
   * Function to fetch top N entries for this record type.
   * This should be passed from a server action or API route.
   */
  fetchTopN?: (recordType: RecordType, limit: number) => Promise<TopNEntry[]>;
}

/**
 * Get display name for a record type
 */
function getRecordTitle(recordType: RecordType): string {
  const titles: Record<RecordType, string> = {
    highest_single_week_score: 'Highest Weekly Scores',
    lowest_single_week_score: 'Lowest Weekly Scores',
    biggest_blowout_margin: 'Biggest Blowouts',
    closest_game_margin: 'Closest Games',
    most_season_wins: 'Most Season Wins',
    most_season_points: 'Most Season Points',
    best_season_record: 'Best Season Records',
    worst_season_record: 'Worst Season Records',
    career_wins: 'Career Wins Leaders',
    career_points: 'Career Points Leaders',
    longest_win_streak: 'Longest Win Streaks',
    most_championships: 'Most Championships',
    most_last_places: 'Most Last Places',
  };
  return titles[recordType] || recordType;
}

/**
 * Format the record value for display
 */
function formatValue(recordType: RecordType, value: number): string {
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

  // Integer records
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
 * Get rank icon based on position
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-gold" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="text-sm text-muted-foreground font-mono w-5 text-center">{rank}</span>;
  }
}

/**
 * Check if this record type supports top N display
 */
function supportsTopN(recordType: RecordType): boolean {
  return [
    'highest_single_week_score',
    'lowest_single_week_score',
    'biggest_blowout_margin',
    'closest_game_margin',
    'most_season_wins',
    'most_season_points',
  ].includes(recordType);
}

/**
 * RecordDetailDrawer
 *
 * Shows the top N entries for a record type when clicking on a record card.
 */
export function RecordDetailDrawer({
  isOpen,
  onClose,
  record,
  fetchTopN,
}: RecordDetailDrawerProps) {
  const [topEntries, setTopEntries] = useState<TopNEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch top N entries when drawer opens
  useEffect(() => {
    async function loadTopN() {
      if (!isOpen || !record || !fetchTopN) return;

      if (!supportsTopN(record.record_type)) {
        setTopEntries([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const entries = await fetchTopN(record.record_type, 10);
        setTopEntries(entries);
      } catch (err) {
        console.error('[RecordDetailDrawer] Error fetching top N:', err);
        setError('Failed to load leaderboard');
        setTopEntries([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadTopN();
  }, [isOpen, record, fetchTopN]);

  if (!record) return null;

  const hasTopN = supportsTopN(record.record_type);

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={getRecordTitle(record.record_type)}
      description={hasTopN ? 'Top 10 all-time performances' : 'Record details'}
      size="md"
    >
      <div className="space-y-6">
        {/* Current Record Holder - Hero Card */}
        <div className="bg-gradient-to-br from-gold/10 via-card to-card rounded-xl border border-gold/30 p-4">
          <div className="flex items-center gap-1 text-xs text-gold uppercase tracking-wider mb-3">
            <Trophy className="h-3.5 w-3.5" />
            <span>Record Holder</span>
          </div>
          <div className="flex items-center gap-4">
            <ManagerAvatar
              avatarUrl={null}
              displayName={record.holder_display_name}
              size="lg"
              showChampionRing={record.record_type === 'most_championships'}
            />
            <div className="flex-1">
              <p className="font-semibold text-lg">{record.holder_display_name}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl text-gold">
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

        {/* Top N Leaderboard */}
        {hasTopN && (
          <div className="space-y-3">
            <h3 className="font-display text-lg uppercase tracking-wide text-muted-foreground">
              Leaderboard
            </h3>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {error}
              </div>
            )}

            {!isLoading && !error && topEntries.length > 0 && (
              <div className="space-y-2">
                {topEntries.map((entry, index) => (
                  <div
                    key={`${entry.member_id}-${entry.matchup_id || index}`}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      entry.rank === 1 && 'bg-gold/10 border border-gold/20',
                      entry.rank === 2 && 'bg-muted/50',
                      entry.rank === 3 && 'bg-amber-900/10',
                      entry.rank > 3 && 'hover:bg-muted/30'
                    )}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
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
                        'font-medium truncate',
                        entry.rank === 1 && 'text-gold'
                      )}>
                        {entry.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.context}
                      </p>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <span className={cn(
                        'font-mono font-semibold',
                        entry.rank === 1 && 'text-gold'
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
            )}

            {!isLoading && !error && topEntries.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No entries found
              </div>
            )}
          </div>
        )}

        {/* For record types without top N support */}
        {!hasTopN && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>Leaderboard not available for this record type.</p>
            <p className="mt-1">Career and championship records are unique achievements.</p>
          </div>
        )}
      </div>
    </DetailModal>
  );
}
