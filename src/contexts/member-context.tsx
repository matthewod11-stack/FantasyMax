'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Member } from '@/types/database.types';

interface MemberContextValue {
  /** Currently selected member for viewing */
  selectedMember: Member | null;
  /** All available members */
  members: Member[];
  /** Change the selected member (updates URL) */
  setSelectedMember: (member: Member) => void;
  /** Whether the context is ready */
  isReady: boolean;
}

const MemberContext = createContext<MemberContextValue | null>(null);

interface MemberProviderProps {
  children: ReactNode;
  /** All members to choose from */
  members: Member[];
  /** Default member (e.g., commissioner or first member) */
  defaultMember: Member;
}

/**
 * Provider for member selection state
 *
 * Syncs with URL search param `?member=<id>` for shareable links.
 * Falls back to defaultMember if no valid member in URL.
 */
export function MemberProvider({
  children,
  members,
  defaultMember,
}: MemberProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMember, setSelectedMemberState] = useState<Member>(defaultMember);
  const [isReady, setIsReady] = useState(false);

  // Initialize from URL on mount
  useEffect(() => {
    const memberIdFromUrl = searchParams.get('member');
    if (memberIdFromUrl) {
      const memberFromUrl = members.find((m) => m.id === memberIdFromUrl);
      if (memberFromUrl) {
        setSelectedMemberState(memberFromUrl);
      }
    }
    setIsReady(true);
  }, [searchParams, members]);

  // Update URL when member changes
  const setSelectedMember = useCallback(
    (member: Member) => {
      setSelectedMemberState(member);

      // Update URL without full page reload
      const params = new URLSearchParams(searchParams.toString());
      params.set('member', member.id);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <MemberContext.Provider
      value={{
        selectedMember,
        members,
        setSelectedMember,
        isReady,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

/**
 * Hook to access member selection context
 *
 * @throws Error if used outside MemberProvider
 */
export function useMember() {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
}

/**
 * Hook to get just the selected member (convenience)
 */
export function useSelectedMember() {
  const { selectedMember } = useMember();
  return selectedMember;
}
