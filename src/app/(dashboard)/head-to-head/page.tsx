import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { H2HPageClient } from '@/components/features/h2h';
import { getH2HRecapsForMember } from '@/lib/supabase/queries';
import { Card, CardContent } from '@/components/ui/card';
import type { H2HRecapWithRivalry } from '@/types/contracts/queries';

export const metadata = {
  title: 'Head-to-Head | League of Degenerates',
  description: 'View head-to-head records between all league managers',
};

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

async function getH2HData() {
  const supabase = await createAdminClient();

  // Fetch H2H records from the materialized view
  const { data: h2hRecords, error: h2hError } = await supabase
    .from('mv_h2h_matrix')
    .select('*');

  if (h2hError) {
    console.error('Error fetching H2H records:', h2hError);
  }

  // Extract unique member IDs from H2H records
  // This includes merged members who have historical records
  const memberIdsInH2H = new Set<string>();
  (h2hRecords ?? []).forEach((r) => {
    if (r.member_1_id) memberIdsInH2H.add(r.member_1_id);
    if (r.member_2_id) memberIdsInH2H.add(r.member_2_id);
  });

  // Fetch members who have H2H history (regardless of is_active status)
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .in('id', Array.from(memberIdsInH2H))
    .order('display_name');

  if (membersError || !members) {
    console.error('Error fetching members:', membersError);
    return { members: [], records: [], matchups: [], rivalriesByMember: {} };
  }

  // Transform records to match our interface
  const records: H2HRecord[] = (h2hRecords ?? []).map((r) => ({
    member1Id: r.member_1_id!,
    member2Id: r.member_2_id!,
    member1Wins: r.member_1_wins ?? 0,
    member2Wins: r.member_2_wins ?? 0,
    totalMatchups: r.total_matchups ?? 0,
  }));

  // Fetch all matchups with team member info for the drawer
  const { data: matchupsData, error: matchupsError } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      is_playoff,
      is_championship,
      winner_team_id,
      home_team:teams!matchups_home_team_id_fkey (
        id,
        member_id
      ),
      away_team:teams!matchups_away_team_id_fkey (
        id,
        member_id
      ),
      seasons (
        year
      )
    `)
    .order('seasons(year)', { ascending: false });

  if (matchupsError) {
    console.error('Error fetching matchups:', matchupsError);
  }

  // Transform matchups
  const matchups: MatchupDetail[] = (matchupsData ?? []).map((m) => {
    const homeTeam = m.home_team as { id: string; member_id: string } | null;
    const awayTeam = m.away_team as { id: string; member_id: string } | null;
    const season = m.seasons as { year: number } | null;

    // Determine winner member ID
    let winnerId: string | null = null;
    if (m.winner_team_id) {
      if (m.winner_team_id === homeTeam?.id) {
        winnerId = homeTeam?.member_id ?? null;
      } else if (m.winner_team_id === awayTeam?.id) {
        winnerId = awayTeam?.member_id ?? null;
      }
    }

    return {
      id: m.id,
      seasonYear: season?.year ?? 0,
      week: m.week,
      homeTeamMemberId: homeTeam?.member_id ?? '',
      awayTeamMemberId: awayTeam?.member_id ?? '',
      homeScore: m.home_score ?? 0,
      awayScore: m.away_score ?? 0,
      isPlayoff: m.is_playoff ?? false,
      isChampionship: m.is_championship ?? false,
      winnerId,
    };
  });

  // Fetch rivalries with AI recaps for all active members
  const activeMembers = members.filter((m) => m.is_active !== false);
  const rivalriesByMember: Record<string, H2HRecapWithRivalry[]> = {};

  // Fetch rivalries for each active member in parallel
  const rivalryPromises = activeMembers.map(async (member) => {
    try {
      const rivalries = await getH2HRecapsForMember(member.id);
      return { memberId: member.id, rivalries };
    } catch (error) {
      console.error(`Error fetching rivalries for ${member.display_name}:`, error);
      return { memberId: member.id, rivalries: [] };
    }
  });

  const rivalryResults = await Promise.all(rivalryPromises);
  rivalryResults.forEach(({ memberId, rivalries }) => {
    rivalriesByMember[memberId] = rivalries;
  });

  return { members, records, matchups, rivalriesByMember };
}

function H2HMatrixSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function H2HContent() {
  const { members, records, matchups, rivalriesByMember } = await getH2HData();

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No head-to-head records found. Import league data to see H2H matchups.
        </CardContent>
      </Card>
    );
  }

  return (
    <H2HPageClient
      members={members}
      records={records}
      matchups={matchups}
      rivalriesByMember={rivalriesByMember}
    />
  );
}

export default function HeadToHeadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Head-to-Head</h1>
        <p className="text-muted-foreground">
          Who owns who? The complete rivalry tracker.
        </p>
      </div>

      <Suspense fallback={<H2HMatrixSkeleton />}>
        <H2HContent />
      </Suspense>
    </div>
  );
}
