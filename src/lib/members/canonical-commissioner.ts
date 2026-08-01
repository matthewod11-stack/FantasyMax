import type { Member } from '@/types/database.types';

type CommissionerCandidate = Pick<
  Member,
  'created_at' | 'display_name' | 'is_active' | 'joined_year' | 'merged_into_id' | 'role'
>;

export function selectCanonicalCommissioner<T extends CommissionerCandidate>(
  candidates: readonly T[],
): T | null {
  const eligible = candidates.filter(
    (candidate) =>
      candidate.role === 'commissioner' &&
      candidate.is_active &&
      candidate.merged_into_id === null,
  );

  return [...eligible].sort((left, right) => {
    const joinedDifference = (left.joined_year ?? Number.MAX_SAFE_INTEGER) -
      (right.joined_year ?? Number.MAX_SAFE_INTEGER);
    if (joinedDifference !== 0) return joinedDifference;

    const createdDifference = (left.created_at ?? '\uffff').localeCompare(
      right.created_at ?? '\uffff',
    );
    if (createdDifference !== 0) return createdDifference;

    return (left.display_name ?? '').localeCompare(right.display_name ?? '');
  })[0] ?? null;
}
