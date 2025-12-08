'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Users, Skull, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/database.types';
import type { RivalryData } from '@/types/contracts/queries';

interface RivalryTrackerProps {
  member: Member;
  topNemesis: RivalryData | null;
  topVictim: RivalryData | null;
}

interface MiniRivalryCardProps {
  title: string;
  rivalry: RivalryData | null;
  variant: 'nemesis' | 'victim';
}

function MiniRivalryCard({ title, rivalry, variant }: MiniRivalryCardProps) {
  const config = {
    nemesis: {
      icon: Skull,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      emptyText: 'No one dominates you yet',
    },
    victim: {
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      emptyText: 'No dominant victories yet',
    },
  };

  const { icon: Icon, color, bgColor, borderColor, emptyText } = config[variant];

  if (!rivalry) {
    return (
      <div className={cn('flex-1 rounded-lg border p-3', borderColor, bgColor)}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  const { opponent, wins, losses, ties, total_matchups } = rivalry;

  return (
    <div className={cn('flex-1 rounded-lg border p-3', borderColor, bgColor)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <ManagerAvatar
          displayName={opponent.display_name}
          avatarUrl={opponent.avatar_url}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{opponent.display_name}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums">
              <span className={variant === 'victim' ? 'text-green-500' : 'text-red-500'}>
                {variant === 'victim' ? wins : losses}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={variant === 'nemesis' ? 'text-green-500' : 'text-red-500'}>
                {variant === 'victim' ? losses : wins}
              </span>
            </span>
            <Badge variant="outline" className="text-xs">
              {total_matchups} games
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RivalryTracker({ member, topNemesis, topVictim }: RivalryTrackerProps) {
  const hasRivalries = topNemesis || topVictim;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            Rivalry Tracker
          </CardTitle>
          <Link
            href="/head-to-head"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!hasRivalries ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No rivalries established</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Play more games to find your nemesis!
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            <MiniRivalryCard
              title="Nemesis"
              rivalry={topNemesis}
              variant="nemesis"
            />
            <MiniRivalryCard
              title="Victim"
              rivalry={topVictim}
              variant="victim"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
