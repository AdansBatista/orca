'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowLeft,
  Maximize2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { FloorPlanView } from '@/components/ops/FloorPlanView';

export default function FloorPlanPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <>
      <PageHeader
        title="Floor Plan"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Operations', href: '/ops' },
          { label: 'Floor Plan' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ops">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ops
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              title="Refresh now"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <FloorPlanView key={refreshKey} onRefresh={handleRefresh} />
      </PageContent>
    </>
  );
}
