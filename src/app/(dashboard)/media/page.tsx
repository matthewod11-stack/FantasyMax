import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { MediaGallery } from '@/components/features/media/MediaGallery';
import { MediaUploadForm } from '@/components/features/media/MediaUploadForm';
import { Image } from 'lucide-react';

export const metadata = {
  title: 'Media | League of Degenerates',
};

export default async function MediaPage() {
  const supabase = await createAdminClient();

  const { data: media } = await supabase
    .from('media')
    .select('id, title, url, file_type, created_at, uploader:members!media_uploaded_by_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, year')
    .order('year', { ascending: false });

  const { data: members } = await supabase
    .from('members')
    .select('id, display_name')
    .eq('is_active', true);

  const galleryItems = (media ?? []).map((m) => ({
    id: m.id,
    title: m.title ?? 'Untitled',
    file_url: m.url,
    file_type: m.file_type,
    created_at: m.created_at ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member: (m.uploader as any) ? { display_name: (m.uploader as any).display_name } : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <Image className="h-8 w-8 text-primary" />
          Media Gallery
        </h1>
        <p className="text-muted-foreground">Draft nights, championships, Vegas, and league chaos</p>
      </div>

      <MediaUploadForm seasons={seasons ?? []} members={members ?? []} />

      {galleryItems.length > 0 ? (
        <MediaGallery items={galleryItems} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No uploads yet. Legacy Vegas entrance below.</p>
            <video
              className="mx-auto mt-6 max-w-md rounded-lg"
              controls
              src="/Vegasentrance.MOV"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
