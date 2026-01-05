'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Check } from 'lucide-react';
import type { Member } from '@/types/database.types';

interface H2HMemberSelectorProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
}

/**
 * H2HMemberSelector - Left panel vertical list of members
 *
 * Yahoo-style member selector with avatars.
 * Click a member to view their H2H records.
 */
export function H2HMemberSelector({
  members,
  selectedMemberId,
  onSelectMember,
}: H2HMemberSelectorProps) {
  // Sort by display name
  const sortedMembers = [...members].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  return (
    <div className="space-y-1">
      <h3 className="font-display text-sm uppercase tracking-wide text-muted-foreground px-2 mb-3">
        Select Manager
      </h3>
      <div className="space-y-0.5">
        {sortedMembers.map((member) => {
          const isSelected = member.id === selectedMemberId;
          return (
            <button
              key={member.id}
              onClick={() => onSelectMember(member.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                'hover:bg-muted/50',
                isSelected && 'bg-primary/10 border border-primary/30'
              )}
            >
              <ManagerAvatar
                avatarUrl={member.avatar_url}
                displayName={member.display_name}
                size="sm"
              />
              <span className={cn(
                'flex-1 text-left text-sm truncate',
                isSelected && 'font-medium text-primary'
              )}>
                {member.display_name}
              </span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
