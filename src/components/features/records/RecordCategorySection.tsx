'use client';

import { cn } from '@/lib/utils';
import { RecordFullCard } from './RecordFullCard';
import { Trophy, Flame, Calendar, Medal, Skull } from 'lucide-react';
import type { LeagueRecordRow, RecordCategory, RecordType } from '@/types/contracts/queries';
import type { TopNEntry } from '@/lib/supabase/queries/records';

interface RecordCategorySectionProps {
  category: RecordCategory;
  records: LeagueRecordRow[];
  /** Top N entries keyed by record type */
  topNByRecordType: Record<RecordType, TopNEntry[]>;
  className?: string;
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
 * Groups records by category with a header and 2-column grid layout.
 * Each record shows the full leaderboard inline.
 */
export function RecordCategorySection({
  category,
  records,
  topNByRecordType,
  className,
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

      {/* Records grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {records.map((record) => (
          <RecordFullCard
            key={record.record_type}
            record={record}
            topEntries={topNByRecordType[record.record_type] ?? []}
          />
        ))}
      </div>
    </section>
  );
}
