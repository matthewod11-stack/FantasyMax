'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import type { AwardsByMember } from '@/lib/supabase/queries';

interface AwardLeaderboardProps {
  members: AwardsByMember[];
  className?: string;
}

/**
 * Get rank styling (gold/silver/bronze for top 3)
 */
function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        icon: <Crown className="h-5 w-5 text-gold" />,
        bg: 'bg-gold/10 border-gold/30',
        text: 'text-gold',
        title: 'Most Decorated',
      };
    case 2:
      return {
        icon: <Medal className="h-5 w-5 text-gray-300" />,
        bg: 'bg-gray-500/10 border-gray-500/30',
        text: 'text-gray-300',
        title: 'Silver',
      };
    case 3:
      return {
        icon: <Award className="h-5 w-5 text-amber-600" />,
        bg: 'bg-amber-600/10 border-amber-600/30',
        text: 'text-amber-600',
        title: 'Bronze',
      };
    default:
      return {
        icon: <Trophy className="h-4 w-4 text-muted-foreground" />,
        bg: 'bg-muted/50 border-border',
        text: 'text-muted-foreground',
        title: '',
      };
  }
}

/**
 * AwardLeaderboard - Ranked list of most decorated members
 *
 * Shows members sorted by total positive awards with
 * gold/silver/bronze styling for the top 3.
 */
export function AwardLeaderboard({ members, className }: AwardLeaderboardProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No awards have been given yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {members.map((member, index) => {
        const rank = index + 1;
        const style = getRankStyle(rank);

        return (
          <div
            key={member.member_id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border',
              'transition-all duration-200 hover:scale-[1.01]',
              style.bg
            )}
          >
            {/* Rank indicator */}
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full',
                rank <= 3 ? style.bg : 'bg-muted'
              )}
            >
              {rank <= 3 ? (
                style.icon
              ) : (
                <span className="font-display text-sm text-muted-foreground">
                  {rank}
                </span>
              )}
            </div>

            {/* Member info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ManagerAvatar
                avatarUrl={member.avatar_url}
                displayName={member.display_name}
                size="md"
                showChampionRing={rank === 1}
              />
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-foreground truncate">
                  {member.display_name}
                </p>
                {rank <= 3 && style.title && (
                  <p className={cn('text-xs', style.text)}>{style.title}</p>
                )}
              </div>
            </div>

            {/* Award counts */}
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-gold" />
                <span className={cn('font-display text-xl', style.text)}>
                  {member.total_positive}
                </span>
              </div>
              {member.total_negative > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{member.total_negative} dubious
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
