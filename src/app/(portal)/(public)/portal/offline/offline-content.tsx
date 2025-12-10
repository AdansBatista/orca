'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold mb-2">You're offline</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        It looks like you're not connected to the internet. Check your connection and try again.
      </p>

      <Button
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>

      <p className="text-xs text-muted-foreground mt-8">
        Some features may be available offline
      </p>
    </div>
  );
}
