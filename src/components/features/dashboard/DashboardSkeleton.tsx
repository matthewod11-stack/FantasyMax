'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        className
      )}
    />
  );
}

function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shimmer className="h-5 w-5 rounded" />
          <Shimmer className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Shimmer className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
        <Shimmer className="h-20 w-full rounded-lg" />
        <Shimmer className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

function NextOpponentSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shimmer className="h-5 w-5 rounded" />
          <Shimmer className="h-5 w-36" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Shimmer className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-5 w-32" />
            <Shimmer className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <Shimmer className="h-3 w-24" />
          <div className="flex items-center justify-between">
            <Shimmer className="h-8 w-16" />
            <div className="flex gap-1">
              <Shimmer className="h-6 w-6 rounded" />
              <Shimmer className="h-6 w-6 rounded" />
              <Shimmer className="h-6 w-6 rounded" />
            </div>
          </div>
        </div>
        <Shimmer className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-5 rounded" />
            <Shimmer className="h-5 w-36" />
          </div>
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shimmer className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Shimmer className="h-5 w-12 rounded" />
                <Shimmer className="h-5 w-20" />
              </div>
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-8 w-28 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

function TrophyCaseSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shimmer className="h-5 w-5 rounded" />
          <Shimmer className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Shimmer className="h-3 w-24 mb-2" />
          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8 rounded" />
            <Shimmer className="h-8 w-12" />
            <div className="flex gap-1">
              <Shimmer className="h-5 w-12 rounded-full" />
              <Shimmer className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-14 w-full rounded-lg" />
          <Shimmer className="h-14 w-full rounded-lg" />
        </div>
        <div className="pt-2 border-t">
          <Shimmer className="h-3 w-28 mb-2" />
          <div className="grid grid-cols-2 gap-3">
            <Shimmer className="h-12 w-full rounded" />
            <Shimmer className="h-12 w-full rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RivalryTrackerSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-5 rounded" />
            <Shimmer className="h-5 w-28" />
          </div>
          <Shimmer className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg border border-muted p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-muted p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Shimmer className="h-8 w-64" />
        <Shimmer className="h-4 w-96" />
      </div>

      {/* Widgets grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <NextOpponentSkeleton />
        <TrophyCaseSkeleton />
        <HistorySkeleton />
        <RivalryTrackerSkeleton />
      </div>
    </div>
  );
}
