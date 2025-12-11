'use client';

import { useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type {
  CalculatedMeasurement,
  MeasurementCategory,
  PlacedLandmark,
  CephAnalysisPreset,
} from './types';
import {
  CEPH_MEASUREMENTS,
  getMeasurementById,
  getRequiredLandmarks,
  canCalculateMeasurement,
  CEPH_LANDMARKS,
  getLandmarkById,
} from './types';

interface CephMeasurementsPanelProps {
  measurements: CalculatedMeasurement[];
  placedLandmarks: PlacedLandmark[];
  preset: CephAnalysisPreset | null;
  onLandmarkClick?: (landmarkId: string) => void;
}

const CATEGORY_LABELS: Record<MeasurementCategory, string> = {
  SKELETAL_SAGITTAL: 'Skeletal (Sagittal)',
  SKELETAL_VERTICAL: 'Skeletal (Vertical)',
  DENTAL: 'Dental',
  SOFT_TISSUE: 'Soft Tissue',
  AIRWAY: 'Airway',
};

const CATEGORY_ORDER: MeasurementCategory[] = [
  'SKELETAL_SAGITTAL',
  'SKELETAL_VERTICAL',
  'DENTAL',
  'SOFT_TISSUE',
  'AIRWAY',
];

function DeviationIndicator({ deviation }: { deviation: number }) {
  const absDeviation = Math.abs(deviation);

  if (absDeviation <= 1) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <CheckCircle2 className="h-4 w-4 text-success-500" />
        </TooltipTrigger>
        <TooltipContent>Within normal range</TooltipContent>
      </Tooltip>
    );
  } else if (absDeviation <= 2) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <MinusCircle className="h-4 w-4 text-warning-500" />
        </TooltipTrigger>
        <TooltipContent>Mild deviation ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)} SD)</TooltipContent>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AlertCircle className="h-4 w-4 text-error-500" />
        </TooltipTrigger>
        <TooltipContent>Significant deviation ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)} SD)</TooltipContent>
      </Tooltip>
    );
  }
}

function MeasurementRow({
  measurement,
  calculatedValue,
}: {
  measurement: (typeof CEPH_MEASUREMENTS)[0];
  calculatedValue?: CalculatedMeasurement;
}) {
  const isCalculated = !!calculatedValue;
  const norm = measurement.normative;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        isCalculated ? 'bg-muted/30' : 'opacity-50'
      )}
    >
      {/* Measurement Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {measurement.abbreviation}
          </span>
          <span className="text-sm font-medium truncate">
            {measurement.name}
          </span>
        </div>
        {isCalculated && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {calculatedValue.interpretation}
          </p>
        )}
      </div>

      {/* Value */}
      <div className="flex items-center gap-2">
        {isCalculated ? (
          <>
            <span className="font-mono text-sm font-medium">
              {calculatedValue.value.toFixed(1)}
              {measurement.unit}
            </span>
            <DeviationIndicator deviation={calculatedValue.deviation} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Norm: {norm.mean}{measurement.unit}
          </span>
        )}
      </div>
    </div>
  );
}

function LandmarkProgress({
  preset,
  placedLandmarks,
  onLandmarkClick,
}: {
  preset: CephAnalysisPreset | null;
  placedLandmarks: PlacedLandmark[];
  onLandmarkClick?: (landmarkId: string) => void;
}) {
  const requiredLandmarks = preset
    ? getRequiredLandmarks(preset.id)
    : CEPH_LANDMARKS.filter((l) => l.isRequired);

  const placedIds = new Set(placedLandmarks.map((l) => l.landmarkId));
  const placedCount = requiredLandmarks.filter((l) => placedIds.has(l.id)).length;
  const progress = (placedCount / requiredLandmarks.length) * 100;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Landmark Progress</span>
          <Badge variant={progress === 100 ? 'success' : 'secondary'}>
            {placedCount} / {requiredLandmarks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-2 mb-3" />

        <div className="flex flex-wrap gap-1">
          {requiredLandmarks.map((landmark) => {
            const isPlaced = placedIds.has(landmark.id);
            return (
              <Tooltip key={landmark.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onLandmarkClick?.(landmark.id)}
                    className={cn(
                      'px-1.5 py-0.5 text-xs font-mono rounded transition-colors',
                      isPlaced
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {landmark.abbreviation}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{landmark.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {landmark.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CephMeasurementsPanel({
  measurements,
  placedLandmarks,
  preset,
  onLandmarkClick,
}: CephMeasurementsPanelProps) {
  // Group measurements by category
  const groupedMeasurements = useMemo(() => {
    const presetMeasurementIds = preset?.measurements || [];
    const relevantMeasurements = presetMeasurementIds.length > 0
      ? CEPH_MEASUREMENTS.filter((m) => presetMeasurementIds.includes(m.id))
      : CEPH_MEASUREMENTS;

    const groups: Record<MeasurementCategory, typeof CEPH_MEASUREMENTS> = {
      SKELETAL_SAGITTAL: [],
      SKELETAL_VERTICAL: [],
      DENTAL: [],
      SOFT_TISSUE: [],
      AIRWAY: [],
    };

    for (const m of relevantMeasurements) {
      groups[m.category].push(m);
    }

    return groups;
  }, [preset]);

  // Map calculated values by ID
  const measurementMap = useMemo(() => {
    const map = new Map<string, CalculatedMeasurement>();
    for (const m of measurements) {
      map.set(m.measurementId, m);
    }
    return map;
  }, [measurements]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <LandmarkProgress
          preset={preset}
          placedLandmarks={placedLandmarks}
          onLandmarkClick={onLandmarkClick}
        />

        {CATEGORY_ORDER.map((category) => {
          const categoryMeasurements = groupedMeasurements[category];
          if (categoryMeasurements.length === 0) return null;

          const calculatedCount = categoryMeasurements.filter((m) =>
            measurementMap.has(m.id)
          ).length;

          return (
            <Collapsible key={category} defaultOpen>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                        <span>{CATEGORY_LABELS[category]}</span>
                      </div>
                      <Badge variant="outline">
                        {calculatedCount} / {categoryMeasurements.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {categoryMeasurements.map((measurement) => (
                        <MeasurementRow
                          key={measurement.id}
                          measurement={measurement}
                          calculatedValue={measurementMap.get(measurement.id)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Summary */}
        {measurements.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {/* Skeletal Pattern */}
                {measurementMap.has('ANB') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Skeletal Pattern:
                    </span>
                    <span className="font-medium">
                      {getSkeletalPattern(measurementMap.get('ANB')!.value)}
                    </span>
                  </div>
                )}

                {/* Growth Pattern */}
                {measurementMap.has('FMA') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Growth Pattern:
                    </span>
                    <span className="font-medium">
                      {getGrowthPattern(measurementMap.get('FMA')!.value)}
                    </span>
                  </div>
                )}

                {/* Incisor Position */}
                {measurementMap.has('U1_SN') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Upper Incisors:
                    </span>
                    <span className="font-medium">
                      {getIncisorPosition(measurementMap.get('U1_SN')!.value)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// Helper functions for summary
function getSkeletalPattern(anb: number): string {
  if (anb < 0) return 'Class III';
  if (anb > 4) return 'Class II';
  return 'Class I';
}

function getGrowthPattern(fma: number): string {
  if (fma < 20) return 'Horizontal';
  if (fma > 30) return 'Vertical';
  return 'Normal';
}

function getIncisorPosition(u1sn: number): string {
  if (u1sn < 97) return 'Retroclined';
  if (u1sn > 111) return 'Proclined';
  return 'Normal';
}
