'use client';

import Link from 'next/link';
import { FlaskConical, Clock, Thermometer, Gauge, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { SterilizationCycle, SterilizationCycleType, CycleStatus } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

type CycleWithCounts = SterilizationCycle & {
  _count: {
    loads: number;
    biologicalIndicators: number;
    chemicalIndicators: number;
  };
  autoclave?: {
    id: string;
    name: string;
  } | null;
  isNew?: boolean;
  externalCycleNumber?: number | null;
};

interface CycleCardProps {
  cycle: CycleWithCounts;
}

const cycleTypeLabels: Record<SterilizationCycleType, string> = {
  STEAM_GRAVITY: 'Steam Gravity',
  STEAM_PREVACUUM: 'Steam Pre-Vacuum',
  STEAM_FLASH: 'Flash/Immediate',
  CHEMICAL: 'Chemical',
  DRY_HEAT: 'Dry Heat',
  VALIDATION: 'Validation',
};

const cycleTypeColors: Record<SterilizationCycleType, 'default' | 'info' | 'warning' | 'success' | 'accent' | 'secondary'> = {
  STEAM_GRAVITY: 'default',
  STEAM_PREVACUUM: 'info',
  STEAM_FLASH: 'warning',
  CHEMICAL: 'accent',
  DRY_HEAT: 'secondary',
  VALIDATION: 'secondary',
};

const statusVariants: Record<CycleStatus, 'success' | 'warning' | 'error' | 'secondary' | 'info'> = {
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
  ABORTED: 'warning',
  VOID: 'secondary',
};

const statusLabels: Record<CycleStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  ABORTED: 'Aborted',
  VOID: 'Void',
};

function getIndicatorIcon(pass: boolean | null) {
  if (pass === true) return <CheckCircle className="h-4 w-4 text-success-600" />;
  if (pass === false) return <XCircle className="h-4 w-4 text-error-600" />;
  return <AlertTriangle className="h-4 w-4 text-warning-600" />;
}

export function CycleCard({ cycle }: CycleCardProps) {
  return (
    <Link href={`/resources/sterilization/${cycle.id}`}>
      <Card interactive>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <FlaskConical className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{cycle.cycleNumber}</h3>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(cycle.startTime), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Badge variant={statusVariants[cycle.status]} dot>
                {statusLabels[cycle.status]}
              </Badge>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {cycle.isNew && (
                <Badge variant="accent" size="sm">New</Badge>
              )}
              {/* Show autoclave name and machine cycle number for imported cycles */}
              {cycle.autoclave ? (
                <Badge variant="soft-primary">
                  {cycle.autoclave.name}
                  {cycle.externalCycleNumber && ` #${cycle.externalCycleNumber}`}
                </Badge>
              ) : (
                <Badge variant={cycleTypeColors[cycle.cycleType]}>
                  {cycleTypeLabels[cycle.cycleType]}
                </Badge>
              )}
              {cycle._count.loads > 0 && (
                <Badge variant="outline">{cycle._count.loads} item{cycle._count.loads !== 1 ? 's' : ''}</Badge>
              )}
            </div>

            {/* Parameters */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {cycle.temperature != null && (
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4" />
                  <span>{Number(cycle.temperature).toFixed(2)}°C</span>
                </div>
              )}
              {cycle.pressure != null && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" />
                  <span>{Number(cycle.pressure).toFixed(2)} PSI</span>
                </div>
              )}
              {cycle.exposureTime != null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{Number(cycle.exposureTime).toFixed(2)} min</span>
                </div>
              )}
            </div>

            {/* Indicator Results */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs">
                {getIndicatorIcon(cycle.mechanicalPass)}
                <span className="text-muted-foreground">Mechanical</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {getIndicatorIcon(cycle.chemicalPass)}
                <span className="text-muted-foreground">Chemical</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {getIndicatorIcon(cycle.biologicalPass)}
                <span className="text-muted-foreground">Biological</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
