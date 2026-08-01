import { describe, expect, it } from 'vitest';

import { selectCanonicalCommissioner } from '@/lib/members/canonical-commissioner';

describe('selectCanonicalCommissioner', () => {
  it('ignores member, inactive, and merged rows and keeps the established commissioner', () => {
    const selected = selectCanonicalCommissioner([
      {
        id: 'marko',
        created_at: '2025-01-01T00:00:00Z',
        display_name: 'Marko K',
        is_active: true,
        joined_year: 2016,
        merged_into_id: null,
        role: 'member',
      },
      {
        id: 'merged-matt',
        created_at: '2025-12-06T22:31:33Z',
        display_name: 'Matt OD',
        is_active: false,
        joined_year: 2024,
        merged_into_id: 'canonical-matt',
        role: 'commissioner',
      },
      {
        id: 'matthew',
        created_at: '2026-07-07T11:47:56Z',
        display_name: 'Matthew',
        is_active: true,
        joined_year: 2025,
        merged_into_id: null,
        role: 'commissioner',
      },
      {
        id: 'canonical-matt',
        created_at: '2025-12-06T15:40:25Z',
        display_name: 'Matt OD',
        is_active: true,
        joined_year: 2024,
        merged_into_id: null,
        role: 'commissioner',
      },
    ]);

    expect(selected?.id).toBe('canonical-matt');
  });

  it('returns null when no active unmerged commissioner exists', () => {
    expect(selectCanonicalCommissioner([])).toBeNull();
  });
});
