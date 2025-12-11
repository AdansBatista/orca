'use client';

/**
 * AI Cephalometric Landmarks Component
 *
 * Displays AI-detected cephalometric landmarks with confidence indicators.
 */

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Ruler,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { CephLandmarkResult } from '@/hooks/use-image-ai';

// =============================================================================
// Types
// =============================================================================

interface AICephLandmarksProps {
  result?: CephLandmarkResult;
  isLoading?: boolean;
  onDetect?: () => void;
  onApplyLandmarks?: (landmarks: CephLandmarkResult['landmarks']) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AICephLandmarks({
  result,
  isLoading,
  onDetect,
  onApplyLandmarks,
}: AICephLandmarksProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAllLandmarks, setShowAllLandmarks] = useState(false);

  const getLandmarkConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLandmarkConfidenceIcon = (confidence: number, needsVerification: boolean) => {
    if (needsVerification) {
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    }
    if (confidence >= 0.8) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    if (confidence >= 0.6) {
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    }
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  if (!result && !isLoading) {
    return (
      <Card variant="ghost">
        <CardContent className="py-6 text-center">
          <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Detect cephalometric landmarks with AI
          </p>
          {onDetect && (
            <Button variant="outline" size="sm" onClick={onDetect}>
              <Sparkles className="h-4 w-4 mr-2" />
              Detect Landmarks
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
            Detecting cephalometric landmarks...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This may take a few seconds
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const landmarksToShow = showAllLandmarks
    ? result.landmarks
    : result.landmarks.slice(0, 6);

  const highConfidenceLandmarks = result.landmarks.filter(l => l.confidence >= 0.8).length;
  const lowConfidenceLandmarks = result.landmarks.filter(l => l.confidence < 0.6).length;

  return (
    <Card variant="ghost">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader compact className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle size="sm">AI Landmark Detection</CardTitle>
              {result.analysisReady ? (
                <Badge variant="success" size="sm">Ready for Analysis</Badge>
              ) : (
                <Badge variant="warning" size="sm">Needs Review</Badge>
              )}
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
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{result.landmarks.length}</span>
                <span className="text-muted-foreground"> landmarks detected</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  {highConfidenceLandmarks} high
                </span>
                {lowConfidenceLandmarks > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {lowConfidenceLandmarks} low
                  </span>
                )}
              </div>
            </div>

            {/* Overall Confidence */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Overall Confidence</span>
                <span>{Math.round(result.overallConfidence * 100)}%</span>
              </div>
              <Progress value={result.overallConfidence * 100} className="h-1.5" />
            </div>

            {/* Calibration */}
            {result.calibration && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="font-medium">{result.calibration.reference}</span>
                  <span className="text-muted-foreground">
                    {' '}• {result.calibration.pixelsPerMm.toFixed(2)} px/mm
                  </span>
                </div>
              </div>
            )}

            {/* Landmarks List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Detected Landmarks</p>
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-2">
                  {landmarksToShow.map((landmark) => (
                    <Tooltip key={landmark.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'p-2 rounded-lg border text-sm flex items-center justify-between',
                            landmark.needsVerification && 'border-yellow-300 bg-yellow-50',
                            landmark.confidence < 0.6 && 'border-red-300 bg-red-50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getLandmarkConfidenceIcon(
                              landmark.confidence,
                              landmark.needsVerification
                            )}
                            <span className="font-medium">{landmark.id}</span>
                          </div>
                          <span
                            className={cn(
                              'text-xs',
                              getLandmarkConfidenceColor(landmark.confidence)
                            )}
                          >
                            {Math.round(landmark.confidence * 100)}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{landmark.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Position: ({landmark.x.toFixed(3)}, {landmark.y.toFixed(3)})
                        </p>
                        {landmark.needsVerification && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Manual verification recommended
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>

              {result.landmarks.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAllLandmarks(!showAllLandmarks)}
                >
                  {showAllLandmarks ? 'Show Less' : `Show All (${result.landmarks.length})`}
                </Button>
              )}
            </div>

            {/* Missing Landmarks */}
            {result.missingLandmarks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Missing Landmarks</p>
                <div className="flex flex-wrap gap-1">
                  {result.missingLandmarks.map((id) => (
                    <Badge key={id} variant="destructive" size="sm">
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Landmarks Needing Review */}
            {result.landmarksNeedingReview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-600">Needs Review</p>
                <div className="flex flex-wrap gap-1">
                  {result.landmarksNeedingReview.map((id) => (
                    <Badge key={id} variant="warning" size="sm">
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            {onApplyLandmarks && result.landmarks.length > 0 && (
              <Button
                className="w-full"
                onClick={() => onApplyLandmarks(result.landmarks)}
              >
                <Target className="h-4 w-4 mr-2" />
                Apply Landmarks to Analysis
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
