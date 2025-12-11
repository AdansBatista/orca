'use client';

import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FlaskConical,
  Thermometer,
  Gauge,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  TestTube,
  Droplets,
  Timer,
} from 'lucide-react';
import type { SterilizationCycle, SterilizationCycleType, CycleStatus } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CycleWithCounts = SterilizationCycle & {
  _count: {
    loads: number;
    biologicalIndicators: number;
    chemicalIndicators: number;
  };
};

interface CycleCardExpandedProps {
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

function IndicatorCard({ label, pass, icon: Icon }: { label: string; pass: boolean | null; icon: React.ComponentType<{ className?: string }> }) {
  const getStatus = () => {
    if (pass === true) return { color: 'bg-success-100 dark:bg-success-900/30 border-success-200', icon: CheckCircle, iconColor: 'text-success-600', text: 'Passed' };
    if (pass === false) return { color: 'bg-error-100 dark:bg-error-900/30 border-error-200', icon: XCircle, iconColor: 'text-error-600', text: 'Failed' };
    return { color: 'bg-warning-100 dark:bg-warning-900/30 border-warning-200', icon: AlertTriangle, iconColor: 'text-warning-600', text: 'Pending' };
  };
  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.color}`}>
      <Icon className={`h-4 w-4 ${status.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className={`text-xs ${status.iconColor}`}>{status.text}</p>
      </div>
      <StatusIcon className={`h-4 w-4 ${status.iconColor}`} />
    </div>
  );
}

export function CycleCardExpanded({ cycle }: CycleCardExpandedProps) {
  // Calculate overall pass/fail
  const allPassed = cycle.mechanicalPass === true && cycle.chemicalPass === true && cycle.biologicalPass === true;
  const anyFailed = cycle.mechanicalPass === false || cycle.chemicalPass === false || cycle.biologicalPass === false;

  return (
    <Link href={`/resources/sterilization/${cycle.id}`}>
      <Card
        className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${
          cycle.status === 'FAILED' || anyFailed
            ? 'border-l-error-500'
            : cycle.status === 'COMPLETED' && allPassed
              ? 'border-l-success-500'
              : cycle.status === 'IN_PROGRESS'
                ? 'border-l-info-500'
                : 'border-l-muted'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <FlaskConical className="h-6 w-6 text-primary-600" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">{cycle.cycleNumber}</CardTitle>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(cycle.startTime), 'MMM d, yyyy')} at {format(new Date(cycle.startTime), 'h:mm a')}
                </p>
              </div>
            </div>
            <Badge variant={statusVariants[cycle.status]} dot size="lg">
              {statusLabels[cycle.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cycle Type and Load Info */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={cycleTypeColors[cycle.cycleType]}>
              {cycleTypeLabels[cycle.cycleType]}
            </Badge>
            {cycle._count.loads > 0 && (
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {cycle._count.loads} item{cycle._count.loads !== 1 ? 's' : ''}
              </Badge>
            )}
            {cycle._count.biologicalIndicators > 0 && (
              <Badge variant="outline" className="gap-1">
                <TestTube className="h-3 w-3" />
                {cycle._count.biologicalIndicators} BI test{cycle._count.biologicalIndicators !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cycle.temperature != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Temp</p>
                  <p className="text-sm font-semibold">{Number(cycle.temperature).toFixed(2)}°C</p>
                </div>
              </div>
            )}
            {cycle.pressure != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pressure</p>
                  <p className="text-sm font-semibold">{Number(cycle.pressure).toFixed(2)} PSI</p>
                </div>
              </div>
            )}
            {cycle.exposureTime != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Exposure</p>
                  <p className="text-sm font-semibold">{Number(cycle.exposureTime).toFixed(2)} min</p>
                </div>
              </div>
            )}
            {cycle.dryingTime != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Drying</p>
                  <p className="text-sm font-semibold">{Number(cycle.dryingTime).toFixed(2)} min</p>
                </div>
              </div>
            )}
          </div>

          {/* Indicator Results */}
          <div className="grid grid-cols-3 gap-2">
            <IndicatorCard label="Mechanical" pass={cycle.mechanicalPass} icon={Gauge} />
            <IndicatorCard label="Chemical" pass={cycle.chemicalPass} icon={Droplets} />
            <IndicatorCard label="Biological" pass={cycle.biologicalPass} icon={TestTube} />
          </div>

          {/* Notes preview if exists */}
          {cycle.notes && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground line-clamp-2">{cycle.notes}</p>
            </div>
          )}

          {/* Failure reason if failed */}
          {cycle.failureReason && (
            <div className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200">
              <p className="text-xs font-medium text-error-700 dark:text-error-400">Failure Reason:</p>
              <p className="text-xs text-error-600 dark:text-error-300 line-clamp-2">{cycle.failureReason}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{formatDistanceToNow(new Date(cycle.startTime), { addSuffix: true })}</span>
            {cycle.endTime && (
              <span className="whitespace-nowrap">Duration: {Math.round((new Date(cycle.endTime).getTime() - new Date(cycle.startTime).getTime()) / 60000)} min</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
