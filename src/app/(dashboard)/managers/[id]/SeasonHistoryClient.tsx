'use client';

import { useCallback } from 'react';
import { SeasonHistoryTable, type SeasonHistoryData, type SeasonDetail } from '@/components/features/managers';
import { fetchSeasonDetailAction } from './actions';

interface SeasonHistoryClientProps {
  seasons: SeasonHistoryData[];
  memberId: string;
}

/**
 * Client wrapper for SeasonHistoryTable
 *
 * Connects the table to the server action for fetching season details.
 */
export function SeasonHistoryClient({ seasons, memberId }: SeasonHistoryClientProps) {
  const fetchSeasonDetail = useCallback(
    async (memberId: string, year: number): Promise<SeasonDetail | null> => {
      return fetchSeasonDetailAction(memberId, year);
    },
    []
  );

  return (
    <SeasonHistoryTable
      seasons={seasons}
      memberId={memberId}
      fetchSeasonDetail={fetchSeasonDetail}
    />
  );
}
