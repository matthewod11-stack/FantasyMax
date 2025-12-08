'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Trophy, ChevronRight } from 'lucide-react';

interface PlayoffTeam {
  id: string;
  teamName: string;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  seed: number;
}

interface PlayoffMatchup {
  id: string;
  round: number; // 1 = first round, 2 = semi, 3 = final
  position: number; // position within round (0, 1, 2, ...)
  homeTeam: PlayoffTeam | null;
  awayTeam: PlayoffTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  week: number;
  isChampionship: boolean;
  isConsolation?: boolean;
}

interface PlayoffBracketProps {
  matchups: PlayoffMatchup[];
  totalRounds?: number;
  onMatchupClick?: (matchup: PlayoffMatchup) => void;
}

export function PlayoffBracket({
  matchups,
  totalRounds = 3,
  onMatchupClick,
}: PlayoffBracketProps) {
  const [hoveredMatchup, setHoveredMatchup] = useState<string | null>(null);

  // Group matchups by round
  const roundMatchups = Array.from({ length: totalRounds }, (_, i) =>
    matchups
      .filter(m => m.round === i + 1 && !m.isConsolation)
      .sort((a, b) => a.position - b.position)
  );

  // Get championship matchup
  const championship = matchups.find(m => m.isChampionship);

  // Get round names
  const getRoundName = (round: number) => {
    if (round === totalRounds) return 'Championship';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {roundMatchups.map((round, roundIndex) => (
          <div
            key={roundIndex}
            className="flex flex-col gap-4"
            style={{
              // Increase spacing for later rounds to align with bracket lines
              marginTop: roundIndex === 0 ? 0 : `${Math.pow(2, roundIndex) * 32 - 32}px`,
            }}
          >
            {/* Round header */}
            <div className="text-center text-sm font-medium text-muted-foreground mb-2">
              {getRoundName(roundIndex + 1)}
            </div>

            {/* Matchups */}
            <div
              className="flex flex-col"
              style={{
                gap: `${Math.pow(2, roundIndex + 1) * 32}px`,
              }}
            >
              {round.map((matchup) => (
                <MatchupCard
                  key={matchup.id}
                  matchup={matchup}
                  isHovered={hoveredMatchup === matchup.id}
                  onHover={() => setHoveredMatchup(matchup.id)}
                  onLeave={() => setHoveredMatchup(null)}
                  onClick={() => onMatchupClick?.(matchup)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Trophy for champion */}
        {championship?.winnerId && (
          <div className="flex flex-col items-center justify-center px-8">
            <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
            <div className="text-sm font-medium text-center">
              Champion
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {championship.homeScore && championship.awayScore && (
                `${Math.max(championship.homeScore, championship.awayScore).toFixed(1)} pts`
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchupCardProps {
  matchup: PlayoffMatchup;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function MatchupCard({
  matchup,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: MatchupCardProps) {
  const { homeTeam, awayTeam, homeScore, awayScore, winnerId, isChampionship } = matchup;

  const homeWon = winnerId === homeTeam?.id;
  const awayWon = winnerId === awayTeam?.id;
  const hasScore = homeScore !== null && awayScore !== null;

  return (
    <div
      className={cn(
        'w-[200px] rounded-lg border transition-all cursor-pointer',
        isChampionship ? 'border-yellow-500/50 bg-yellow-500/5' : 'bg-card',
        isHovered && 'ring-2 ring-primary/50 shadow-lg'
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Week indicator */}
      <div className="text-[10px] text-muted-foreground px-2 pt-1">
        Week {matchup.week}
      </div>

      {/* Home team */}
      <TeamRow
        team={homeTeam}
        score={homeScore}
        isWinner={homeWon}
        hasScore={hasScore}
      />

      {/* Divider */}
      <div className="border-t border-dashed mx-2" />

      {/* Away team */}
      <TeamRow
        team={awayTeam}
        score={awayScore}
        isWinner={awayWon}
        hasScore={hasScore}
      />

      {/* Championship badge */}
      {isChampionship && (
        <div className="text-center pb-1">
          <span className="text-[10px] font-medium text-yellow-500">
            🏆 Championship
          </span>
        </div>
      )}
    </div>
  );
}

interface TeamRowProps {
  team: PlayoffTeam | null;
  score: number | null;
  isWinner: boolean;
  hasScore: boolean;
}

function TeamRow({ team, score, isWinner, hasScore }: TeamRowProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
          ?
        </div>
        <span className="text-sm">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-2 transition-colors',
        isWinner && 'bg-green-500/10'
      )}
    >
      {/* Seed */}
      <span className="w-4 text-xs text-muted-foreground font-mono">
        {team.seed}
      </span>

      {/* Avatar */}
      <ManagerAvatar
        displayName={team.member.display_name}
        avatarUrl={team.member.avatar_url}
        size="sm"
        showChampionRing={isWinner}
      />

      {/* Name */}
      <span
        className={cn(
          'flex-1 text-sm truncate',
          isWinner && 'font-bold',
          !isWinner && hasScore && 'text-muted-foreground'
        )}
      >
        {team.member.display_name}
      </span>

      {/* Score */}
      {score !== null && (
        <span
          className={cn(
            'font-mono text-sm tabular-nums',
            isWinner ? 'font-bold text-green-500' : 'text-muted-foreground'
          )}
        >
          {score.toFixed(1)}
        </span>
      )}

      {/* Winner indicator */}
      {isWinner && (
        <ChevronRight className="h-4 w-4 text-green-500" />
      )}
    </div>
  );
}
