'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import type { ManagerAvatarProps } from '@/types/contracts/components';

/**
 * ManagerAvatar Component
 *
 * Displays a manager's avatar with fallback to initials.
 * Includes optional championship ring indicator (gold glow).
 *
 * @example
 * <ManagerAvatar
 *   avatarUrl={member.avatar_url}
 *   displayName={member.display_name}
 *   size="lg"
 *   showChampionRing
 * />
 */

const sizeClasses: Record<ManagerAvatarProps['size'], string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

/**
 * Extract initials from display name
 * "John Smith" -> "JS", "Mike" -> "M"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export interface ManagerAvatarComponentProps extends ManagerAvatarProps {
  className?: string;
}

const ManagerAvatar = React.forwardRef<HTMLSpanElement, ManagerAvatarComponentProps>(
  ({ avatarUrl, displayName, size, showChampionRing = false, className }, ref) => {
    const initials = getInitials(displayName);

    return (
      <Avatar
        ref={ref}
        className={cn(
          sizeClasses[size],
          // Championship ring glow
          showChampionRing && 'ring-2 ring-gold ring-offset-2 ring-offset-background glow-gold',
          className
        )}
      >
        {avatarUrl && (
          <AvatarImage src={avatarUrl} alt={displayName} />
        )}
        <AvatarFallback
          className={cn(
            'bg-secondary text-secondary-foreground font-display',
            showChampionRing && 'bg-gold/20 text-gold'
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }
);

ManagerAvatar.displayName = 'ManagerAvatar';

export { ManagerAvatar, getInitials };
