'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp Hook
 *
 * Animates a number from 0 (or start) to the target value with easing.
 * Creates a satisfying "counting up" effect for stats and metrics.
 *
 * @param end - Target number to count to
 * @param options - Configuration options
 * @returns Current animated value
 *
 * @example
 * const count = useCountUp(42);
 * return <span>{count}</span>;
 *
 * @example
 * const winPct = useCountUp(0.756, { decimals: 1, suffix: '%', multiplier: 100 });
 * return <span>{winPct}</span>;
 */
interface UseCountUpOptions {
  /** Animation duration in ms (default: 1500) */
  duration?: number;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Starting value (default: 0) */
  start?: number;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Whether to animate (set false to show final value immediately) */
  enabled?: boolean;
}

// Easing function: easeOutExpo - fast start, satisfying deceleration
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
): number {
  const {
    duration = 1500,
    decimals = 0,
    start = 0,
    delay = 0,
    enabled = true,
  } = options;

  const [value, setValue] = useState(enabled ? start : end);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    // Reset on end change
    setValue(start);
    startTimeRef.current = null;

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const currentValue = start + (end - start) * easedProgress;

        setValue(Number(currentValue.toFixed(decimals)));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration, decimals, start, delay, enabled]);

  return value;
}

/**
 * Format a count-up value with optional suffix
 * Useful for percentages, points, etc.
 */
export function formatCountUp(
  value: number,
  options: { suffix?: string; prefix?: string } = {}
): string {
  const { suffix = '', prefix = '' } = options;
  return `${prefix}${value}${suffix}`;
}
