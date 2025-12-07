'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CommandPaletteItem } from '@/types/contracts/components';

/**
 * useCommandPalette Hook
 *
 * Manages command palette state and global keyboard shortcut.
 * Handles Cmd+K (Mac) / Ctrl+K (Windows/Linux) to open.
 *
 * @example
 * const { isOpen, open, close, toggle } = useCommandPalette();
 *
 * return (
 *   <CommandPalette
 *     isOpen={isOpen}
 *     onClose={close}
 *     {...otherProps}
 *   />
 * );
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}

/**
 * Simple fuzzy search implementation for command palette items.
 * Matches items where all search terms appear in label or description.
 */
export function filterCommandItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  if (!query.trim()) return [];

  const terms = query.toLowerCase().split(/\s+/);

  return items.filter((item) => {
    const searchText = `${item.label} ${item.description || ''}`.toLowerCase();
    return terms.every((term) => searchText.includes(term));
  });
}

/**
 * Score items by relevance for better sorting.
 * Higher scores = better matches.
 */
export function scoreCommandItem(item: CommandPaletteItem, query: string): number {
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  const description = (item.description || '').toLowerCase();

  let score = 0;

  // Exact match in label
  if (label === q) score += 100;
  // Starts with query
  else if (label.startsWith(q)) score += 50;
  // Contains query
  else if (label.includes(q)) score += 25;

  // Bonus for description match
  if (description.includes(q)) score += 10;

  return score;
}

/**
 * Filter and sort items by relevance
 */
export function searchCommandItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const filtered = filterCommandItems(items, query);
  return filtered.sort((a, b) => scoreCommandItem(b, query) - scoreCommandItem(a, query));
}
