'use client';

import { Skeleton } from '@/components/ui/skeleton-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SeasonSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Highlights skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <HighlightCardSkeleton />
        <HighlightCardSkeleton />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Content skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 flex-1 max-w-[200px]" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JourneyChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <div className="flex flex-wrap gap-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>
    </div>
  );
}

export function BracketSkeleton() {
  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {[1, 2, 3].map((round) => (
        <div key={round} className="flex flex-col gap-8">
          <Skeleton className="h-5 w-24 mx-auto" />
          {[...Array(Math.pow(2, 3 - round))].map((_, i) => (
            <Skeleton key={i} className="h-24 w-[200px] rounded-lg" />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
  );
}
