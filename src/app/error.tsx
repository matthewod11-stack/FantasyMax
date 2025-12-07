'use client';

/**
 * Root Error Boundary
 *
 * Catches errors at the app root level.
 * This file follows Next.js App Router conventions.
 */

import { useEffect } from 'react';
import { DefaultErrorFallback } from '@/lib/errors';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console in development
    // In production, this would go to an error tracking service
    console.error('Root error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <DefaultErrorFallback error={error} resetErrorBoundary={reset} />
    </div>
  );
}
