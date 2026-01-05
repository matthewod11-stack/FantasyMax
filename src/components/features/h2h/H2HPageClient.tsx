'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { H2HMatrix } from './H2HMatrix';
import { H2HMemberSelector } from './H2HMemberSelector';
import { H2HOpponentList } from './H2HOpponentList';
import { H2HDrawer } from './H2HDrawer';
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
  // Local state for selected member (not using header context)
  const activeMembers = useMemo(
    () => members.filter((m) => m.is_active !== false),
    [members]
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    activeMembers[0]?.id ?? null
  );

  // Selected member object
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  // Get rivalries for the currently selected member
  const currentRivalries = useMemo(() => {
    if (!selectedMemberId) return [];
    return rivalriesByMember[selectedMemberId] || [];
  }, [selectedMemberId, rivalriesByMember]);

  // Transform matchups for drawer (keyed by opponent ID)
  const matchupsByOpponent = useMemo(() => {
    if (!selectedMemberId) return {};

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
      const isHome = m.homeTeamMemberId === selectedMemberId;
      const isAway = m.awayTeamMemberId === selectedMemberId;

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
  }, [selectedMemberId, matchups]);

  // Drawer state
  const [selectedRivalry, setSelectedRivalry] = useState<H2HRecapWithRivalry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectOpponent = (rivalry: H2HRecapWithRivalry) => {
    setSelectedRivalry(rivalry);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedRivalry(null), 300);
  };

  return (
    <>
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
          {/* Two-panel layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left panel: Member selector */}
            <Card className="lg:w-56 shrink-0 p-4 max-h-[600px] overflow-y-auto">
              <H2HMemberSelector
                members={activeMembers}
                selectedMemberId={selectedMemberId}
                onSelectMember={setSelectedMemberId}
              />
            </Card>

            {/* Right panel: Opponent list */}
            <Card className="flex-1 p-4">
              {selectedMember ? (
                <H2HOpponentList
                  viewingMember={selectedMember}
                  rivalries={currentRivalries}
                  onSelectOpponent={handleSelectOpponent}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a member to view their head-to-head records
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <H2HMatrix
            members={members}
            records={records}
            matchups={matchups}
          />
        </TabsContent>
      </Tabs>

      {/* H2H Drawer for detailed matchup history */}
      {selectedMember && selectedRivalry && (
        <H2HDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          member1={selectedMember}
          member2={selectedRivalry.opponent}
          matchups={matchupsByOpponent[selectedRivalry.opponent.id] ?? []}
          member1Wins={selectedRivalry.wins}
          member2Wins={selectedRivalry.losses}
          aiRecap={selectedRivalry.ai_recap}
        />
      )}
    </>
  );
}
