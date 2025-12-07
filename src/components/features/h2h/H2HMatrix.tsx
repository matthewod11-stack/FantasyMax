'use client';

import { useState, useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { H2HDrawer } from './H2HDrawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/database.types';

interface H2HRecord {
  member1Id: string;
  member2Id: string;
  member1Wins: number;
  member2Wins: number;
  totalMatchups: number;
}

interface MatchupDetail {
  id: string;
  seasonYear: number;
  week: number;
  homeTeamMemberId: string;
  awayTeamMemberId: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  isChampionship: boolean;
  winnerId: string | null;
}

interface H2HMatrixProps {
  members: Member[];
  records: H2HRecord[];
  matchups: MatchupDetail[];
}

type DisplayMode = 'record' | 'heatmap';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function H2HMatrix({ members, records, matchups }: H2HMatrixProps) {
  const [mode, setMode] = useState<DisplayMode>('record');
  const [selectedCell, setSelectedCell] = useState<{
    member1: Member;
    member2: Member;
  } | null>(null);

  // Create a map for quick record lookup
  const recordMap = useMemo(() => {
    const map = new Map<string, H2HRecord>();
    for (const record of records) {
      // Store both directions for easy lookup
      map.set(`${record.member1Id}-${record.member2Id}`, record);
      map.set(`${record.member2Id}-${record.member1Id}`, {
        ...record,
        member1Id: record.member2Id,
        member2Id: record.member1Id,
        member1Wins: record.member2Wins,
        member2Wins: record.member1Wins,
      });
    }
    return map;
  }, [records]);

  // Get record for a specific pair (row vs column)
  const getRecord = (rowMemberId: string, colMemberId: string): H2HRecord | null => {
    return recordMap.get(`${rowMemberId}-${colMemberId}`) ?? null;
  };

  // Get matchups between two members
  const getMatchupsBetween = (member1Id: string, member2Id: string) => {
    return matchups.filter(
      (m) =>
        (m.homeTeamMemberId === member1Id && m.awayTeamMemberId === member2Id) ||
        (m.homeTeamMemberId === member2Id && m.awayTeamMemberId === member1Id)
    );
  };

  // Transform matchups for drawer
  const getDrawerMatchups = (member1: Member, member2: Member) => {
    const relevantMatchups = getMatchupsBetween(member1.id, member2.id);
    return relevantMatchups.map((m) => {
      const member1IsHome = m.homeTeamMemberId === member1.id;
      return {
        id: m.id,
        seasonYear: m.seasonYear,
        week: m.week,
        member1Score: member1IsHome ? m.homeScore : m.awayScore,
        member2Score: member1IsHome ? m.awayScore : m.homeScore,
        isPlayoff: m.isPlayoff,
        isChampionship: m.isChampionship,
        winnerId: m.winnerId,
      };
    });
  };

  const handleCellClick = (rowMember: Member, colMember: Member) => {
    if (rowMember.id === colMember.id) return;
    setSelectedCell({ member1: rowMember, member2: colMember });
  };

  const selectedRecord = selectedCell
    ? getRecord(selectedCell.member1.id, selectedCell.member2.id)
    : null;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Display:</span>
        <div className="flex rounded-lg border bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-3', mode === 'record' && 'bg-background shadow-sm')}
            onClick={() => setMode('record')}
          >
            Record
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-3', mode === 'heatmap' && 'bg-background shadow-sm')}
            onClick={() => setMode('heatmap')}
          >
            Heatmap
          </Button>
        </div>
        <span className="ml-4 text-xs text-muted-foreground">
          Click any cell to see full matchup history
        </span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                {/* Empty corner cell */}
                <th className="sticky left-0 z-20 bg-background p-2 min-w-[120px]" />
                {/* Column headers */}
                {members.map((member) => (
                  <th
                    key={member.id}
                    className="p-2 min-w-[80px] max-w-[100px] text-center bg-muted/50"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-full">
                        {member.display_name.split(' ')[0]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((rowMember) => (
                <tr key={rowMember.id}>
                  {/* Row header - sticky */}
                  <th className="sticky left-0 z-10 bg-background p-2 text-left">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={rowMember.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(rowMember.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate max-w-[80px]">
                        {rowMember.display_name.split(' ')[0]}
                      </span>
                    </div>
                  </th>
                  {/* Cells */}
                  {members.map((colMember) => {
                    const record = getRecord(rowMember.id, colMember.id);
                    const isSelf = rowMember.id === colMember.id;
                    const isSelected =
                      selectedCell?.member1.id === rowMember.id &&
                      selectedCell?.member2.id === colMember.id;

                    return (
                      <td key={colMember.id} className="border p-0">
                        <HeatmapCell
                          wins={record?.member1Wins ?? 0}
                          losses={record?.member2Wins ?? 0}
                          onClick={() => handleCellClick(rowMember, colMember)}
                          isSelected={isSelected}
                          mode={mode}
                          isSelf={isSelf}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend for heatmap mode */}
      {mode === 'heatmap' && (
        <div className="flex justify-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-900" />
            <span>Dominant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-600" />
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-400/80" />
            <span>Edge</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500/50" />
            <span>Even</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-400/80" />
            <span>Behind</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-600" />
            <span>Bad</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-900" />
            <span>Dominated</span>
          </div>
        </div>
      )}

      {/* H2H Drawer */}
      {selectedCell && (
        <H2HDrawer
          isOpen={true}
          onClose={() => setSelectedCell(null)}
          member1={selectedCell.member1}
          member2={selectedCell.member2}
          matchups={getDrawerMatchups(selectedCell.member1, selectedCell.member2)}
          member1Wins={selectedRecord?.member1Wins ?? 0}
          member2Wins={selectedRecord?.member2Wins ?? 0}
        />
      )}
    </div>
  );
}
