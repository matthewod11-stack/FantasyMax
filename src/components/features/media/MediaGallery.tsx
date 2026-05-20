'use client';

import { Card, CardContent } from '@/components/ui/card';

interface MediaItem {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
  member?: { display_name: string } | null;
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-0">
            {item.file_type === 'video' ? (
              <video src={item.file_url} controls className="w-full aspect-video object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.file_url} alt={item.title} className="w-full aspect-video object-cover" />
            )}
            <div className="p-3">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.member?.display_name ?? 'League'} ·{' '}
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
