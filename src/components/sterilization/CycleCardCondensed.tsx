'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FlaskConical, Thermometer, Gauge, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { SterilizationCycle, SterilizationCycleType, CycleStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';

type CycleWithCounts = SterilizationCycle & {
  _count: {
    loads: number;
    biologicalIndicators: number;
    chemicalIndicators: number;
  };
};

interface CycleCardCondensedProps {
  cycle: CycleWithCounts;
}

const cycleTypeLabels: Record<SterilizationCycleType, string> = {
  STEAM_GRAVITY: 'Gravity',
  STEAM_PREVACUUM: 'Pre-Vac',
  STEAM_FLASH: 'Flash',
  CHEMICAL: 'Chemical',
  DRY_HEAT: 'Dry Heat',
  VALIDATION: 'Validation',
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

function IndicatorDot({ pass }: { pass: boolean | null }) {
  if (pass === true) return <div className="h-2 w-2 rounded-full bg-success-500" title="Passed" />;
  if (pass === false) return <div className="h-2 w-2 rounded-full bg-error-500" title="Failed" />;
  return <div className="h-2 w-2 rounded-full bg-warning-500" title="Pending" />;
}

export function CycleCardCondensed({ cycle }: CycleCardCondensedProps) {
  return (
    <Link href={`/resources/sterilization/${cycle.id}`}>
      <ListItem
        variant="bordered"
        size="sm"
        showArrow
        leading={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <FlaskConical className="h-4 w-4 text-primary-600" />
          </div>
        }
        trailing={
          <div className="flex items-center gap-3">
            {/* Indicator dots */}
            <div className="hidden sm:flex items-center gap-1.5" title="M / C / B">
              <IndicatorDot pass={cycle.mechanicalPass} />
              <IndicatorDot pass={cycle.chemicalPass} />
              <IndicatorDot pass={cycle.biologicalPass} />
            </div>
            <Badge variant={statusVariants[cycle.status]} size="sm">
              {statusLabels[cycle.status]}
            </Badge>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <ListItemTitle>{cycle.cycleNumber}</ListItemTitle>
            <ListItemDescription>
              {cycleTypeLabels[cycle.cycleType]} • {formatDistanceToNow(new Date(cycle.startTime), { addSuffix: true })}
              {cycle._count.loads > 0 && ` • ${cycle._count.loads} item${cycle._count.loads !== 1 ? 's' : ''}`}
            </ListItemDescription>
          </div>
          {/* Compact parameters - hidden on small screens */}
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            {cycle.temperature != null && (
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                {Number(cycle.temperature).toFixed(0)}°
              </span>
            )}
            {cycle.pressure != null && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {Number(cycle.pressure).toFixed(0)}
              </span>
            )}
            {cycle.exposureTime != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Number(cycle.exposureTime).toFixed(0)}m
              </span>
            )}
          </div>
        </div>
      </ListItem>
    </Link>
  );
}
