'use client';

/**
 * AI Progress Comparison Component
 *
 * Displays AI-generated treatment progress comparison results.
 */

import { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import type { ProgressComparisonResult } from '@/hooks/use-image-ai';

// =============================================================================
// Types
// =============================================================================

interface AIProgressComparisonProps {
  result?: ProgressComparisonResult;
  isLoading?: boolean;
  onCompare?: () => void;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AIProgressComparison({
  result,
  isLoading,
  onCompare,
  beforeImageUrl,
  afterImageUrl,
}: AIProgressComparisonProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getChangeIcon = (type: 'improvement' | 'regression' | 'neutral') => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'regression':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOverallChangeBadge = (change: string) => {
    switch (change) {
      case 'significant':
        return <Badge variant="success">Significant Progress</Badge>;
      case 'moderate':
        return <Badge variant="info">Moderate Progress</Badge>;
      case 'minimal':
        return <Badge variant="warning">Minimal Change</Badge>;
      default:
        return <Badge variant="outline">No Change</Badge>;
    }
  };

  if (!result && !isLoading) {
    return (
      <Card variant="ghost">
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Compare before/after images with AI
          </p>
          {onCompare && beforeImageUrl && afterImageUrl && (
            <Button variant="outline" size="sm" onClick={onCompare}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Progress
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="ghost">
        <CardContent className="py-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">
            Analyzing treatment progress...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card variant="ghost">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader compact className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle size="sm">AI Progress Analysis</CardTitle>
              {getOverallChangeBadge(result.overallChange)}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm">{result.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(result.confidence * 100)}%
              </p>
            </div>

            {/* Changes */}
            {result.changes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Detected Changes</p>
                <div className="space-y-2">
                  {result.changes.map((change, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-2 rounded-lg border flex items-start gap-2',
                        change.type === 'improvement' && 'bg-green-50 border-green-200',
                        change.type === 'regression' && 'bg-red-50 border-red-200',
                        change.type === 'neutral' && 'bg-gray-50 border-gray-200'
                      )}
                    >
                      {getChangeIcon(change.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{change.area}</p>
                        <p className="text-xs text-muted-foreground">
                          {change.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(change.significance * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Talking Points */}
            {result.talkingPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Suggested Talking Points</p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground pl-4">
                  {result.talkingPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
