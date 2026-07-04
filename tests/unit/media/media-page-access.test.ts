import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.hoisted(() => vi.fn());
const maybeSingle = vi.hoisted(() => vi.fn());
const eq = vi.hoisted(() => vi.fn());
const select = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({
      select,
      eq,
      maybeSingle,
    })),
  })),
}));

vi.mock('@/components/features/media/MediaGallery', () => ({
  MediaGallery: () => null,
}));

vi.mock('@/components/features/media/MediaUploadForm', () => ({
  MediaUploadForm: () => null,
}));

vi.mock('lucide-react', () => ({
  ImageIcon: () => null,
}));

describe('canUploadMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });
  });

  it('allows a real signed-in commissioner even when league access uses the shared gate', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    maybeSingle.mockResolvedValue({ data: { role: 'commissioner' } });

    const { canUploadMedia } = await import('@/app/(dashboard)/media/page');

    await expect(canUploadMedia()).resolves.toBe(true);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('does not treat password-gated access as upload permission', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { canUploadMedia } = await import('@/app/(dashboard)/media/page');

    await expect(canUploadMedia()).resolves.toBe(false);
  });
});
