'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Crown } from 'lucide-react';
import type { CareerStatsRow } from '@/types/contracts/queries';

interface AllTimeLeaderboardProps {
  leaders: CareerStatsRow[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function RankIcon({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 text-center text-sm text-muted-foreground font-medium">
          {rank}
        </span>
      );
  }
}

export function AllTimeLeaderboard({ leaders }: AllTimeLeaderboardProps) {
  if (leaders.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            All-Time Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No championship data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          All-Time Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders.map((leader, index) => (
          <Link
            key={leader.member_id}
            href={`/managers/${leader.member_id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RankIcon rank={index + 1} />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(leader.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{leader.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {leader.total_wins}-{leader.total_losses} career
              </p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Trophy className="h-4 w-4" />
              <span className="font-bold">{leader.championships}</span>
            </div>
          </Link>
        ))}
        <Link
          href="/managers"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          View all managers →
        </Link>
      </CardContent>
    </Card>
  );
}
