'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyEmailPanelProps {
  subject: string;
  body: string;
  week: number;
  seasonYear: number;
}

export function WeeklyEmailPanel({ subject, body, week, seasonYear }: WeeklyEmailPanelProps) {
  const [copied, setCopied] = useState(false);

  const fullText = `Subject: ${subject}\n\n${body}`;

  async function copyAll() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Week {week} — {seasonYear} Email Draft
        </CardTitle>
        <CardDescription>Paste into your league group email after Tuesday sync</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Subject
          </p>
          <p className="font-medium">{subject}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Body
          </p>
          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg font-sans">
            {body}
          </pre>
        </div>
        <Button onClick={copyAll}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          Copy subject + body
        </Button>
      </CardContent>
    </Card>
  );
}
