'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton-card';

interface AwardsSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for the awards page
 */
export function AwardsSkeleton({ className }: AwardsSkeletonProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Featured award skeleton */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="max-w-md">
          <AwardCardSkeleton featured />
        </div>
      </section>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Leaderboard skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <LeaderboardRowSkeleton key={i} />
        ))}
      </div>

      {/* Stats footer skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Single award card skeleton
 */
export function AwardCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-border/50',
        'bg-gradient-to-br from-card via-card to-secondary/30',
        featured ? 'p-6' : 'p-5'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Member info */}
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className={cn('rounded-full', featured ? 'h-14 w-14' : 'h-10 w-10')} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-3.5" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * Leaderboard row skeleton
 */
function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card">
      {/* Rank */}
      <Skeleton className="h-10 w-10 rounded-full" />

      {/* Member */}
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-7 w-12" />
    </div>
  );
}

/**
 * Year section skeleton for timeline view
 */
export function YearSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Year header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Awards grid */}
      <div className="ml-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <AwardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
