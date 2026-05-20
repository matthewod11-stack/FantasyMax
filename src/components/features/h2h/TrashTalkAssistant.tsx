'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Flame } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TrashTalkAssistantProps {
  member1Id: string;
  member2Id: string;
  member1Name: string;
  member2Name: string;
}

export function TrashTalkAssistant({
  member1Id,
  member2Id,
  member1Name,
  member2Name,
}: TrashTalkAssistantProps) {
  const [tone, setTone] = useState<'friendly' | 'savage' | 'espn'>('friendly');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/trash-talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member1Id, member2Id, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.data.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">Trash Talk Assistant</span>
      </div>
      <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="friendly">Friendly</SelectItem>
          <SelectItem value="espn">ESPN</SelectItem>
          <SelectItem value="savage">Savage</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={generate} disabled={loading}>
        {loading ? 'Generating...' : `Roast ${member2Name}`}
      </Button>
      {message && (
        <div className="space-y-2">
          <p className="text-sm">{message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(message);
              toast.success('Copied');
            }}
          >
            <Copy className="mr-2 h-3 w-3" />
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
