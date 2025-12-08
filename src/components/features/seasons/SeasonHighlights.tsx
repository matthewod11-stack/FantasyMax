'use client';

import { Trophy, Skull, Flame, Target, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { StatBadge } from '@/components/ui/stat-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HighlightMember {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface SeasonRecord {
  type: 'high_score' | 'low_score' | 'biggest_blowout' | 'closest_game';
  value: number;
  description: string;
  member: HighlightMember;
  opponent?: HighlightMember;
  week: number;
}

interface SeasonHighlightsProps {
  year: number;
  champion: {
    member: HighlightMember;
    teamName: string;
    record: string;
    pointsFor: number;
  } | null;
  lastPlace: {
    member: HighlightMember;
    teamName: string;
    record: string;
  } | null;
  records: SeasonRecord[];
  onMemberClick?: (memberId: string) => void;
}

export function SeasonHighlights({
  year,
  champion,
  lastPlace,
  records,
  onMemberClick,
}: SeasonHighlightsProps) {
  return (
    <div className="space-y-6">
      {/* Champion & Last Place Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Champion Card */}
        {champion && (
          <Card
            className={cn(
              'relative overflow-hidden cursor-pointer transition-all hover:shadow-lg',
              'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent'
            )}
            onClick={() => onMemberClick?.(champion.member.id)}
          >
            {/* Trophy background watermark */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
              <Trophy className="h-32 w-32 text-yellow-500" />
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {year} Champion
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-4">
                <ManagerAvatar
                  displayName={champion.member.display_name}
                  avatarUrl={champion.member.avatar_url}
                  size="lg"
                  showChampionRing
                />
                <div>
                  <div className="font-bold text-xl">{champion.member.display_name}</div>
                  <div className="text-sm text-muted-foreground">{champion.teamName}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <StatBadge variant="championship" size="sm" label="Record" value={champion.record} />
                    <span className="text-sm font-mono">
                      {champion.pointsFor.toLocaleString(undefined, { minimumFractionDigits: 1 })} PF
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Place Card */}
        {lastPlace && (
          <Card
            className={cn(
              'relative overflow-hidden cursor-pointer transition-all hover:shadow-lg',
              'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent'
            )}
            onClick={() => onMemberClick?.(lastPlace.member.id)}
          >
            {/* Skull background watermark */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
              <Skull className="h-32 w-32 text-red-500" />
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Skull className="h-5 w-5 text-red-500" />
                {year} Last Place
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-4">
                <ManagerAvatar
                  displayName={lastPlace.member.display_name}
                  avatarUrl={lastPlace.member.avatar_url}
                  size="lg"
                />
                <div>
                  <div className="font-bold text-xl">{lastPlace.member.display_name}</div>
                  <div className="text-sm text-muted-foreground">{lastPlace.teamName}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <StatBadge variant="loss" size="sm" label="Record" value={lastPlace.record} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Season Records */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Season Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {records.map((record, index) => (
                <RecordCard
                  key={index}
                  record={record}
                  onMemberClick={onMemberClick}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RecordCardProps {
  record: SeasonRecord;
  onMemberClick?: (memberId: string) => void;
}

function RecordCard({ record, onMemberClick }: RecordCardProps) {
  const getRecordIcon = () => {
    switch (record.type) {
      case 'high_score':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'low_score':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case 'biggest_blowout':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'closest_game':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getRecordLabel = () => {
    switch (record.type) {
      case 'high_score':
        return 'Highest Score';
      case 'low_score':
        return 'Lowest Score';
      case 'biggest_blowout':
        return 'Biggest Blowout';
      case 'closest_game':
        return 'Closest Game';
      default:
        return 'Record';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-muted/30 border',
        'cursor-pointer hover:bg-muted/50 transition-colors'
      )}
      onClick={() => onMemberClick?.(record.member.id)}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getRecordIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">
          {getRecordLabel()} • Week {record.week}
        </div>
        <div className="flex items-center gap-2">
          <ManagerAvatar
            displayName={record.member.display_name}
            avatarUrl={record.member.avatar_url}
            size="sm"
          />
          <span className="font-medium truncate">{record.member.display_name}</span>
        </div>
      </div>

      {/* Value */}
      <div className="text-right">
        <div className="font-mono font-bold">
          {record.value.toFixed(1)}
        </div>
        {record.opponent && (
          <div className="text-xs text-muted-foreground">
            vs {record.opponent.display_name}
          </div>
        )}
      </div>
    </div>
  );
}
