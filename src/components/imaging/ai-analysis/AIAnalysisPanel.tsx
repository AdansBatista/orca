'use client';

/**
 * AI Analysis Panel
 *
 * Panel component for displaying AI analysis results.
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
  RefreshCw,
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
import { cn } from '@/lib/utils';

import type { ImageQualityResult, ImageCategorizationResult } from '@/hooks/use-image-ai';

// =============================================================================
// Quality Score Display
// =============================================================================

interface QualityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function QualityScore({ score, size = 'md' }: QualityScoreProps) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = () => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold',
        getBgColor(),
        getColor(),
        sizes[size]
      )}
    >
      {score}
    </div>
  );
}

// =============================================================================
// Quality Analysis Panel
// =============================================================================

interface QualityAnalysisPanelProps {
  result: ImageQualityResult;
  onReanalyze?: () => void;
  isLoading?: boolean;
}

export function QualityAnalysisPanel({
  result,
  onReanalyze,
  isLoading,
}: QualityAnalysisPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const metricLabels: Record<string, string> = {
    sharpness: 'Sharpness',
    exposure: 'Exposure',
    contrast: 'Contrast',
    positioning: 'Positioning',
    coverage: 'Coverage',
  };

  return (
    <Card variant="ghost">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader compact className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle size="sm">Quality Analysis</CardTitle>
              {result.diagnosticQuality ? (
                <Badge variant="success" size="sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Diagnostic Quality
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Review Needed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onReanalyze && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReanalyze}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
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
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-4">
              <QualityScore score={result.overallScore} size="lg" />
              <div>
                <p className="text-sm font-medium">Overall Quality Score</p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quality Metrics</p>
              {Object.entries(result.metrics).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{metricLabels[key] || key}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              ))}
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Detected Issues</p>
                <div className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-2 rounded-lg text-sm',
                        issue.severity === 'severe' && 'bg-red-50 border border-red-200',
                        issue.severity === 'moderate' && 'bg-yellow-50 border border-yellow-200',
                        issue.severity === 'minor' && 'bg-blue-50 border border-blue-200'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {issue.severity === 'severe' ? (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        ) : issue.severity === 'moderate' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{issue.description}</p>
                          {issue.suggestion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
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

// =============================================================================
// Categorization Panel
// =============================================================================

interface CategorizationPanelProps {
  result: ImageCategorizationResult;
  onReanalyze?: () => void;
  isLoading?: boolean;
}

export function CategorizationPanel({
  result,
  onReanalyze,
  isLoading,
}: CategorizationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const categoryLabels: Record<string, string> = {
    INTRAORAL_FRONTAL: 'Intraoral Frontal',
    INTRAORAL_LEFT: 'Intraoral Left',
    INTRAORAL_RIGHT: 'Intraoral Right',
    INTRAORAL_UPPER_OCCLUSAL: 'Upper Occlusal',
    INTRAORAL_LOWER_OCCLUSAL: 'Lower Occlusal',
    EXTRAORAL_FRONTAL: 'Extraoral Frontal',
    EXTRAORAL_PROFILE: 'Profile',
    EXTRAORAL_SMILE: 'Smile',
    EXTRAORAL_45_DEGREE: '45° View',
    PANORAMIC_XRAY: 'Panoramic X-ray',
    CEPHALOMETRIC_XRAY: 'Cephalometric X-ray',
    PERIAPICAL_XRAY: 'Periapical X-ray',
    BITEWING_XRAY: 'Bitewing X-ray',
    CBCT: 'CBCT',
    INTRAORAL_SCAN: 'Intraoral Scan',
    FACE_SCAN: 'Face Scan',
    TREATMENT_PROGRESS: 'Treatment Progress',
    APPLIANCE: 'Appliance',
    DOCUMENT: 'Document',
    OTHER: 'Other',
  };

  return (
    <Card variant="ghost">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader compact className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle size="sm">Auto-Categorization</CardTitle>
              <Badge variant="soft-primary" size="sm">
                {categoryLabels[result.category] || result.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onReanalyze && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReanalyze}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
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
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Primary Category */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {categoryLabels[result.category] || result.category}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Alternatives</p>
                <div className="flex flex-wrap gap-2">
                  {result.alternatives.slice(0, 3).map((alt, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {categoryLabels[alt.category] || alt.category}
                      <span className="ml-1 text-muted-foreground">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Characteristics */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Detected Characteristics</p>
              <div className="flex flex-wrap gap-2">
                {result.characteristics.isXray && (
                  <Badge variant="info" size="sm">X-ray</Badge>
                )}
                {result.characteristics.isClinicalPhoto && (
                  <Badge variant="info" size="sm">Clinical Photo</Badge>
                )}
                {result.characteristics.is3DScan && (
                  <Badge variant="info" size="sm">3D Scan</Badge>
                )}
                {result.characteristics.isIntraoral && (
                  <Badge variant="info" size="sm">Intraoral</Badge>
                )}
                {result.characteristics.hasTeeth && (
                  <Badge variant="success" size="sm">Teeth Visible</Badge>
                )}
                {result.characteristics.hasBraces && (
                  <Badge variant="soft-primary" size="sm">Braces</Badge>
                )}
                {result.characteristics.hasRetainer && (
                  <Badge variant="soft-primary" size="sm">Retainer</Badge>
                )}
              </div>
            </div>

            {result.subcategory && (
              <div>
                <p className="text-xs text-muted-foreground">Subcategory</p>
                <p className="text-sm">{result.subcategory}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// =============================================================================
// Combined AI Panel
// =============================================================================

interface AIAnalysisPanelProps {
  qualityResult?: ImageQualityResult;
  categorizationResult?: ImageCategorizationResult;
  isLoading?: boolean;
  onAnalyze?: () => void;
}

export function AIAnalysisPanel({
  qualityResult,
  categorizationResult,
  isLoading,
  onAnalyze,
}: AIAnalysisPanelProps) {
  if (!qualityResult && !categorizationResult && !isLoading) {
    return (
      <Card variant="ghost">
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            No AI analysis available
          </p>
          {onAnalyze && (
            <Button variant="outline" size="sm" onClick={onAnalyze}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Image
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
            Analyzing image with AI...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {qualityResult && (
        <QualityAnalysisPanel result={qualityResult} />
      )}
      {categorizationResult && (
        <CategorizationPanel result={categorizationResult} />
      )}
    </div>
  );
}
