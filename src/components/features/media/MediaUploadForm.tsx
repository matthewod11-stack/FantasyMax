'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface MediaUploadFormProps {
  seasons: { id: string; year: number }[];
  members: { id: string; display_name: string }[];
}

export function MediaUploadForm({ seasons, members }: MediaUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('memberId', members[0]?.id ?? '');
    form.append('seasonId', seasons[0]?.id ?? '');
    form.append('title', file.name);

    const res = await fetch('/api/media/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Upload failed');
    } else {
      toast.success('Uploaded');
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Submit Media</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 items-end">
        <Input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={upload} disabled={!file || loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  );
}
