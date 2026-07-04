import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { getAvatarAsset, getAvatarUrl } from '@/lib/utils/avatar-map';

describe('ManagerAvatar', () => {
  it('centers mapped avatar images inside the fixed avatar frame', () => {
    render(<ManagerAvatar avatarUrl={null} displayName="Matt OD" size="xl" />);

    expect(screen.getByRole('img', { name: 'Matt OD' })).toHaveClass('object-center');
  });

  it('keeps initials visible underneath slow-loading avatar images', () => {
    render(<ManagerAvatar avatarUrl="/avatars/matt.png" displayName="Matt OD" size="xl" />);

    expect(screen.getByText('MO')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Matt OD' })).toBeInTheDocument();
  });
});

describe('getAvatarUrl', () => {
  it('normalizes display names before resolving local avatar assets', () => {
    expect(getAvatarUrl(' Paul ')).toBe('/avatars/paul.png');
  });

  it('returns object-position metadata for non-square local avatars', () => {
    expect(getAvatarAsset('PJ M')).toEqual({
      src: '/avatars/pj.png',
      objectPosition: 'center 38%',
    });
  });
});
