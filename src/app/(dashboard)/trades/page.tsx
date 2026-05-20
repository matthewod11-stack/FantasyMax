import { getTradeTimeline, getTradeCount } from '@/lib/supabase/queries/trades';
import { TradesTimeline } from '@/components/features/trades/TradesTimeline';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight } from 'lucide-react';

export const metadata = {
  title: 'Trades | League of Degenerates',
  description: 'League trade history timeline',
};

export default async function TradesPage() {
  const [trades, count] = await Promise.all([getTradeTimeline({ limit: 100 }), getTradeCount()]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          Trade History
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{count} trades on record</Badge>
          {count === 0 && (
            <span className="text-sm text-muted-foreground">
              Run Yahoo sync from admin to import trades
            </span>
          )}
        </div>
      </div>

      <TradesTimeline trades={trades} />
    </div>
  );
}
