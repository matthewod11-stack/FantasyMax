import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TradesTimeline } from '@/components/features/trades/TradesTimeline';
import type { TradeTimelineItem } from '@/lib/supabase/queries/trades';

const trades: TradeTimelineItem[] = [
  {
    id: 'trade-latest',
    tradeDate: '2024-11-01',
    week: null,
    seasonYear: 2024,
    team1Name: 'Latest Team 1',
    team2Name: 'Latest Team 2',
    team1MemberName: 'Latest A',
    team2MemberName: 'Latest B',
    team1Sends: [{ name: 'Latest Player A' }],
    team2Sends: [{ name: 'Latest Player B' }],
    championshipImpact: null,
  },
  {
    id: 'trade-receipt',
    tradeDate: '2024-10-11',
    week: 6,
    seasonYear: 2024,
    team1Name: 'Receipt Team 1',
    team2Name: 'Receipt Team 2',
    team1MemberName: 'Garrett C',
    team2MemberName: 'PJ M',
    team1Sends: [{ name: 'Receipt Player A' }],
    team2Sends: [{ name: 'Receipt Player B' }],
    championshipImpact: 'Garrett C won the 2024 championship after this deal.',
  },
];

describe('TradesTimeline', () => {
  it('opens the URL-selected trade receipt instead of the first trade', () => {
    render(<TradesTimeline trades={trades} initialTradeId="trade-receipt" />);

    expect(screen.getByText('Trade Detail')).toBeInTheDocument();
    expect(screen.getByText(/Garrett C ↔ PJ M · 2024 · Week 6/)).toBeInTheDocument();
    expect(screen.getAllByText(/Receipt Player A/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Receipt Player B/).length).toBeGreaterThan(0);
  });
});
