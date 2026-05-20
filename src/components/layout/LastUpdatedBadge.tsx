import { getLatestSyncStatus } from '@/lib/supabase/queries/weekly-digest';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export async function LastUpdatedBadge() {
  const status = await getLatestSyncStatus();

  if (!status.lastSyncAt) return null;

  const formatted = new Date(status.lastSyncAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Badge
      variant={status.isStale ? 'destructive' : 'outline'}
      className="flex items-center gap-1.5 text-xs"
    >
      <Clock className="h-3 w-3" />
      Updated {formatted}
    </Badge>
  );
}
