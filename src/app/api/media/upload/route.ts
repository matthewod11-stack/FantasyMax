import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MP4_BRANDS = new Set(['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V ', 'M4A ']);

const uploadSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  seasonId: z.string().optional(),
  title: z.string().trim().min(1).max(120).default('League media'),
});

interface DetectedUploadType {
  contentType: string;
  extension: string;
  fileType: 'image' | 'video';
}

function detectUploadType(buffer: Buffer): DetectedUploadType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { contentType: 'image/jpeg', extension: 'jpg', fileType: 'image' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { contentType: 'image/png', extension: 'png', fileType: 'image' };
  }

  const header = buffer.subarray(0, 12).toString('ascii');
  if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) {
    return { contentType: 'image/gif', extension: 'gif', fileType: 'image' };
  }

  if (buffer.length >= 12 && header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') {
    return { contentType: 'image/webp', extension: 'webp', fileType: 'image' };
  }

  if (buffer.length >= 12 && header.slice(4, 8) === 'ftyp') {
    const majorBrand = header.slice(8, 12);
    if (majorBrand === 'qt  ') {
      return { contentType: 'video/quicktime', extension: 'mov', fileType: 'video' };
    }
    if (MP4_BRANDS.has(majorBrand)) {
      return { contentType: 'video/mp4', extension: 'mp4', fileType: 'video' };
    }
  }

  return null;
}

function requireSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (new URL(origin).origin === request.nextUrl.origin) {
      return null;
    }
  } catch {
    // Fall through to a sanitized forbidden response.
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

async function requireCommissioner() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: member, error } = await authClient
    .from('members')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !member || member.role !== 'commissioner') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { member };
}

export async function POST(request: NextRequest) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const ip = getClientIp(request.headers);
    const auth = await requireCommissioner();
    if (auth.error) return auth.error;

    const { success } = rateLimit(
      `media-upload:${auth.member.id}:${ip}`,
      20,
      15 * 60 * 1000,
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parsed = uploadSchema.safeParse({
      memberId: formData.get('memberId'),
      seasonId: formData.get('seasonId') || undefined,
      title: formData.get('title') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid upload metadata' },
        { status: 400 },
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File must be 50 MB or smaller' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectUploadType(buffer);

    if (!detectedType) {
      return NextResponse.json({ error: 'Upload an image or MP4/MOV video file' }, { status: 400 });
    }

    const { memberId, seasonId, title } = parsed.data;
    const supabase = createServiceRoleClient();
    const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${detectedType.extension}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, buffer, { contentType: detectedType.contentType, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);

    const { data: row, error } = await supabase
      .from('media')
      .insert({
        title,
        storage_path: storagePath,
        url: urlData.publicUrl,
        filename: file.name,
        file_type: detectedType.fileType,
        file_size: file.size,
        season_id: seasonId || null,
        member_id: memberId,
        uploaded_by: auth.member.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
