import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SeasonArc } from '@/components/features/seasons/SeasonArc';

describe('SeasonArc', () => {
  it('renders story beats with receipt links', () => {
    render(
      <SeasonArc
        year={2024}
        arc={{
          championPath: {
            title: 'Champion Path',
            summary: 'Garrett C finished 10-4 as the No. 2 seed and closed with a 135.5-120.4 championship win over PJ M.',
            href: '/managers/member-garrett',
          },
          lastPlaceStory: {
            title: 'Last-Place Race',
            summary: 'Nick D finished 3-11 in 12th with 1,090.2 PF and 1,420.1 PA.',
            href: '/managers/member-nick',
          },
          records: [
            {
              kind: 'highest_score',
              label: 'Highest Score',
              value: '178.2',
              summary: 'Garrett C posted 178.2 in Week 3.',
              href: '/records',
              week: 3,
              matchupId: 'matchup-blowout',
            },
            {
              kind: 'closest_game',
              label: 'Closest Game',
              value: '0.4',
              summary: 'PJ M survived Nick D by 0.4 in Week 7.',
              href: '/head-to-head',
              week: 7,
              matchupId: 'matchup-close',
            },
          ],
          receipts: {
            writeups: [
              {
                id: 'recap-2024',
                title: '2024 Season Recap',
                excerpt: 'The title run and collapse were both memorable.',
                week: null,
                writeup_type: 'season_recap',
                href: '/writeups?season=2024&writeup=recap-2024',
              },
            ],
            trades: [
              {
                id: 'trade-1',
                title: 'Garrett C ↔ PJ M',
                detail: 'Player A ↔ Player B',
                championshipImpact: 'Garrett C won the 2024 championship after this deal.',
                href: '/trades?season=2024&trade=trade-1',
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: '2024 Season Arc' })).toBeInTheDocument();
    expect(screen.getByText(/135.5-120.4 championship win/)).toBeInTheDocument();
    expect(screen.getByText(/Nick D finished 3-11/)).toBeInTheDocument();
    expect(screen.getByText('Highest Score')).toBeInTheDocument();
    expect(screen.getByText('Closest Game')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2024 Season Recap/i })).toHaveAttribute(
      'href',
      '/writeups?season=2024&writeup=recap-2024',
    );
    expect(screen.getByRole('link', { name: /Garrett C ↔ PJ M/i })).toHaveAttribute(
      'href',
      '/trades?season=2024&trade=trade-1',
    );
    expect(screen.getByRole('link', { name: 'View Champion Manager' })).toHaveAttribute(
      'href',
      '/managers/member-garrett',
    );
  });
});
