'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MediaItem {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
  member?: { display_name: string } | null;
  featured?: boolean;
  context?: string;
  caption?: string;
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const date = new Date(item.created_at);
        const displayDate = Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);

        return (
          <Card
            key={item.id}
            className={item.featured ? 'overflow-hidden sm:col-span-2 lg:col-span-3' : 'overflow-hidden'}
          >
            <CardContent className="p-0">
              <div className={item.featured ? 'grid gap-0 lg:grid-cols-[1.35fr_1fr]' : ''}>
                {item.file_type === 'video' ? (
                  <video
                    src={item.file_url}
                    controls
                    playsInline
                    className={cn(
                      'aspect-video w-full bg-black',
                      item.featured ? 'object-contain' : 'object-cover',
                    )}
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.file_url}
                    alt={item.title}
                    width={1280}
                    height={720}
                    loading={item.featured ? 'eager' : 'lazy'}
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className={item.featured ? 'flex flex-col justify-center p-5 sm:p-6' : 'p-3'}>
                  {item.featured && (
                    <Badge variant="outline" className="mb-3 w-fit">
                      League Artifact
                    </Badge>
                  )}
                  {item.context && (
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                      {item.context}
                    </p>
                  )}
                  <p className={item.featured ? 'text-xl font-semibold text-pretty' : 'text-sm font-medium'}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.member?.display_name ?? 'League'}
                    {displayDate ? ` · ${displayDate}` : ''}
                  </p>
                  {item.caption && (
                    <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
