'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowLeft,
  Settings,
  Maximize2,
  Grid,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { FloorPlanView } from '@/components/ops/FloorPlanView';
import { toast } from 'sonner';

export default function FloorPlanPage() {
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
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
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable" className="h-[calc(100vh-120px)]">
        <FloorPlanView key={refreshKey} onRefresh={handleRefresh} />
      </PageContent>
    </>
  );
}
