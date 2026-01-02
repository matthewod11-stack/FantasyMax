'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';

/**
 * DetailModal Component
 *
 * A centered modal for in-context drilldowns (H2H details, records, manager profiles, etc.)
 * Built on shadcn/ui Dialog with FantasyMax styling.
 *
 * Design Philosophy:
 * "Context over navigation - Keep users in flow with modals instead of page jumps"
 *
 * Features:
 * - Centered with fade + scale animation
 * - Fixed max-height (80vh) with internal scrolling
 * - Multiple size variants
 * - Keyboard accessible (Escape to close)
 * - Focus trap for accessibility
 * - Dark overlay preserves context
 *
 * @example
 * <DetailModal
 *   isOpen={showH2H}
 *   onClose={() => setShowH2H(false)}
 *   title="Head-to-Head: Mike vs John"
 *   size="md"
 * >
 *   <MatchupHistory matchups={matchups} />
 * </DetailModal>
 */

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'sm:max-w-sm', // ~384px
  md: 'sm:max-w-md', // ~448px
  lg: 'sm:max-w-lg', // ~512px
  xl: 'sm:max-w-xl', // ~576px
};

export interface DetailModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional description shown below title */
  description?: string;
  /** Additional class names for the content area */
  className?: string;
  /** Additional class names for the body/children wrapper */
  bodyClassName?: string;
}

const DetailModal = React.forwardRef<HTMLDivElement, DetailModalProps>(
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
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          ref={ref}
          className={cn(
            // Override default max-width with our size variant
            'w-full',
            sizeClasses[size],
            // Fixed max-height with flex layout for scrolling
            'max-h-[80vh] flex flex-col',
            // FantasyMax dark theme styling
            'bg-card border-border',
            // Remove default padding - we'll handle it in sections
            'p-0',
            className
          )}
        >
          <DialogHeader className="flex-shrink-0 border-b border-border p-6 pb-4">
            <DialogTitle className="text-display-md text-foreground pr-8">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Scrollable content area */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-6 pt-4',
              // Custom scrollbar for dark theme
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted',
              bodyClassName
            )}
          >
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

DetailModal.displayName = 'DetailModal';

export { DetailModal };
