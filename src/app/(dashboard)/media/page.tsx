import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { MediaGallery } from '@/components/features/media/MediaGallery';
import { MediaUploadForm } from '@/components/features/media/MediaUploadForm';
import { ImageIcon } from 'lucide-react';

export const metadata = {
  title: 'League Memories | League of Degenerates',
};

export async function canUploadMedia() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return member?.role === 'commissioner';
}

export default async function MediaPage() {
  const supabase = await createAdminClient();
  const canUpload = await canUploadMedia();

  const { data: media } = await supabase
    .from('media')
    .select(`
      id,
      title,
      description,
      event_name,
      url,
      file_type,
      created_at,
      taken_at,
      season:seasons(year),
      uploader:members!media_uploaded_by_fkey(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const [{ data: seasons }, { data: members }] = canUpload
    ? await Promise.all([
        supabase
          .from('seasons')
          .select('id, year')
          .order('year', { ascending: false }),
        supabase
          .from('members')
          .select('id, display_name')
          .eq('is_active', true),
      ])
    : [{ data: [] }, { data: [] }];

  const featuredItems = [
    {
      id: 'vegas-entrance',
      title: 'Vegas Draft Entrance',
      file_url: '/Vegasentrance.MOV',
      file_type: 'video',
      created_at: '2018-08-25T00:00:00.000Z',
      member: null,
      featured: true,
      context: 'Vegas draft weekend',
      caption:
        'The table-setting entrance for a league trip that still has more mythology than most playoff runs.',
    },
  ];

  const galleryItems = (media ?? []).map((m) => ({
    id: m.id,
    title: m.title ?? 'Untitled',
    file_url: m.url,
    file_type: m.file_type,
    created_at: m.taken_at ?? m.created_at ?? '',
    context:
      m.event_name ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((m.season as any)?.year ? `${(m.season as any).year} season` : undefined),
    caption: m.description ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member: (m.uploader as any) ? { display_name: (m.uploader as any).display_name } : null,
  }));
  const memoryItems = [...featuredItems, ...galleryItems];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-primary" />
          League Memories
        </h1>
        <p className="text-muted-foreground">
          Draft nights, championship artifacts, Vegas evidence, and league chaos worth preserving.
        </p>
      </div>

      <MediaGallery items={memoryItems} />
      <MediaUploadForm seasons={seasons ?? []} members={members ?? []} canUpload={canUpload} />
    </div>
  );
}
