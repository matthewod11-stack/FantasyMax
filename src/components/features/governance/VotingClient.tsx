'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PollWithVotes } from '@/lib/supabase/queries/governance';
import type { Member } from '@/types/database.types';
import { toast } from 'sonner';

interface VotingClientProps {
  polls: PollWithVotes[];
  members: Pick<Member, 'id' | 'display_name'>[];
}

export function VotingClient({ polls, members }: VotingClientProps) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? '');

  async function vote(pollId: string, optionKey: string) {
    if (!memberId) {
      toast.error('Select who you are voting as');
      return;
    }
    const res = await fetch('/api/voting/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, memberId, optionKey }),
    });
    if (!res.ok) {
      toast.error('Vote failed');
      return;
    }
    toast.success('Vote recorded');
    window.location.reload();
  }

  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No active polls. Commissioner can create polls in admin.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Voting as:</span>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {polls.map((poll) => (
        <Card key={poll.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              <Badge>{poll.status}</Badge>
            </div>
            {poll.description && (
              <p className="text-sm text-muted-foreground">{poll.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {poll.options.map((opt) => {
              const total = poll.options.reduce((s, o) => s + o.votes, 0);
              const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
              return (
                <div key={opt.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{opt.label}</span>
                    <span className="text-muted-foreground">
                      {opt.votes} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {poll.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={() => vote(poll.id, opt.key)}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
