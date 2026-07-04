'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient, getUntypedAdminClient } from '@/lib/supabase/server';

const DigestUpdateSchema = z.object({
  digestId: z.string().uuid(),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(5000),
  title: z.string().trim().min(1, 'Title is required').max(160),
  note: z.string().trim().max(1000).optional(),
});

const DigestIdSchema = z.object({
  digestId: z.string().uuid(),
});

export interface WeeklyDigestActionInput {
  digestId: string;
  subject: string;
  body: string;
  title: string;
  note?: string;
}

export interface WeeklyDigestActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

function normalizeNote(note: string | undefined) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function refreshWeeklyDigestPaths() {
  revalidatePath('/admin/weekly');
  revalidatePath('/');
}

function getActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function logUnexpectedActionError(scope: string, error: unknown) {
  if (error instanceof Error) {
    const expectedClientErrors = [
      'Unauthorized',
      'Digest not found',
      'JSON object requested, multiple (or no) rows returned',
    ];

    if (expectedClientErrors.includes(error.message)) {
      return;
    }
  }

  console.error(scope, error);
}

async function assertCurrentAdminAccess() {
  const cookieStore = await cookies();
  const hasLeagueAccess = cookieStore.get('league_access')?.value === 'granted';

  if (process.env.BYPASS_AUTH === 'true' || hasLeagueAccess) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (member?.role !== 'commissioner') {
    throw new Error('Unauthorized');
  }
}

async function saveDigestFields(input: WeeklyDigestActionInput) {
  const parsed = DigestUpdateSchema.parse(input);
  await updateDigestById(parsed.digestId, {
    email_subject: parsed.subject,
    email_body: parsed.body,
    published_title: parsed.title,
    commissioner_note: normalizeNote(parsed.note),
  });
}

async function updateDigestById(digestId: string, values: Record<string, unknown>) {
  const supabase = await getUntypedAdminClient();

  const { data, error } = await supabase
    .from('weekly_digests')
    .update(values)
    .eq('id', digestId)
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Digest not found');
  }
}

export async function updateWeeklyDigestAction(
  input: WeeklyDigestActionInput,
): Promise<WeeklyDigestActionResult> {
  try {
    await assertCurrentAdminAccess();
    await saveDigestFields(input);
    refreshWeeklyDigestPaths();
    return { success: true, message: 'Draft saved' };
  } catch (error) {
    logUnexpectedActionError('[updateWeeklyDigestAction] Error:', error);
    return {
      success: false,
      error: getActionError(error, 'Failed to save draft'),
    };
  }
}

export async function publishWeeklyDigestAction(
  input: WeeklyDigestActionInput,
): Promise<WeeklyDigestActionResult> {
  try {
    await assertCurrentAdminAccess();
    await saveDigestFields(input);

    const parsed = DigestIdSchema.parse({ digestId: input.digestId });
    await updateDigestById(parsed.digestId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });

    refreshWeeklyDigestPaths();
    return { success: true, message: 'Dispatch published' };
  } catch (error) {
    logUnexpectedActionError('[publishWeeklyDigestAction] Error:', error);
    return {
      success: false,
      error: getActionError(error, 'Failed to publish dispatch'),
    };
  }
}

export async function unpublishWeeklyDigestAction(
  digestId: string,
): Promise<WeeklyDigestActionResult> {
  try {
    await assertCurrentAdminAccess();
    const parsed = DigestIdSchema.parse({ digestId });
    await updateDigestById(parsed.digestId, {
      status: 'draft',
      published_at: null,
    });

    refreshWeeklyDigestPaths();
    return { success: true, message: 'Dispatch moved back to draft' };
  } catch (error) {
    logUnexpectedActionError('[unpublishWeeklyDigestAction] Error:', error);
    return {
      success: false,
      error: getActionError(error, 'Failed to unpublish dispatch'),
    };
  }
}
