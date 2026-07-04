import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  publishWeeklyDigestAction,
  unpublishWeeklyDigestAction,
  updateWeeklyDigestAction,
} from '@/app/admin/weekly/actions';

const cookies = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const eq = vi.hoisted(() => vi.fn());
const updateSelect = vi.hoisted(() => vi.fn());
const updateSingle = vi.hoisted(() => vi.fn());
const getUser = vi.hoisted(() => vi.fn());
const memberSelect = vi.hoisted(() => vi.fn());
const memberEq = vi.hoisted(() => vi.fn());
const memberSingle = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/supabase/server', () => ({
  getUntypedAdminClient: vi.fn(async () => ({ from })),
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({
      select: memberSelect,
    })),
  })),
}));

const validDigestId = '11111111-1111-4111-8111-111111111111';

const actionInput = {
  digestId: validDigestId,
  title: 'Week 7 Dispatch',
  subject: 'Week 7 email',
  body: 'Week 7 body',
  note: 'Bench points are still points.',
};

beforeEach(() => {
  vi.clearAllMocks();
  cookies.mockResolvedValue({
    get: vi.fn(() => ({ value: 'granted' })),
  });
  from.mockReturnValue({ update });
  update.mockReturnValue({ eq });
  eq.mockReturnValue({ select: updateSelect });
  updateSelect.mockReturnValue({ single: updateSingle });
  updateSingle.mockResolvedValue({ data: { id: validDigestId }, error: null });
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  memberSelect.mockReturnValue({ eq: memberEq });
  memberEq.mockReturnValue({ single: memberSingle });
  memberSingle.mockResolvedValue({ data: null, error: null });
});

describe('weekly digest admin actions', () => {
  it('saves editable dispatch fields', async () => {
    const result = await updateWeeklyDigestAction(actionInput);

    expect(result).toEqual({ success: true, message: 'Draft saved' });
    expect(update).toHaveBeenCalledWith({
      email_subject: 'Week 7 email',
      email_body: 'Week 7 body',
      published_title: 'Week 7 Dispatch',
      commissioner_note: 'Bench points are still points.',
    });
    expect(eq).toHaveBeenCalledWith('id', validDigestId);
    expect(updateSelect).toHaveBeenCalledWith('id');
    expect(updateSingle).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin/weekly');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('publishes the current dispatch fields', async () => {
    const result = await publishWeeklyDigestAction(actionInput);

    expect(result).toEqual({ success: true, message: 'Dispatch published' });
    expect(update).toHaveBeenNthCalledWith(1, {
      email_subject: 'Week 7 email',
      email_body: 'Week 7 body',
      published_title: 'Week 7 Dispatch',
      commissioner_note: 'Bench points are still points.',
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      status: 'published',
      published_at: expect.any(String),
    });
  });

  it('unpublishes a dispatch back to draft', async () => {
    const result = await unpublishWeeklyDigestAction(validDigestId);

    expect(result).toEqual({ success: true, message: 'Dispatch moved back to draft' });
    expect(update).toHaveBeenCalledWith({
      status: 'draft',
      published_at: null,
    });
  });

  it('rejects requests outside the current admin boundary', async () => {
    cookies.mockResolvedValueOnce({
      get: vi.fn(() => undefined),
    });
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await updateWeeklyDigestAction(actionInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    expect(update).not.toHaveBeenCalled();
  });

  it('reports a stale digest id instead of claiming a successful update', async () => {
    updateSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'JSON object requested, multiple (or no) rows returned' },
    });

    const result = await updateWeeklyDigestAction(actionInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('JSON object requested, multiple (or no) rows returned');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
