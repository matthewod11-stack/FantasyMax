import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ManagerCardSkeletonProps {
  variant: 'grid' | 'list';
  count?: number;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded',
        className
      )}
    />
  );
}

function GridSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <Shimmer className="h-20 w-20 rounded-full mb-4" />
          {/* Name */}
          <Shimmer className="h-5 w-28 mb-2" />
          {/* Trophies */}
          <Shimmer className="h-4 w-16 mb-3" />
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-3 border-t">
            <div className="flex flex-col items-center">
              <Shimmer className="h-8 w-16 mb-1" />
              <Shimmer className="h-3 w-20" />
            </div>
            <div className="flex flex-col items-center">
              <Shimmer className="h-8 w-12 mb-1" />
              <Shimmer className="h-3 w-14" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Shimmer className="h-14 w-14 rounded-full" />
          {/* Name and subtitle */}
          <div className="flex-1">
            <Shimmer className="h-5 w-32 mb-2" />
            <Shimmer className="h-3 w-20" />
          </div>
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <Shimmer className="h-5 w-14 mb-1" />
              <Shimmer className="h-3 w-10" />
            </div>
            <div className="text-right">
              <Shimmer className="h-5 w-12 mb-1" />
              <Shimmer className="h-3 w-10" />
            </div>
            <Shimmer className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ManagerCardSkeleton({ variant, count = 6 }: ManagerCardSkeletonProps) {
  const SkeletonComponent = variant === 'grid' ? GridSkeleton : ListSkeleton;

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
