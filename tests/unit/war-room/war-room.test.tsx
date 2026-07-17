import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WarRoom } from '@/components/features/war-room/WarRoom';

describe('WarRoom', () => {
  it('moves the selected signal evidence into the main dossier', () => {
    render(<WarRoom />);

    const dossier = screen.getByRole('region', { name: 'Selected signal evidence' });
    expect(within(dossier).getByRole('heading', { name: 'Kenneth Walker III' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'DJ Moore to Buffalo' }));

    expect(within(dossier).getByRole('heading', { name: 'DJ Moore to Buffalo' })).toBeInTheDocument();
    expect(within(dossier).getByText(/second-round pick/)).toBeInTheDocument();
  });

  it('shows the league-specific model inputs beside the research', () => {
    render(<WarRoom />);

    expect(screen.getByText('Full PPR')).toBeInTheDocument();
    expect(screen.getByText('2 flex · 4 bench')).toBeInTheDocument();
    expect(screen.getByText('4-pt pass TD')).toBeInTheDocument();
  });
});
