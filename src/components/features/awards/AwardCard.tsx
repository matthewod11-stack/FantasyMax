'use client';

import { cn } from '@/lib/utils';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Trophy, Calendar, Star, ThumbsDown } from 'lucide-react';
import type { AwardWithDetails } from '@/lib/supabase/queries';

interface AwardCardProps {
  award: AwardWithDetails;
  className?: string;
  /**
   * Show as "featured" award (larger, more prominent)
   */
  featured?: boolean;
  /**
   * Hide the year badge (useful when in a year-grouped context)
   */
  hideYear?: boolean;
}

/**
 * AwardCard - Digital Trophy Plaque for Awards
 *
 * Displays an end-of-season award with trophy room aesthetic.
 * Positive awards (MVP, Champion) get gold styling.
 * Negative awards (Sacko, Worst Trade) get muted "shame" styling.
 */
export function AwardCard({
  award,
  className,
  featured = false,
  hideYear = false,
}: AwardCardProps) {
  const isNegative = !award.is_positive;

  return (
    <div
      className={cn(
        // Base card design
        'relative overflow-hidden rounded-xl border-2',
        'bg-gradient-to-br from-card via-card',
        'transition-all duration-300',
        // Positive vs negative styling
        isNegative
          ? 'to-muted/30 border-muted-foreground/20 hover:border-loss/40'
          : 'to-secondary/30 border-gold/30 hover:border-gold/50',
        // Featured card gets extra glow
        featured && !isNegative && 'ring-2 ring-gold/30 ring-offset-2 ring-offset-background',
        featured && isNegative && 'ring-2 ring-loss/30 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {/* Trophy/Thumbs-down watermark background */}
      <div
        className={cn(
          'absolute -right-4 -top-4 opacity-5',
          isNegative ? 'text-muted-foreground' : 'text-gold'
        )}
      >
        {isNegative ? (
          <ThumbsDown className={cn('h-32 w-32', featured && 'h-40 w-40')} />
        ) : (
          <Trophy className={cn('h-32 w-32', featured && 'h-40 w-40')} />
        )}
      </div>

      {/* Content */}
      <div className={cn('relative p-5', featured && 'p-6')}>
        {/* Award name and icon header */}
        <div className="flex items-center gap-2 mb-4">
          {/* Award icon (emoji from database) */}
          {award.award_type_icon && (
            <span className="text-2xl" role="img" aria-label={award.award_type_name}>
              {award.award_type_icon}
            </span>
          )}
          {!award.award_type_icon && (
            isNegative ? (
              <ThumbsDown className={cn('h-5 w-5 text-loss')} />
            ) : (
              <Star className={cn('h-5 w-5 text-gold')} />
            )
          )}
          <h3
            className={cn(
              'font-display uppercase tracking-wide',
              featured ? 'text-lg' : 'text-base',
              isNegative ? 'text-muted-foreground' : 'text-gold'
            )}
          >
            {award.award_type_name}
          </h3>
        </div>

        {/* Member info */}
        <div className="flex items-center gap-4 mb-3">
          <ManagerAvatar
            avatarUrl={award.member_avatar_url}
            displayName={award.member_display_name}
            size={featured ? 'lg' : 'md'}
            showChampionRing={!isNegative && award.award_type_name === 'Champion'}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'font-body font-semibold text-foreground truncate',
                featured && 'text-lg'
              )}
            >
              {award.member_display_name}
            </p>
            {award.team_name && (
              <p className="text-sm text-muted-foreground truncate">
                {award.team_name}
              </p>
            )}
          </div>
        </div>

        {/* Award value/notes if present */}
        {award.value && (
          <div className="mb-3">
            <p
              className={cn(
                'font-mono text-sm',
                isNegative ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {award.value}
            </p>
          </div>
        )}

        {/* Notes (commissioner's explanation) */}
        {award.notes && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              &ldquo;{award.notes}&rdquo;
            </p>
          </div>
        )}

        {/* Year badge (optional) */}
        {!hideYear && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{award.season_year} Season</span>
          </div>
        )}
      </div>
    </div>
  );
}
