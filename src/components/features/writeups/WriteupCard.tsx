'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import {
  Calendar,
  FileText,
  Trophy,
  BarChart3,
  Megaphone,
  ClipboardList,
  TrendingUp,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import type { WriteupWithDetails, WriteupType } from '@/types/contracts/queries';
import { formatLoreTopicLabel, getWriteupLoreTopics } from '@/lib/writeups/lore';

interface WriteupCardProps {
  writeup: WriteupWithDetails;
  className?: string;
  /**
   * Show as expanded with full excerpt (vs compact list item)
   */
  expanded?: boolean;
  /**
   * Click handler for read more
   */
  onClick?: () => void;
}

/**
 * Icon and label mapping for writeup types
 */
const WRITEUP_TYPE_CONFIG: Record<
  WriteupType,
  { icon: typeof FileText; label: string; color: string }
> = {
  weekly_recap: {
    icon: FileText,
    label: 'Week Recap',
    color: 'text-blue-400',
  },
  playoff_preview: {
    icon: Trophy,
    label: 'Playoff Preview',
    color: 'text-gold',
  },
  season_recap: {
    icon: Trophy,
    label: 'Season Recap',
    color: 'text-gold',
  },
  draft_notes: {
    icon: ClipboardList,
    label: 'Draft Notes',
    color: 'text-green-400',
  },
  standings_update: {
    icon: BarChart3,
    label: 'Standings',
    color: 'text-purple-400',
  },
  power_rankings: {
    icon: TrendingUp,
    label: 'Power Rankings',
    color: 'text-orange-400',
  },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    color: 'text-red-400',
  },
  other: {
    icon: HelpCircle,
    label: 'Update',
    color: 'text-muted-foreground',
  },
};

/**
 * WriteupCard - Commissioner Writeup Display Card
 *
 * Displays a writeup with type badge, title, excerpt, and metadata.
 * Compact mode for list views, expanded for featured display.
 */
export function WriteupCard({
  writeup,
  className,
  expanded = false,
  onClick,
}: WriteupCardProps) {
  const typeConfig = WRITEUP_TYPE_CONFIG[writeup.writeup_type];
  const Icon = typeConfig.icon;
  const loreTopics = getWriteupLoreTopics(writeup);

  // Format week label if present
  const weekLabel = writeup.week ? `Week ${writeup.week}` : null;

  const body = (
    <div className={cn('p-4', expanded && 'p-5')}>
      {/* Header: Type badge + Week label */}
      <div className="mb-3 flex items-center gap-2">
        {/* Type badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2 py-0.5',
            'bg-secondary/50 text-xs font-medium',
            typeConfig.color
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{typeConfig.label}</span>
        </div>

        {/* Week number if present */}
        {weekLabel && (
          <span className="text-xs text-muted-foreground">
            {weekLabel}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Season year */}
        {writeup.season && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{writeup.season.year}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          'mb-2 font-body font-semibold text-foreground',
          expanded ? 'text-lg' : 'text-base',
          'line-clamp-2 group-hover:text-gold transition-colors'
        )}
      >
        {writeup.title}
      </h3>

      {/* Lore topic badges */}
      {loreTopics.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {loreTopics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {formatLoreTopicLabel(topic)}
            </span>
          ))}
        </div>
      )}

      {/* Excerpt */}
      {writeup.excerpt && (
        <p
          className={cn(
            'mb-3 text-sm text-muted-foreground',
            expanded ? 'line-clamp-4' : 'line-clamp-2'
          )}
        >
          {writeup.excerpt}
        </p>
      )}

      {/* Footer: Author + Read more */}
      <div className="flex items-center justify-between">
        {/* Author */}
        <div className="flex items-center gap-2">
          <ManagerAvatar
            avatarUrl={writeup.author.avatar_url}
            displayName={writeup.author.display_name}
            size="sm"
          />
          <span className="text-xs text-muted-foreground">
            {writeup.author.display_name}
          </span>
        </div>

        {/* Read more indicator */}
        {onClick && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-gold">
            <span>Read</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </div>
  );

  const classNames = cn(
    'group relative overflow-hidden rounded-lg border',
    'bg-card hover:bg-secondary/30',
    'transition-[background-color,border-color,box-shadow,color] duration-200',
    onClick && 'cursor-pointer hover:border-gold/30 focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(classNames, 'w-full text-left')}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border',
        'bg-card hover:bg-secondary/30',
        'transition-[background-color,border-color,color] duration-200',
        className
      )}
    >
      {body}
    </div>
  );
}

/**
 * Compact version for list displays
 */
export function WriteupListItem({
  writeup,
  onClick,
}: {
  writeup: WriteupWithDetails;
  onClick?: () => void;
}) {
  const typeConfig = WRITEUP_TYPE_CONFIG[writeup.writeup_type];
  const Icon = typeConfig.icon;
  const loreTopics = getWriteupLoreTopics(writeup);

  const body = (
    <>
      {/* Type icon */}
      <div className={cn('shrink-0', typeConfig.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Title + metadata */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">
          {writeup.title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {writeup.week && <span>Week {writeup.week}</span>}
          {writeup.week && writeup.season && <span>•</span>}
          {writeup.season && <span>{writeup.season.year}</span>}
          {loreTopics.slice(0, 2).map((topic) => (
            <span key={topic} className="rounded-full bg-secondary/60 px-1.5 py-0.5">
              {formatLoreTopicLabel(topic)}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      {onClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-gold" />
      )}
    </>
  );

  const className = cn(
    'group flex w-full items-center gap-4 px-4 py-3 text-left',
    'border-b border-border/50 last:border-0',
    'hover:bg-secondary/30 transition-colors',
    onClick && 'cursor-pointer focus-visible:ring-ring/50 focus-visible:ring-[3px]'
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className}>
      {body}
    </div>
  );
}
