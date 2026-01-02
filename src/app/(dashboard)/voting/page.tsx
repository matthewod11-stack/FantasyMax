import React from 'react';
import { Vote } from 'lucide-react';
import { GovernancePlaceholder } from '@/components/features/governance';

export default function VotingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Vote className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl tracking-wide text-foreground uppercase">
            Governance
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          League democracy and official rules
        </p>
      </div>

      <div className="py-4">
        <GovernancePlaceholder defaultTab="voting" />
      </div>
    </div>
  );
}

