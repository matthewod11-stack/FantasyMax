import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountUp } from '@/hooks/use-count-up';

describe('useCountUp', () => {
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  const runAnimationFrame = (timestamp: number) => {
    const callbacks = Array.from(frameCallbacks.values());
    frameCallbacks.clear();
    callbacks.forEach((callback) => callback(timestamp));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    frameCallbacks = new Map();
    nextFrameId = 1;

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frameCallbacks.set(frameId, callback);
        return frameId;
      })
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((frameId: number) => {
        frameCallbacks.delete(frameId);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows the new start value while a delayed rerun is waiting', () => {
    const { result, rerender } = renderHook(
      ({
        delay,
        duration,
        end,
        start,
      }: {
        delay: number;
        duration: number;
        end: number;
        start: number;
      }) => useCountUp(end, { delay, duration, start }),
      {
        initialProps: {
          delay: 0,
          duration: 1000,
          end: 100,
          start: 0,
        },
      }
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => {
      runAnimationFrame(100);
    });
    act(() => {
      runAnimationFrame(600);
    });

    expect(result.current).toBeGreaterThan(0);

    rerender({
      delay: 1000,
      duration: 1000,
      end: 200,
      start: 50,
    });

    expect(result.current).toBe(50);

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(result.current).toBe(50);
  });
});
