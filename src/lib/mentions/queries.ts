/**
 * Mention Query Functions
 * Sprint 2.4: Database operations for writeup mentions
 */

import { createAdminClient } from '../supabase/server';
import { detectUniqueMentions, type MemberNameEntry, type DetectedMention } from './detect-mentions';

export interface WriteupMention {
  id: string;
  writeup_id: string;
  member_id: string;
  mention_context: string | null;
  created_at: string;
  member?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Helper to get untyped client (writeup_mentions not in generated types)
 */
async function getUntypedClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createAdminClient()) as any;
}

/**
 * Save detected mentions to the database
 *
 * @param writeupId - The writeup UUID
 * @param mentions - Array of detected mentions
 * @returns Number of mentions saved
 */
export async function saveMentions(
  writeupId: string,
  mentions: DetectedMention[]
): Promise<number> {
  if (mentions.length === 0) return 0;

  const supabase = await getUntypedClient();

  const rows = mentions.map(m => ({
    writeup_id: writeupId,
    member_id: m.memberId,
    mention_context: m.context,
  }));

  // Use upsert to handle re-runs (unique constraint on writeup_id + member_id)
  const { data, error } = await supabase
    .from('writeup_mentions')
    .upsert(rows, {
      onConflict: 'writeup_id,member_id',
      ignoreDuplicates: false,
    })
    .select('id');

  if (error) {
    console.error('[saveMentions] Error:', error);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Get all mentions for a specific writeup
 *
 * @param writeupId - The writeup UUID
 * @returns Array of mentions with member info
 */
export async function getMentionsForWriteup(writeupId: string): Promise<WriteupMention[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeup_mentions')
    .select(`
      id,
      writeup_id,
      member_id,
      mention_context,
      created_at,
      member:members!member_id(id, display_name, avatar_url)
    `)
    .eq('writeup_id', writeupId);

  if (error) {
    console.error('[getMentionsForWriteup] Error:', error);
    return [];
  }

  return (data || []).map(transformMention);
}

/**
 * Get all writeups that mention a specific member
 *
 * @param memberId - The member UUID
 * @returns Array of mentions with writeup info
 */
export async function getMentionsForMember(memberId: string): Promise<WriteupMention[]> {
  const supabase = await getUntypedClient();

  const { data, error } = await supabase
    .from('writeup_mentions')
    .select(`
      id,
      writeup_id,
      member_id,
      mention_context,
      created_at,
      member:members!member_id(id, display_name, avatar_url)
    `)
    .eq('member_id', memberId);

  if (error) {
    console.error('[getMentionsForMember] Error:', error);
    return [];
  }

  return (data || []).map(transformMention);
}

/**
 * Clear all mentions for a writeup (useful before re-detecting)
 *
 * @param writeupId - The writeup UUID
 */
export async function clearMentionsForWriteup(writeupId: string): Promise<void> {
  const supabase = await getUntypedClient();

  const { error } = await supabase
    .from('writeup_mentions')
    .delete()
    .eq('writeup_id', writeupId);

  if (error) {
    console.error('[clearMentionsForWriteup] Error:', error);
  }
}

/**
 * Backfill mentions for all existing writeups
 * This is the main function to populate the writeup_mentions table
 *
 * @param options - Configuration options
 * @returns Summary of the backfill operation
 */
export async function backfillAllMentions(options?: {
  dryRun?: boolean;
  verbose?: boolean;
}): Promise<{
  writeupsProcessed: number;
  totalMentions: number;
  mentionsByWriteup: Record<string, number>;
}> {
  const { dryRun = false, verbose = false } = options ?? {};

  const supabase = await getUntypedClient();

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, display_name')
    .is('merged_into_id', null);

  if (membersError || !members) {
    console.error('[backfillAllMentions] Error fetching members:', membersError);
    return { writeupsProcessed: 0, totalMentions: 0, mentionsByWriteup: {} };
  }

  // Get all published writeups
  const { data: writeups, error: writeupsError } = await supabase
    .from('writeups')
    .select('id, title, content')
    .eq('status', 'published');

  if (writeupsError || !writeups) {
    console.error('[backfillAllMentions] Error fetching writeups:', writeupsError);
    return { writeupsProcessed: 0, totalMentions: 0, mentionsByWriteup: {} };
  }

  const memberEntries: MemberNameEntry[] = members.map((m: { id: string; display_name: string }) => ({
    id: m.id,
    display_name: m.display_name,
  }));

  let totalMentions = 0;
  const mentionsByWriteup: Record<string, number> = {};

  for (const writeup of writeups) {
    const mentions = detectUniqueMentions(writeup.content, memberEntries);

    if (verbose) {
      console.log(`[${writeup.title}] Found ${mentions.length} mentions:`,
        mentions.map(m => m.memberName).join(', ') || '(none)');
    }

    if (!dryRun && mentions.length > 0) {
      const saved = await saveMentions(writeup.id, mentions);
      totalMentions += saved;
      mentionsByWriteup[writeup.id] = saved;
    } else {
      totalMentions += mentions.length;
      mentionsByWriteup[writeup.id] = mentions.length;
    }
  }

  return {
    writeupsProcessed: writeups.length,
    totalMentions,
    mentionsByWriteup,
  };
}

/**
 * Transform raw database row to WriteupMention
 */
function transformMention(row: Record<string, unknown>): WriteupMention {
  const member = row.member as { id: string; display_name: string; avatar_url: string | null } | null;

  return {
    id: row.id as string,
    writeup_id: row.writeup_id as string,
    member_id: row.member_id as string,
    mention_context: row.mention_context as string | null,
    created_at: row.created_at as string,
    member: member ?? undefined,
  };
}
