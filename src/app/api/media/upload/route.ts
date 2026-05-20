import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const memberId = formData.get('memberId') as string | null;
    const seasonId = formData.get('seasonId') as string | null;
    const title = (formData.get('title') as string) || 'League media';

    if (!file || !memberId) {
      return NextResponse.json({ error: 'File and member required' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const ext = file.name.split('.').pop() || 'bin';
    const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);
    const fileType = file.type.startsWith('video') ? 'video' : 'image';

    const { data: row, error } = await supabase
      .from('media')
      .insert({
        title,
        storage_path: storagePath,
        url: urlData.publicUrl,
        filename: file.name,
        file_type: fileType,
        file_size: file.size,
        season_id: seasonId || null,
        member_id: memberId,
        uploaded_by: memberId,
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
