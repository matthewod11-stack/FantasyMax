'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

export function RefreshDataButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleRefresh = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/admin/refresh-views', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`Refreshed: ${data.refreshed?.join(', ') || 'views'}`);
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to refresh');
      }
    } catch {
      setStatus('error');
      setMessage('Network error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={status === 'error' ? 'destructive' : status === 'success' ? 'default' : 'outline'}
        size="sm"
        onClick={handleRefresh}
        disabled={status === 'loading'}
      >
        {status === 'loading' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
        {status === 'success' && <Check className="h-4 w-4 mr-2" />}
        {status === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
        {status === 'idle' && <RefreshCw className="h-4 w-4 mr-2" />}
        {status === 'loading' ? 'Refreshing...' : 'Refresh Data'}
      </Button>
      {message && (
        <span className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
