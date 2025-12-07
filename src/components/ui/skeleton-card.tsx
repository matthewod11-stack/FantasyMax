'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { SkeletonCardProps } from '@/types/contracts/components';

/**
 * SkeletonCard Component
 *
 * Loading state placeholders that mimic the shape of actual content.
 * Uses a shimmer effect for premium loading UX per ROADMAP specs.
 *
 * Design Philosophy:
 * - Skeletons should match the exact layout of the content they replace
 * - Shimmer animation makes loading feel faster and more intentional
 * - Content "fades in" from skeleton (handled by parent component)
 *
 * @example
 * // Single manager card skeleton
 * <SkeletonCard variant="manager-card" />
 *
 * // Multiple skeletons for a grid
 * <SkeletonCard variant="manager-card" count={6} />
 *
 * // Table rows
 * <SkeletonCard variant="table-row" count={10} />
 */

// Base skeleton shimmer animation
const shimmerClass =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

// Individual skeleton element
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-md bg-muted', shimmerClass, className)}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

// Manager card skeleton - matches ManagerCard layout
const ManagerCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
    {/* Avatar */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    {/* Stats row */}
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
);

// Stat badge skeleton
const StatBadgeSkeleton = () => (
  <Skeleton className="h-6 w-20 rounded-md" />
);

// Rivalry card skeleton - matches RivalryCard layout
const RivalryCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-center justify-between">
      {/* Left member */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Record */}
      <Skeleton className="h-8 w-16" />
      {/* Right member */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-3 w-24 mx-auto mt-2" />
  </div>
);

// Season card skeleton
const SeasonCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-5 w-24" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-20" />
    </div>
  </div>
);

// Table row skeleton
const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 py-3 px-4 border-b border-border">
    <Skeleton className="h-4 w-8" />
    <Skeleton className="h-8 w-8 rounded-full" />
    <Skeleton className="h-4 w-32 flex-1" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-12" />
  </div>
);

// Variant map
const variantComponents: Record<SkeletonCardProps['variant'], React.FC> = {
  'manager-card': ManagerCardSkeleton,
  'stat-badge': StatBadgeSkeleton,
  'rivalry-card': RivalryCardSkeleton,
  'season-card': SeasonCardSkeleton,
  'table-row': TableRowSkeleton,
};

export interface SkeletonCardComponentProps extends SkeletonCardProps {
  className?: string;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardComponentProps>(
  ({ variant, count = 1, className }, ref) => {
    const SkeletonComponent = variantComponents[variant];

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonComponent key={index} />
        ))}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

export { SkeletonCard, Skeleton };
