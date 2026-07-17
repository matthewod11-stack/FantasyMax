// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/media/upload/route';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]);

function createUploadRequest(
  memberId = 'spoofed-member-id',
  file = new File([jpegBytes], 'draft.jpg', { type: 'image/jpeg' }),
) {
  const form = new FormData();
  form.set('file', file);
  form.set('memberId', memberId);
  form.set('seasonId', 'season-1');
  form.set('title', 'Draft Night');

  return new NextRequest('https://modfantasyleague.com/api/media/upload', {
    method: 'POST',
    headers: { origin: 'https://modfantasyleague.com' },
    body: form,
  });
}

function mockAuthClient(userId: string | null, member?: { id: string; role: string }) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: member ?? null }),
    })),
  } as never);
}

function mockServiceClient() {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockReturnThis();
  const insertedRows: unknown[] = [];
  const serviceClient = {
    storage: {
      from: vi.fn(() => ({
        upload,
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/draft.jpg' } })),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn((row) => {
        insertedRows.push(row);
        return { select: insert };
      }),
    })),
  };

  insert.mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'media-1' }, error: null }),
  });
  vi.mocked(createServiceRoleClient).mockReturnValue(serviceClient as never);

  return { serviceClient, upload, insertedRows };
}

describe('media upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects cross-site upload attempts before auth and storage writes', async () => {
    mockAuthClient('user-1', { id: 'commissioner-member-id', role: 'commissioner' });
    const { serviceClient } = mockServiceClient();
    const form = new FormData();
    form.set('file', new File([jpegBytes], 'draft.jpg', { type: 'image/jpeg' }));
    form.set('memberId', 'member-1');
    form.set('title', 'Draft Night');

    const response = await POST(new NextRequest('https://modfantasyleague.com/api/media/upload', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
      body: form,
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
    expect(createClient).not.toHaveBeenCalled();
    expect(serviceClient.storage.from).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated uploads before storage writes', async () => {
    mockAuthClient(null);
    const { serviceClient } = mockServiceClient();

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(serviceClient.storage.from).not.toHaveBeenCalled();
  });

  it('records the signed-in commissioner as uploader instead of trusting form memberId', async () => {
    mockAuthClient('user-1', { id: 'commissioner-member-id', role: 'commissioner' });
    const { insertedRows } = mockServiceClient();

    const response = await POST(createUploadRequest('spoofed-member-id'));

    expect(response.status).toBe(200);
    expect(insertedRows).toEqual([
      expect.objectContaining({
        member_id: 'spoofed-member-id',
        uploaded_by: 'commissioner-member-id',
      }),
    ]);
  });

  it('rejects spoofed MIME types before storage writes', async () => {
    mockAuthClient('user-1', { id: 'commissioner-member-id', role: 'commissioner' });
    const { upload } = mockServiceClient();
    const forgedFile = new File(['not really an image'], 'draft.jpg', { type: 'image/jpeg' });

    const response = await POST(createUploadRequest('member-1', forgedFile));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Upload an image or MP4/MOV video file' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('derives storage metadata from detected bytes rather than the submitted filename', async () => {
    mockAuthClient('user-1', { id: 'commissioner-member-id', role: 'commissioner' });
    const { upload } = mockServiceClient();
    const disguisedFile = new File([jpegBytes], 'draft.exe', { type: 'application/octet-stream' });

    const response = await POST(createUploadRequest('member-1', disguisedFile));

    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.jpg$/),
      expect.any(Buffer),
      { contentType: 'image/jpeg', upsert: false },
    );
  });

  it('rejects non-video ISO media containers instead of treating every ftyp file as MP4', async () => {
    mockAuthClient('user-1', { id: 'commissioner-member-id', role: 'commissioner' });
    const { upload } = mockServiceClient();
    const heicLikeBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70,
      0x68, 0x65, 0x69, 0x63,
    ]);
    const heicLikeFile = new File([heicLikeBytes], 'draft.heic', { type: 'image/heic' });

    const response = await POST(createUploadRequest('member-1', heicLikeFile));

    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });
});
