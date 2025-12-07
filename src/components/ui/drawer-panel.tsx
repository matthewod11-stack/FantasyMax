'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './sheet';
import type { DrawerPanelProps } from '@/types/contracts/components';

/**
 * DrawerPanel Component
 *
 * A side drawer for in-context drilldowns (H2H details, manager profiles, etc.)
 * Built on shadcn/ui Sheet with FantasyMax styling.
 *
 * Design Philosophy (from ROADMAP.md):
 * "Context over navigation - Keep users in flow with drawers/modals instead of page jumps"
 *
 * Features:
 * - Smooth slide-in animation
 * - Multiple size variants
 * - Keyboard accessible (Escape to close)
 * - Focus trap for accessibility
 * - Dark overlay preserves context
 *
 * @example
 * <DrawerPanel
 *   isOpen={showH2H}
 *   onClose={() => setShowH2H(false)}
 *   title="Head-to-Head: Mike vs John"
 *   size="lg"
 * >
 *   <MatchupHistory matchups={matchups} />
 * </DrawerPanel>
 */

const sizeClasses: Record<NonNullable<DrawerPanelProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export interface DrawerPanelComponentProps extends DrawerPanelProps {
  /** Optional description shown below title */
  description?: string;
  /** Additional class names for the content area */
  className?: string;
  /** Additional class names for the body/children wrapper */
  bodyClassName?: string;
}

const DrawerPanel = React.forwardRef<HTMLDivElement, DrawerPanelComponentProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'md',
      description,
      className,
      bodyClassName,
    },
    ref
  ) => {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          ref={ref}
          side="right"
          className={cn(
            // Override default max-width with our size variant
            'w-full',
            sizeClasses[size],
            // FantasyMax dark theme styling
            'bg-card border-border',
            className
          )}
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-display-md text-foreground">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Scrollable content area */}
          <div
            className={cn(
              'flex-1 overflow-y-auto py-4',
              // Custom scrollbar for dark theme
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted',
              bodyClassName
            )}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

DrawerPanel.displayName = 'DrawerPanel';

export { DrawerPanel };
