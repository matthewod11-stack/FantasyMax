import React from 'react';
import { ClipboardList } from 'lucide-react';
import { PlaceholderCard } from '@/components/ui/placeholder-card';

export default function DraftAnalyzerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl tracking-wide text-foreground uppercase">
            Draft Analyzer
          </h1>
        </div>
        <p className="text-muted-foreground font-body">
          Historical draft data and performance analytics
        </p>
      </div>

      <div className="py-8">
        <PlaceholderCard
          title="Draft Analyzer"
          description="Analyze every pick from the last 11 seasons. Find the best sleepers, the biggest busts, and identify which managers truly win the draft."
          icon={ClipboardList}
          v2Features={[
            'Full draft results by year',
            'Pick-by-pick performance tracking',
            'Best picks vs. Biggest busts leaderboard',
            'Draft grade history for all managers',
            'Draft day strategy analysis',
            'Rookie vs. Veteran success rates'
          ]}
        />
      </div>
    </div>
  );
}

