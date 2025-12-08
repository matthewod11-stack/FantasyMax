'use client';

import { cn } from '@/lib/utils';

interface RecordsSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for a single record card
 */
function RecordCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-muted p-5 bg-card">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded bg-muted animate-pulse" />
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
      </div>

      {/* Avatar + value skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* Context skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-3.5 rounded bg-muted animate-pulse" />
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for a category section
 */
function CategorySkeleton() {
  return (
    <div className="space-y-4">
      {/* Category header skeleton */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        <div className="space-y-1">
          <div className="h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* Records grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <RecordCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * RecordsSkeleton
 *
 * Full page loading skeleton for the Records page.
 */
export function RecordsSkeleton({ className }: RecordsSkeletonProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-48 rounded bg-muted animate-pulse" />
        <div className="h-5 w-72 rounded bg-muted animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 rounded bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* Category sections skeleton */}
      <CategorySkeleton />
    </div>
  );
}
