'use client';

/**
 * AI Status Indicator
 *
 * Small indicator showing AI availability status.
 */

import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useImageAI, type AIHealthStatus } from '@/hooks/use-image-ai';

// =============================================================================
// Types
// =============================================================================

interface AIStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  showFeatures?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AIStatusIndicator({
  className,
  showLabel = false,
  showFeatures = false,
}: AIStatusIndicatorProps) {
  const { checkHealth } = useImageAI();
  const [status, setStatus] = useState<AIHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      setIsLoading(true);
      const health = await checkHealth();
      if (mounted) {
        setStatus(health);
        setIsLoading(false);
      }
    }

    fetchStatus();

    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkHealth]);

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {showLabel && <span>Checking AI...</span>}
      </Badge>
    );
  }

  if (!status) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn('gap-1 opacity-50', className)}>
              <XCircle className="h-3 w-3" />
              {showLabel && <span>AI Unavailable</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unable to check AI status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!status.available) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn('gap-1 opacity-50', className)}>
              <XCircle className="h-3 w-3" />
              {showLabel && <span>AI Offline</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">AI Service Unavailable</p>
            <p className="text-xs text-muted-foreground">
              {status.provider.message}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const enabledFeatures = Object.entries(status.features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="success" className={cn('gap-1', className)}>
            <Sparkles className="h-3 w-3" />
            {showLabel && <span>AI Ready</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">{status.provider.name} Connected</span>
            </div>
            {status.provider.latency && (
              <p className="text-xs text-muted-foreground">
                Latency: {status.provider.latency}ms
              </p>
            )}
            {showFeatures && enabledFeatures.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium mb-1">Enabled Features:</p>
                <div className="flex flex-wrap gap-1">
                  {enabledFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" size="sm">
                      {formatFeatureName(feature)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper to format feature names
function formatFeatureName(name: string): string {
  const labels: Record<string, string> = {
    qualityScoring: 'Quality Scoring',
    autoCategorization: 'Auto-Categorization',
    cephDetection: 'Ceph Landmarks',
    imageAnalysis: 'Image Analysis',
  };
  return labels[name] || name;
}
