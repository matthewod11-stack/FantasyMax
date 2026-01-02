'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { DetailModal } from '@/components/ui/detail-modal';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Skull,
  ChevronRight,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Loader2,
} from 'lucide-react';

/**
 * Season data for a manager's history table
 */
export interface SeasonHistoryData {
  year: number;
  seasonId?: string;
  teamId?: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  finalRank: number | null;
  isChampion: boolean;
  isLastPlace: boolean;
  madePlayoffs: boolean;
  playoffSeed?: number | null;
}

/**
 * Matchup data for season detail drawer
 */
export interface MatchupResult {
  week: number;
  opponentName: string;
  opponentAvatar?: string | null;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  isPlayoff: boolean;
  isChampionship: boolean;
}

/**
 * Full season detail for drawer
 */
export interface SeasonDetail {
  year: number;
  teamName: string;
  record: { wins: number; losses: number; ties: number };
  pointsFor: number;
  pointsAgainst: number;
  finalRank: number | null;
  playoffSeed: number | null;
  isChampion: boolean;
  isLastPlace: boolean;
  madePlayoffs: boolean;
  matchups: MatchupResult[];
  regularSeasonRecord: { wins: number; losses: number };
  playoffRecord: { wins: number; losses: number };
  highScore: { week: number; score: number } | null;
  lowScore: { week: number; score: number } | null;
}

interface SeasonHistoryTableProps {
  seasons: SeasonHistoryData[];
  memberId: string;
  /**
   * Callback to fetch full season detail when drawer opens
   */
  fetchSeasonDetail: (memberId: string, year: number) => Promise<SeasonDetail | null>;
}

/**
 * SeasonHistoryTable - Interactive season history with detail modal
 *
 * Displays a table of seasons with click-to-expand modal showing:
 * - Week-by-week matchup results
 * - Regular season vs playoff records
 * - Season highs and lows
 */
export function SeasonHistoryTable({
  seasons,
  memberId,
  fetchSeasonDetail,
}: SeasonHistoryTableProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seasonDetail, setSeasonDetail] = useState<SeasonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRowClick = useCallback(async (year: number) => {
    setSelectedYear(year);
    setIsModalOpen(true);
    setIsLoading(true);
    setSeasonDetail(null);

    const detail = await fetchSeasonDetail(memberId, year);
    setSeasonDetail(detail);
    setIsLoading(false);
  }, [memberId, fetchSeasonDetail]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedYear(null);
      setSeasonDetail(null);
    }, 300);
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Year</th>
              <th className="pb-2 font-medium">Team Name</th>
              <th className="pb-2 font-medium text-right">Record</th>
              <th className="pb-2 font-medium text-right">Points</th>
              <th className="pb-2 font-medium text-right">Finish</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr
                key={season.year}
                className={cn(
                  'border-b last:border-0 cursor-pointer transition-colors',
                  'hover:bg-secondary/50',
                  selectedYear === season.year && 'bg-secondary/30'
                )}
                onClick={() => handleRowClick(season.year)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRowClick(season.year)}
              >
                <td className="py-3 font-medium">{season.year}</td>
                <td className="py-3">{season.teamName}</td>
                <td className="py-3 text-right tabular-nums">
                  {season.wins}-{season.losses}
                  {season.ties > 0 && `-${season.ties}`}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {season.pointsFor.toFixed(1)}
                </td>
                <td className="py-3 text-right">
                  {season.isChampion && (
                    <Badge className="bg-yellow-500/10 text-yellow-600">
                      <Trophy className="h-3 w-3 mr-1" />
                      Champion
                    </Badge>
                  )}
                  {season.isLastPlace && (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600">
                      <Skull className="h-3 w-3 mr-1" />
                      Last
                    </Badge>
                  )}
                  {!season.isChampion && !season.isLastPlace && season.finalRank && (
                    <span className="text-muted-foreground">#{season.finalRank}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Season Detail Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`${selectedYear} Season`}
        description={seasonDetail?.teamName ?? 'Loading...'}
        size="md"
      >
        {isLoading ? (
          <SeasonDetailSkeleton />
        ) : seasonDetail ? (
          <SeasonDetailContent detail={seasonDetail} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Failed to load season details
          </div>
        )}
      </DetailModal>
    </>
  );
}

/**
 * Season detail content for the modal
 */
function SeasonDetailContent({ detail }: { detail: SeasonDetail }) {
  const regularSeasonMatchups = detail.matchups.filter((m) => !m.isPlayoff);
  const playoffMatchups = detail.matchups.filter((m) => m.isPlayoff);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            Final Record
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {detail.record.wins}-{detail.record.losses}
            {detail.record.ties > 0 && `-${detail.record.ties}`}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            Points For
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {detail.pointsFor.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Finish badge */}
      <div className="flex items-center justify-center">
        {detail.isChampion && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">League Champion</span>
          </div>
        )}
        {detail.isLastPlace && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
            <Skull className="h-5 w-5" />
            <span className="font-semibold">Last Place</span>
          </div>
        )}
        {!detail.isChampion && !detail.isLastPlace && detail.madePlayoffs && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Award className="h-5 w-5" />
            <span className="font-semibold">
              Playoff Seed #{detail.playoffSeed ?? '?'}
            </span>
          </div>
        )}
        {!detail.isChampion && !detail.isLastPlace && !detail.madePlayoffs && detail.finalRank && (
          <div className="text-muted-foreground">
            Finished #{detail.finalRank}
          </div>
        )}
      </div>

      {/* Season highs/lows */}
      {(detail.highScore || detail.lowScore) && (
        <div className="grid grid-cols-2 gap-4">
          {detail.highScore && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
              <div className="text-xs text-green-600 mb-1">Season High</div>
              <p className="text-lg font-bold tabular-nums text-green-600">
                {detail.highScore.score.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                Week {detail.highScore.week}
              </p>
            </div>
          )}
          {detail.lowScore && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div className="text-xs text-red-600 mb-1">Season Low</div>
              <p className="text-lg font-bold tabular-nums text-red-600">
                {detail.lowScore.score.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                Week {detail.lowScore.week}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regular Season Matchups */}
      {regularSeasonMatchups.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Regular Season
            <Badge variant="outline" className="font-normal">
              {detail.regularSeasonRecord.wins}-{detail.regularSeasonRecord.losses}
            </Badge>
          </h4>
          <div className="space-y-1">
            {regularSeasonMatchups.map((matchup) => (
              <MatchupRow key={matchup.week} matchup={matchup} />
            ))}
          </div>
        </div>
      )}

      {/* Playoff Matchups */}
      {playoffMatchups.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            Playoffs
            <Badge variant="outline" className="font-normal">
              {detail.playoffRecord.wins}-{detail.playoffRecord.losses}
            </Badge>
          </h4>
          <div className="space-y-1">
            {playoffMatchups.map((matchup) => (
              <MatchupRow key={matchup.week} matchup={matchup} showPlayoffBadge />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual matchup row
 */
function MatchupRow({
  matchup,
  showPlayoffBadge = false,
}: {
  matchup: MatchupResult;
  showPlayoffBadge?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg',
        matchup.won ? 'bg-green-500/5' : 'bg-red-500/5'
      )}
    >
      {/* Week */}
      <span className="text-xs text-muted-foreground w-12">
        {matchup.isChampionship ? 'Final' : `Wk ${matchup.week}`}
      </span>

      {/* Result badge */}
      <span
        className={cn(
          'text-xs font-bold w-6',
          matchup.won ? 'text-green-600' : 'text-red-600'
        )}
      >
        {matchup.won ? 'W' : 'L'}
      </span>

      {/* Score */}
      <span className="font-mono text-sm tabular-nums">
        {matchup.teamScore.toFixed(1)} - {matchup.opponentScore.toFixed(1)}
      </span>

      {/* Opponent */}
      <span className="text-sm text-muted-foreground flex-1 truncate">
        vs {matchup.opponentName}
      </span>

      {/* Championship badge */}
      {showPlayoffBadge && matchup.isChampionship && (
        <Trophy className="h-4 w-4 text-gold" />
      )}
    </div>
  );
}

/**
 * Loading skeleton for modal content
 */
function SeasonDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
