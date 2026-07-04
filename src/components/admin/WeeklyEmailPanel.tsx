'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  updateWeeklyDigestAction,
  publishWeeklyDigestAction,
  unpublishWeeklyDigestAction,
} from '@/app/admin/weekly/actions';
import { Copy, Check, Save, Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { WeeklyDigestStatus } from '@/lib/supabase/queries/weekly-digest';

interface WeeklyEmailPanelProps {
  digestId: string;
  subject: string;
  body: string;
  title: string;
  note: string;
  status: WeeklyDigestStatus;
  publishedAt: string | null;
  week: number;
  seasonYear: number;
}

export function WeeklyEmailPanel({
  digestId,
  subject,
  body,
  title,
  note,
  status,
  publishedAt,
  week,
  seasonYear,
}: WeeklyEmailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [draftSubject, setDraftSubject] = useState(subject);
  const [draftBody, setDraftBody] = useState(body);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftNote, setDraftNote] = useState(note);
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | 'unpublish' | null>(
    null,
  );

  const fullText = useMemo(() => {
    const noteText = draftNote.trim();
    return `Subject: ${draftSubject}\n\n${noteText ? `${noteText}\n\n` : ''}${draftBody}`;
  }, [draftBody, draftNote, draftSubject]);

  const actionInput = {
    digestId,
    subject: draftSubject,
    body: draftBody,
    title: draftTitle,
    note: draftNote,
  };

  async function copyAll() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveDraft() {
    setPendingAction('save');
    const result = await updateWeeklyDigestAction(actionInput);
    setPendingAction(null);

    if (result.success) {
      toast.success(result.message ?? 'Draft saved');
    } else {
      toast.error(result.error ?? 'Failed to save draft');
    }
  }

  async function publishDigest() {
    setPendingAction('publish');
    const result = await publishWeeklyDigestAction(actionInput);
    setPendingAction(null);

    if (result.success) {
      toast.success(result.message ?? 'Dispatch published');
    } else {
      toast.error(result.error ?? 'Failed to publish dispatch');
    }
  }

  async function unpublishDigest() {
    setPendingAction('unpublish');
    const result = await unpublishWeeklyDigestAction(digestId);
    setPendingAction(null);

    if (result.success) {
      toast.success(result.message ?? 'Dispatch moved back to draft');
    } else {
      toast.error(result.error ?? 'Failed to unpublish dispatch');
    }
  }

  const isPending = pendingAction !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              Week {week} — {seasonYear} League Dispatch
            </CardTitle>
            <CardDescription>
              {publishedAt
                ? `Published ${new Date(publishedAt).toLocaleString()}`
                : 'Draft generated from the latest Yahoo sync'}
            </CardDescription>
          </div>
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dispatch-title">Dashboard title</Label>
          <Input
            id="dispatch-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            maxLength={160}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dispatch-note">Commissioner note</Label>
          <Textarea
            id="dispatch-note"
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dispatch-subject">Email subject</Label>
          <Input
            id="dispatch-subject"
            value={draftSubject}
            onChange={(event) => setDraftSubject(event.target.value)}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dispatch-body">Email body</Label>
          <Textarea
            id="dispatch-body"
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            maxLength={5000}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={saveDraft} disabled={isPending} variant="outline">
            <Save className="mr-2 h-4 w-4" />
            {pendingAction === 'save' ? 'Saving...' : 'Save draft'}
          </Button>
          <Button onClick={publishDigest} disabled={isPending}>
            <Send className="mr-2 h-4 w-4" />
            {pendingAction === 'publish'
              ? 'Publishing...'
              : status === 'published'
                ? 'Update published'
                : 'Publish'}
          </Button>
          {status === 'published' && (
            <Button onClick={unpublishDigest} disabled={isPending} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              {pendingAction === 'unpublish' ? 'Moving...' : 'Move to draft'}
            </Button>
          )}
          <Button onClick={copyAll} disabled={isPending} variant="outline">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy subject + body
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
