'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Swords } from 'lucide-react';
import type { H2HMatrixRow } from '@/types/contracts/queries';
import type { Member } from '@/types/database.types';

interface HotRivalriesProps {
  rivalries: Array<H2HMatrixRow & {
    member_1?: Pick<Member, 'id' | 'display_name'>;
    member_2?: Pick<Member, 'id' | 'display_name'>;
  }>;
}

function RivalryBar({ wins1, wins2 }: { wins1: number; wins2: number }) {
  const total = wins1 + wins2;
  const pct1 = total > 0 ? (wins1 / total) * 100 : 50;

  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${pct1}%` }}
      />
      <div
        className="h-full bg-destructive/60 transition-all"
        style={{ width: `${100 - pct1}%` }}
      />
    </div>
  );
}

export function HotRivalries({ rivalries }: HotRivalriesProps) {
  if (rivalries.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Hot Rivalries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No rivalry data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Hot Rivalries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rivalries.map((rivalry) => {
          const name1 = rivalry.member_1?.display_name ?? 'Unknown';
          const name2 = rivalry.member_2?.display_name ?? 'Unknown';
          const firstName1 = name1.split(' ')[0];
          const firstName2 = name2.split(' ')[0];

          return (
            <Link
              key={`${rivalry.member_1_id}-${rivalry.member_2_id}`}
              href={`/head-to-head?member1=${rivalry.member_1_id}&member2=${rivalry.member_2_id}`}
              className="block p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-sm">
                    {firstName1} vs {firstName2}
                  </span>
                </div>
                <span className="text-sm font-mono">
                  {rivalry.member_1_wins}-{rivalry.member_2_wins}
                </span>
              </div>
              <RivalryBar
                wins1={rivalry.member_1_wins}
                wins2={rivalry.member_2_wins}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {rivalry.total_matchups} matchups played
              </p>
            </Link>
          );
        })}
        <Link
          href="/head-to-head"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          View all rivalries →
        </Link>
      </CardContent>
    </Card>
  );
}
