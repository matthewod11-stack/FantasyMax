'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { StatBadgeProps } from '@/types/contracts/components';

/**
 * StatBadge Component
 *
 * A compact badge for displaying stats throughout FantasyMax.
 * Uses the design system's typography and semantic colors.
 *
 * @example
 * // Basic usage
 * <StatBadge label="Wins" value={42} />
 *
 * // Win variant with icon
 * <StatBadge label="Record" value="10-4" variant="win" icon={<TrophyIcon />} />
 *
 * // Championship highlight
 * <StatBadge label="Championships" value={2} variant="championship" size="lg" />
 */

const statBadgeVariants = cva(
  // Base styles
  'inline-flex items-center gap-1.5 rounded-md font-mono transition-all',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        win: 'bg-win/10 text-win border border-win/20',
        loss: 'bg-loss/10 text-loss border border-loss/20',
        championship: 'bg-gold/10 text-gold border border-gold/20 glow-gold',
        highlight: 'bg-primary/10 text-primary border border-primary/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface StatBadgeComponentProps
  extends Omit<StatBadgeProps, 'size'>,
    VariantProps<typeof statBadgeVariants> {
  className?: string;
}

const StatBadge = React.forwardRef<HTMLDivElement, StatBadgeComponentProps>(
  ({ className, variant, size, label, value, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-muted-foreground font-body text-[0.65em] uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono font-medium tabular-nums">{value}</span>
      </div>
    );
  }
);

StatBadge.displayName = 'StatBadge';

export { StatBadge, statBadgeVariants };
