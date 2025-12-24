'use client';

import { useMember } from '@/contexts/member-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

/**
 * Member selector dropdown for the header
 *
 * Allows switching between members to view their personalized dashboard.
 * Selection syncs with URL for shareable links.
 */
export function MemberSelector() {
  const { selectedMember, members, setSelectedMember, isReady } = useMember();

  if (!isReady || !selectedMember) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        Viewing as:
      </span>
      <Select
        value={selectedMember.id}
        onValueChange={(id) => {
          const member = members.find((m) => m.id === id);
          if (member) {
            setSelectedMember(member);
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={selectedMember.avatar_url ?? undefined}
                  alt={selectedMember.display_name}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(selectedMember.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedMember.display_name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={member.avatar_url ?? undefined}
                    alt={member.display_name}
                  />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(member.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span>{member.display_name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
