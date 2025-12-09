'use server';

import {
  getMembersWithStats,
  mergeMembers,
  getMergeHistory,
  updateMemberDisplayName,
  deleteMember,
} from '@/lib/supabase/queries';
import type { MemberWithStats, MergeResult, MergeHistoryEntry } from '@/lib/supabase/queries';

export interface MembersActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all members with their stats
 */
export async function fetchMembersAction(
  includeMerged: boolean = false
): Promise<MembersActionResult<MemberWithStats[]>> {
  try {
    const members = await getMembersWithStats(includeMerged);
    return { success: true, data: members };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch members',
    };
  }
}

/**
 * Merge one member into another
 */
export async function mergeMembersAction(
  primaryId: string,
  mergedId: string,
  mergedBy?: string,
  notes?: string
): Promise<MembersActionResult<MergeResult>> {
  try {
    const result = await mergeMembers(primaryId, mergedId, mergedBy, notes);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error merging members:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge members',
    };
  }
}

/**
 * Fetch merge history
 */
export async function fetchMergeHistoryAction(): Promise<
  MembersActionResult<MergeHistoryEntry[]>
> {
  try {
    const history = await getMergeHistory();
    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching merge history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch merge history',
    };
  }
}

/**
 * Update member display name
 */
export async function updateMemberNameAction(
  id: string,
  displayName: string
): Promise<MembersActionResult<void>> {
  try {
    await updateMemberDisplayName(id, displayName);
    return { success: true };
  } catch (error) {
    console.error('Error updating member name:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update member name',
    };
  }
}

/**
 * Delete a member (only if no teams)
 */
export async function deleteMemberAction(
  id: string
): Promise<MembersActionResult<void>> {
  try {
    await deleteMember(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete member',
    };
  }
}
