import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { PlaceholderCard } from '@/components/ui/placeholder-card';

export default function TradesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl tracking-wide text-foreground uppercase">
            Trades
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          The art of the deal and league transactional history
        </p>
      </div>

      <div className="py-8">
        <PlaceholderCard
          title="Trade Center"
          description="A complete history of all trades made in the League of Degenerates. From the league-altering blockbusters to the bench-depth swaps."
          icon={ArrowLeftRight}
          v2Features={[
            'Yahoo trade history sync',
            'Detailed trade breakdowns (who got who)',
            'Trade timeline by season',
            'Trade winner/loser analysis',
            'All-time most active traders',
            'Trade impact on season outcomes'
          ]}
        />
      </div>
    </div>
  );
}

