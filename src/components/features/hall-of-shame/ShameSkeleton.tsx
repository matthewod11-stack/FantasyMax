import { Skeleton } from '@/components/ui/skeleton-card';

/**
 * ShameSkeleton - Loading state for Hall of Shame page
 */
export function ShameSkeleton() {
  return (
    <div className="space-y-8">
      {/* Featured inductee skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="max-w-md">
          <div className="relative overflow-hidden rounded-xl border-2 border-muted p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Season inductees skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="space-y-6">
          {[...Array(2)].map((_, decade) => (
            <div key={decade} className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border-2 border-muted p-5">
                    <Skeleton className="h-5 w-16 rounded-full mb-4" />
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
