'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getToiletTrophyUrl, hasToiletTrophy } from '@/lib/utils/trophy-map';
import { Skull, Toilet } from 'lucide-react';

interface ToiletTrophyImageProps {
  year: number;
  memberName: string;
  className?: string;
  /**
   * Size variant for the image
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show year badge overlay
   */
  showYearBadge?: boolean;
}

const sizeConfig = {
  sm: { width: 120, height: 120, iconSize: 'h-8 w-8' },
  md: { width: 200, height: 200, iconSize: 'h-12 w-12' },
  lg: { width: 300, height: 300, iconSize: 'h-16 w-16' },
};

/**
 * ToiletTrophyImage - Display AI-generated "toilet trophy" images
 *
 * Shows the humorous AI-generated images of last-place finishers
 * being flushed down a golden toilet trophy. Falls back to a
 * placeholder icon for years without images.
 */
export function ToiletTrophyImage({
  year,
  memberName,
  className,
  size = 'md',
  showYearBadge = true,
}: ToiletTrophyImageProps) {
  const [imageError, setImageError] = useState(false);
  const trophyUrl = getToiletTrophyUrl(year);
  const hasTrophy = hasToiletTrophy(year) && !imageError;
  const config = sizeConfig[size];

  // Fallback placeholder for years without images
  if (!hasTrophy) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          'bg-gradient-to-br from-muted/50 to-muted/30',
          'border-2 border-dashed border-muted-foreground/20',
          className
        )}
        style={{ width: config.width, height: config.height }}
        title={`No trophy image available for ${year}`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <Toilet className={config.iconSize} />
          <span className="text-xs font-mono">{year}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'ring-2 ring-loss/20 hover:ring-loss/40 transition-all duration-300',
        'shadow-lg hover:shadow-xl',
        className
      )}
      style={{ width: config.width, height: config.height }}
    >
      <Image
        src={trophyUrl!}
        alt={`${memberName}'s Toilet Trophy - ${year}`}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
      />

      {/* Year badge overlay */}
      {showYearBadge && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full">
          <Skull className="h-3 w-3 text-loss" />
          <span className="text-xs font-mono text-white">{year}</span>
        </div>
      )}

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
