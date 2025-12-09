'use client';

import { cn } from '@/lib/utils';

/**
 * Skeleton for a single writeup card
 */
export function WriteupCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 animate-pulse',
        className
      )}
    >
      {/* Header: Type badge + date */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-20 rounded-full bg-secondary" />
        <div className="flex-1" />
        <div className="h-4 w-12 rounded bg-secondary" />
      </div>

      {/* Title */}
      <div className="h-5 w-3/4 rounded bg-secondary mb-2" />

      {/* Excerpt lines */}
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full rounded bg-secondary" />
        <div className="h-3 w-5/6 rounded bg-secondary" />
      </div>

      {/* Footer: Author */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-secondary" />
        <div className="h-3 w-16 rounded bg-secondary" />
      </div>
    </div>
  );
}

/**
 * Skeleton for writeup list item
 */
export function WriteupListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border/50 last:border-0 animate-pulse">
      <div className="h-4 w-4 rounded bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-secondary" />
        <div className="h-3 w-24 rounded bg-secondary" />
      </div>
      <div className="h-4 w-4 rounded bg-secondary" />
    </div>
  );
}

/**
 * Skeleton for season accordion item
 */
export function SeasonAccordionSkeleton() {
  return (
    <div className="rounded-lg border bg-card/50 overflow-hidden animate-pulse">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Year icon */}
        <div className="p-2 rounded-lg bg-secondary">
          <div className="h-5 w-5" />
        </div>

        {/* Year and count */}
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-secondary" />
          <div className="h-3 w-20 rounded bg-secondary" />
        </div>

        {/* Chevron */}
        <div className="h-4 w-4 rounded bg-secondary" />
      </div>
    </div>
  );
}

/**
 * Full page skeleton for writeups
 */
export function WriteupsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats bar skeleton */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border animate-pulse">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-secondary" />
          <div className="h-6 w-12 rounded bg-secondary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-secondary" />
          <div className="h-6 w-12 rounded bg-secondary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded bg-secondary" />
          <div className="h-6 w-16 rounded bg-secondary" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 rounded-lg bg-card border animate-pulse" />

      {/* Season accordions skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <SeasonAccordionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for writeup detail drawer/modal
 */
export function WriteupDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 rounded-full bg-secondary" />
          <div className="h-4 w-16 rounded bg-secondary" />
        </div>
        <div className="h-8 w-full rounded bg-secondary" />
        <div className="h-4 w-1/3 rounded bg-secondary" />
      </div>

      {/* Content lines */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-4 rounded bg-secondary"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>

      {/* Author footer */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <div className="h-10 w-10 rounded-full bg-secondary" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-3 w-32 rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}
