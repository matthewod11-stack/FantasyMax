'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { WriteupDetailSkeleton } from './WriteupsSkeleton';
import {
  Calendar,
  FileText,
  Trophy,
  BarChart3,
  Megaphone,
  ClipboardList,
  TrendingUp,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WriteupWithDetails, WriteupType } from '@/types/contracts/queries';

interface WriteupDetailDrawerProps {
  writeupId: string | null;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Function to fetch writeup by ID (passed from parent)
   */
  fetchWriteup: (id: string) => Promise<WriteupWithDetails | null>;
}

/**
 * Icon mapping for writeup types
 */
const WRITEUP_TYPE_ICONS: Record<WriteupType, typeof FileText> = {
  weekly_recap: FileText,
  playoff_preview: Trophy,
  season_recap: Trophy,
  draft_notes: ClipboardList,
  standings_update: BarChart3,
  power_rankings: TrendingUp,
  announcement: Megaphone,
  other: HelpCircle,
};

const WRITEUP_TYPE_LABELS: Record<WriteupType, string> = {
  weekly_recap: 'Week Recap',
  playoff_preview: 'Playoff Preview',
  season_recap: 'Season Recap',
  draft_notes: 'Draft Notes',
  standings_update: 'Standings Update',
  power_rankings: 'Power Rankings',
  announcement: 'Announcement',
  other: 'Update',
};

/**
 * WriteupDetailDrawer - Full writeup content in slide-out drawer
 *
 * Shows the complete writeup content with formatting preserved.
 */
export function WriteupDetailDrawer({
  writeupId,
  isOpen,
  onClose,
  fetchWriteup,
}: WriteupDetailDrawerProps) {
  const [writeup, setWriteup] = useState<WriteupWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch writeup when ID changes
  useEffect(() => {
    if (writeupId && isOpen) {
      setIsLoading(true);
      fetchWriteup(writeupId)
        .then(setWriteup)
        .finally(() => setIsLoading(false));
    }
  }, [writeupId, isOpen, fetchWriteup]);

  // Clear writeup when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setWriteup(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const Icon = writeup ? WRITEUP_TYPE_ICONS[writeup.writeup_type] : FileText;
  const typeLabel = writeup ? WRITEUP_TYPE_LABELS[writeup.writeup_type] : '';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">
            {writeup?.title || 'Writeup'}
          </SheetTitle>
        </SheetHeader>

        {isLoading && <WriteupDetailSkeleton />}

        {!isLoading && writeup && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              {/* Type badge and metadata */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-sm font-medium text-gold">
                  <Icon className="h-4 w-4" />
                  <span>{typeLabel}</span>
                </div>

                {writeup.week && (
                  <span className="text-sm text-muted-foreground">
                    Week {writeup.week}
                  </span>
                )}

                {writeup.season && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{writeup.season.year} Season</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-display uppercase tracking-wide text-foreground">
                {writeup.title}
              </h2>

              {/* Author */}
              <div className="flex items-center gap-3">
                <ManagerAvatar
                  avatarUrl={writeup.author.avatar_url}
                  displayName={writeup.author.display_name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {writeup.author.display_name}
                  </p>
                  {writeup.published_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(writeup.published_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Content */}
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-body text-foreground/90 leading-relaxed">
                {writeup.content}
              </div>
            </div>

            {/* Footer */}
            {writeup.imported_from && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Imported from historical archive
                </p>
              </div>
            )}
          </div>
        )}

        {!isLoading && !writeup && writeupId && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Writeup not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
