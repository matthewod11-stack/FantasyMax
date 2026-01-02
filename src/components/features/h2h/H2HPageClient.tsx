'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { H2HMatrix } from './H2HMatrix';
import { RivalriesTab } from './RivalriesTab';
import { useMember } from '@/contexts/member-context';
import { Users, Grid3X3 } from 'lucide-react';
import type { H2HRecapWithRivalry } from '@/types/contracts/queries';
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

interface H2HPageClientProps {
  /** All members with H2H history */
  members: Member[];
  /** H2H records from materialized view */
  records: H2HRecord[];
  /** All matchups for drawer details */
  matchups: MatchupDetail[];
  /** Rivalries with AI recaps, keyed by member ID */
  rivalriesByMember: Record<string, H2HRecapWithRivalry[]>;
}

export function H2HPageClient({
  members,
  records,
  matchups,
  rivalriesByMember,
}: H2HPageClientProps) {
  const { selectedMember } = useMember();

  // Get rivalries for the currently selected member
  const currentRivalries = useMemo(() => {
    if (!selectedMember) return [];
    return rivalriesByMember[selectedMember.id] || [];
  }, [selectedMember, rivalriesByMember]);

  // Transform matchups for RivalriesTab (keyed by opponent ID)
  const matchupsByOpponent = useMemo(() => {
    if (!selectedMember) return {};

    const result: Record<string, {
      id: string;
      seasonYear: number;
      week: number;
      member1Score: number;
      member2Score: number;
      isPlayoff: boolean;
      isChampionship: boolean;
      winnerId: string | null;
    }[]> = {};

    matchups.forEach((m) => {
      const isHome = m.homeTeamMemberId === selectedMember.id;
      const isAway = m.awayTeamMemberId === selectedMember.id;

      if (!isHome && !isAway) return;

      const opponentId = isHome ? m.awayTeamMemberId : m.homeTeamMemberId;

      if (!result[opponentId]) {
        result[opponentId] = [];
      }

      result[opponentId].push({
        id: m.id,
        seasonYear: m.seasonYear,
        week: m.week,
        member1Score: isHome ? m.homeScore : m.awayScore,
        member2Score: isHome ? m.awayScore : m.homeScore,
        isPlayoff: m.isPlayoff,
        isChampionship: m.isChampionship,
        winnerId: m.winnerId,
      });
    });

    return result;
  }, [selectedMember, matchups]);

  return (
    <Tabs defaultValue="rivalries" className="space-y-4">
      <TabsList>
        <TabsTrigger value="rivalries" className="gap-2">
          <Users className="h-4 w-4" />
          <span>Rivalries</span>
        </TabsTrigger>
        <TabsTrigger value="matrix" className="gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span>Matrix</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rivalries">
        {selectedMember ? (
          <RivalriesTab
            viewingMember={selectedMember}
            rivalries={currentRivalries}
            matchupsByOpponent={matchupsByOpponent}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Select a member using &quot;Viewing as&quot; in the header to see their rivalries
          </div>
        )}
      </TabsContent>

      <TabsContent value="matrix">
        <H2HMatrix
          members={members}
          records={records}
          matchups={matchups}
        />
      </TabsContent>
    </Tabs>
  );
}
