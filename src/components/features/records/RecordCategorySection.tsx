'use client';

import { cn } from '@/lib/utils';
import { RecordCard } from './RecordCard';
import { Trophy, Flame, Calendar, Medal, Skull } from 'lucide-react';
import type { LeagueRecordRow, RecordCategory, RecordType } from '@/types/contracts/queries';

/**
 * Record types that support the Top N leaderboard view
 */
const LEADERBOARD_SUPPORTED_TYPES: RecordType[] = [
  'highest_single_week_score',
  'lowest_single_week_score',
  'biggest_blowout_margin',
  'closest_game_margin',
  'most_season_wins',
  'most_season_points',
];

interface RecordCategorySectionProps {
  category: RecordCategory;
  records: LeagueRecordRow[];
  className?: string;
  /**
   * Called when a record card is clicked
   */
  onRecordClick?: (record: LeagueRecordRow) => void;
}

/**
 * Get category display info
 */
function getCategoryInfo(category: RecordCategory): {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
} {
  const iconClass = 'h-6 w-6';

  switch (category) {
    case 'single_week':
      return {
        title: 'Single Week',
        description: 'Records set in a single week of play',
        icon: <Flame className={cn(iconClass, 'text-orange-500')} />,
        color: 'text-orange-500',
      };
    case 'season':
      return {
        title: 'Season',
        description: 'The best (and worst) season performances',
        icon: <Calendar className={cn(iconClass, 'text-blue-500')} />,
        color: 'text-blue-500',
      };
    case 'career':
      return {
        title: 'All-Time',
        description: 'Career achievements across all seasons',
        icon: <Trophy className={cn(iconClass, 'text-gold')} />,
        color: 'text-gold',
      };
    case 'playoff':
      return {
        title: 'Playoffs',
        description: 'Postseason glory and heartbreak',
        icon: <Medal className={cn(iconClass, 'text-purple-500')} />,
        color: 'text-purple-500',
      };
    case 'dubious':
      return {
        title: 'Hall of Shame',
        description: 'Records you probably don\'t want to hold',
        icon: <Skull className={cn(iconClass, 'text-loss')} />,
        color: 'text-loss',
      };
    default:
      return {
        title: category,
        description: '',
        icon: <Trophy className={iconClass} />,
        color: 'text-foreground',
      };
  }
}

/**
 * RecordCategorySection
 *
 * Groups records by category with a header and grid layout.
 */
export function RecordCategorySection({
  category,
  records,
  className,
  onRecordClick,
}: RecordCategorySectionProps) {
  const { title, description, icon, color } = getCategoryInfo(category);

  if (records.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Category header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        {icon}
        <div>
          <h2 className={cn('font-display text-2xl tracking-wide uppercase', color)}>
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground font-body">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Records grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => {
          const hasLeaderboard = LEADERBOARD_SUPPORTED_TYPES.includes(record.record_type);
          return (
            <RecordCard
              key={record.record_type}
              record={record}
              onClick={onRecordClick ? () => onRecordClick(record) : undefined}
              hasLeaderboard={hasLeaderboard}
            />
          );
        })}
      </div>
    </section>
  );
}
