'use client';

import React from 'react';
import { Vote, BookOpen, Scale, ScrollText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceholderCard } from '@/components/ui/placeholder-card';

interface GovernancePlaceholderProps {
  defaultTab?: 'voting' | 'constitution';
}

export function GovernancePlaceholder({
  defaultTab = 'voting',
}: GovernancePlaceholderProps) {
  return (
    <div className="space-y-8">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="voting" className="gap-2">
            <Vote className="h-4 w-4" />
            <span>Voting System</span>
          </TabsTrigger>
          <TabsTrigger value="constitution" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Constitution</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="voting">
            <PlaceholderCard
              title="League Voting"
              description="A democratic system for making league decisions. From rule changes to award voting, every manager's voice will be heard and recorded in the league history."
              icon={Vote}
              v2Features={[
                'Create and manage polls',
                'Anonymous vs public voting options',
                'Historical record of all league votes',
                'Real-time results visualization',
                'Award ceremony voting',
                'Rule change amendments'
              ]}
            />
          </TabsContent>

          <TabsContent value="constitution">
            <PlaceholderCard
              title="League Constitution"
              description="The official rulebook of the League of Degenerates. A living document that defines our legacy, rules, and the standard of competition."
              icon={BookOpen}
              v2Features={[
                'Formatted rules display',
                'Categorized rule sections',
                'Amendment history tracking',
                'Archived versions of old rules',
                'PDF export for league records',
                'Linked voting for rule changes'
              ]}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Philosophy section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg uppercase tracking-wide">Degenerate Democracy</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The V2 Voting system will allow us to move beyond messy text chains. Every major rule change will be voted on, recorded, and automatically reflected in the Constitution.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <ScrollText className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg uppercase tracking-wide">Living Records</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No more "I thought that was the rule." The Constitution will be the single source of truth, with a complete audit trail of how rules evolved over the seasons.
          </p>
        </div>
      </div>
    </div>
  );
}

