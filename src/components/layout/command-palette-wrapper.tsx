'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CommandPalette } from '@/components/ui/command-palette';
import { useCommandPalette, searchCommandItems } from '@/hooks/use-command-palette';
import type { CommandPaletteItem } from '@/types/contracts/components';
import type { Member } from '@/types/database.types';

interface CommandPaletteWrapperProps {
  members: Member[];
  seasons: number[];
}

/**
 * CommandPaletteWrapper
 *
 * Provides the command palette with data and handles navigation.
 * Mounted in the dashboard layout for global access via ⌘K.
 */
export function CommandPaletteWrapper({ members, seasons }: CommandPaletteWrapperProps) {
  const router = useRouter();
  const { isOpen, close } = useCommandPalette();
  const [items, setItems] = useState<CommandPaletteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Build searchable items from props
  const allItems = useMemo<CommandPaletteItem[]>(() => [
    // Managers
    ...members.map((m) => ({
      id: `manager-${m.id}`,
      label: m.display_name,
      description: m.role === 'commissioner' ? 'Commissioner' : 'Manager',
      category: 'manager' as const,
      href: `/managers/${m.id}`,
    })),
    // Seasons
    ...seasons.map((year) => ({
      id: `season-${year}`,
      label: `${year} Season`,
      description: 'View season details',
      category: 'season' as const,
      href: `/seasons/${year}`,
    })),
    // Quick actions
    {
      id: 'action-dashboard',
      label: 'Go to Dashboard',
      description: 'Return to the main dashboard',
      category: 'action' as const,
      href: '/',
    },
    {
      id: 'action-seasons',
      label: 'Seasons',
      description: 'Browse season history',
      category: 'action' as const,
      href: '/seasons',
    },
    {
      id: 'action-managers',
      label: 'Managers',
      description: 'Browse league managers',
      category: 'action' as const,
      href: '/managers',
    },
    {
      id: 'action-h2h',
      label: 'Head-to-Head Matrix',
      description: 'View all matchup records',
      category: 'action' as const,
      href: '/head-to-head',
    },
    {
      id: 'action-records',
      label: 'League Records',
      description: 'View all-time records',
      category: 'action' as const,
      href: '/records',
    },
    {
      id: 'action-hall-of-shame',
      label: 'Hall of Shame',
      description: 'The wall of shame for last place',
      category: 'action' as const,
      href: '/hall-of-shame',
    },
    {
      id: 'action-writeups',
      label: 'Writeups',
      description: 'Commissioner recaps and writeups',
      category: 'action' as const,
      href: '/writeups',
    },
    {
      id: 'action-trades',
      label: 'Trades',
      description: 'Browse league trade history',
      category: 'action' as const,
      href: '/trades',
    },
  ], [members, seasons]);

  const handleSearch = useCallback((query: string) => {
    setIsLoading(true);
    // Simulate slight delay for feel
    setTimeout(() => {
      const results = searchCommandItems(allItems, query);
      setItems(results);
      setIsLoading(false);
    }, 50);
  }, [allItems]);

  const handleSelect = useCallback((item: CommandPaletteItem) => {
    if (item.href) {
      router.push(item.href);
    }
  }, [router]);

  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={close}
      items={items}
      onSearch={handleSearch}
      onSelect={handleSelect}
      isLoading={isLoading}
      placeholder="Search managers, seasons, pages…"
    />
  );
}
