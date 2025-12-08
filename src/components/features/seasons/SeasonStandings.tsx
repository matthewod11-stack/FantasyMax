'use client';

import { Trophy, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { StatBadge } from '@/components/ui/stat-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TeamStanding {
  id: string;
  teamName: string;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  finalRank: number;
  isChampion: boolean;
  isLastPlace: boolean;
  madePlayoffs: boolean;
  playoffSeed: number | null;
}

interface SeasonStandingsProps {
  standings: TeamStanding[];
  onTeamClick?: (memberId: string) => void;
}

export function SeasonStandings({ standings, onTeamClick }: SeasonStandingsProps) {
  // Sort by final rank
  const sortedStandings = [...standings].sort((a, b) => a.finalRank - b.finalRank);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Record</TableHead>
            <TableHead className="text-right hidden sm:table-cell">PF</TableHead>
            <TableHead className="text-right hidden sm:table-cell">PA</TableHead>
            <TableHead className="text-right hidden md:table-cell">Win %</TableHead>
            <TableHead className="w-20 text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStandings.map((team, index) => {
            const totalGames = team.wins + team.losses + team.ties;
            const winPct = totalGames > 0
              ? ((team.wins + team.ties * 0.5) / totalGames * 100).toFixed(1)
              : '0.0';
            const pointDiff = team.pointsFor - team.pointsAgainst;

            return (
              <TableRow
                key={team.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  team.isChampion && 'bg-yellow-500/5 hover:bg-yellow-500/10',
                  team.isLastPlace && 'bg-red-500/5 hover:bg-red-500/10',
                  !team.isChampion && !team.isLastPlace && 'hover:bg-muted/50'
                )}
                onClick={() => onTeamClick?.(team.member.id)}
              >
                {/* Rank */}
                <TableCell className="text-center font-mono font-bold">
                  <div className="flex items-center justify-center gap-1">
                    {team.isChampion && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                    {team.isLastPlace && (
                      <Skull className="h-4 w-4 text-red-500" />
                    )}
                    {!team.isChampion && !team.isLastPlace && team.finalRank}
                  </div>
                </TableCell>

                {/* Team */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ManagerAvatar
                      displayName={team.member.display_name}
                      avatarUrl={team.member.avatar_url}
                      size="sm"
                      showChampionRing={team.isChampion}
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{team.teamName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {team.member.display_name}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Record */}
                <TableCell className="text-center">
                  <span className="font-mono font-bold">
                    {team.wins}-{team.losses}
                    {team.ties > 0 && `-${team.ties}`}
                  </span>
                </TableCell>

                {/* Points For */}
                <TableCell className="text-right font-mono hidden sm:table-cell">
                  {team.pointsFor.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </TableCell>

                {/* Points Against */}
                <TableCell className="text-right font-mono hidden sm:table-cell">
                  {team.pointsAgainst.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </TableCell>

                {/* Win % */}
                <TableCell className="text-right font-mono hidden md:table-cell">
                  {winPct}%
                </TableCell>

                {/* Status badges */}
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    {team.isChampion && (
                      <StatBadge variant="championship" size="sm" label="" value="Champ" />
                    )}
                    {team.isLastPlace && (
                      <StatBadge variant="loss" size="sm" label="" value="Last" />
                    )}
                    {!team.isChampion && !team.isLastPlace && team.madePlayoffs && (
                      <StatBadge variant="win" size="sm" label="" value="Playoffs" />
                    )}
                    {!team.madePlayoffs && !team.isLastPlace && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
