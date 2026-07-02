'use client';

import { useEffect, useState } from 'react';
import { DetailModal } from '@/components/ui/detail-modal';
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
} from 'lucide-react';
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
 * WriteupDetailDrawer - Full writeup content in centered modal
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
  const [loadedWriteupId, setLoadedWriteupId] = useState<string | null>(null);

  // Fetch writeup when ID changes
  useEffect(() => {
    if (!writeupId || !isOpen) {
      return;
    }

    let isCurrent = true;

    fetchWriteup(writeupId)
      .then((result) => {
        if (!isCurrent) {
          return;
        }

        setWriteup(result);
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setWriteup(null);
      })
      .finally(() => {
        if (isCurrent) {
          setLoadedWriteupId(writeupId);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [writeupId, isOpen, fetchWriteup]);

  // Clear writeup when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setWriteup(null);
        setLoadedWriteupId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const currentWriteup = writeup?.id === writeupId ? writeup : null;
  const isLoading = Boolean(writeupId && isOpen && loadedWriteupId !== writeupId);
  const Icon = currentWriteup ? WRITEUP_TYPE_ICONS[currentWriteup.writeup_type] : FileText;
  const typeLabel = currentWriteup ? WRITEUP_TYPE_LABELS[currentWriteup.writeup_type] : '';

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={currentWriteup?.title || 'Writeup'}
      size="lg"
    >
      {isLoading && <WriteupDetailSkeleton />}

      {!isLoading && currentWriteup && (
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            {/* Type badge and metadata */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-sm font-medium text-gold">
                <Icon className="h-4 w-4" />
                <span>{typeLabel}</span>
              </div>

              {currentWriteup.week && (
                <span className="text-sm text-muted-foreground">
                  Week {currentWriteup.week}
                </span>
              )}

              {currentWriteup.season && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{currentWriteup.season.year} Season</span>
                </div>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3">
              <ManagerAvatar
                avatarUrl={currentWriteup.author.avatar_url}
                displayName={currentWriteup.author.display_name}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {currentWriteup.author.display_name}
                </p>
                {currentWriteup.published_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(currentWriteup.published_at)}
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
              {currentWriteup.content}
            </div>
          </div>

          {/* Footer */}
          {currentWriteup.imported_from && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">
                Imported from historical archive
              </p>
            </div>
          )}
        </div>
      )}

      {!isLoading && !currentWriteup && writeupId && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Writeup not found</p>
        </div>
      )}
    </DetailModal>
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
