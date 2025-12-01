'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import type { SterilizationCycle, SterilizationCycleType, CycleStatus } from '@prisma/client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type CycleWithCounts = SterilizationCycle & {
  _count: {
    loads: number;
    biologicalIndicators: number;
    chemicalIndicators: number;
  };
};

interface CycleTableViewProps {
  cycles: CycleWithCounts[];
  compact?: boolean;
}

const cycleTypeLabels: Record<SterilizationCycleType, string> = {
  STEAM_GRAVITY: 'Steam Gravity',
  STEAM_PREVACUUM: 'Steam Pre-Vac',
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

function IndicatorIcon({ pass, label }: { pass: boolean | null; label: string }) {
  if (pass === true) return <span title={`${label}: Passed`}><CheckCircle className="h-4 w-4 text-success-600" /></span>;
  if (pass === false) return <span title={`${label}: Failed`}><XCircle className="h-4 w-4 text-error-600" /></span>;
  return <span title={`${label}: Pending`}><AlertTriangle className="h-4 w-4 text-warning-500" /></span>;
}

export function CycleTableView({ cycles, compact = false }: CycleTableViewProps) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-semibold">Cycle #</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Date/Time</TableHead>
            {!compact && (
              <>
                <TableHead className="font-semibold text-center">Temp</TableHead>
                <TableHead className="font-semibold text-center">Pressure</TableHead>
                <TableHead className="font-semibold text-center">Exposure</TableHead>
              </>
            )}
            <TableHead className="font-semibold text-center">Items</TableHead>
            <TableHead className="font-semibold text-center">Indicators</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cycles.map((cycle) => (
            <TableRow key={cycle.id} className="group">
              <TableCell className="font-medium">
                <Link
                  href={`/resources/sterilization/${cycle.id}`}
                  className="hover:text-primary-600 hover:underline"
                >
                  {cycle.cycleNumber}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm">{cycleTypeLabels[cycle.cycleType]}</span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{format(new Date(cycle.startTime), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(cycle.startTime), 'h:mm a')}
                  </p>
                </div>
              </TableCell>
              {!compact && (
                <>
                  <TableCell className="text-center">
                    {cycle.temperature != null ? (
                      <span className="text-sm">{Number(cycle.temperature).toFixed(0)}°C</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cycle.pressure != null ? (
                      <span className="text-sm">{Number(cycle.pressure).toFixed(0)} PSI</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cycle.exposureTime != null ? (
                      <span className="text-sm">{Number(cycle.exposureTime).toFixed(0)} min</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </>
              )}
              <TableCell className="text-center">
                {cycle._count.loads > 0 ? (
                  <Badge variant="outline" size="sm">
                    {cycle._count.loads}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1.5">
                  <IndicatorIcon pass={cycle.mechanicalPass} label="Mechanical" />
                  <IndicatorIcon pass={cycle.chemicalPass} label="Chemical" />
                  <IndicatorIcon pass={cycle.biologicalPass} label="Biological" />
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[cycle.status]} size="sm">
                  {statusLabels[cycle.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/resources/sterilization/${cycle.id}`}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Compact table variant with fewer columns
export function CycleTableViewCompact({ cycles }: { cycles: CycleWithCounts[] }) {
  return <CycleTableView cycles={cycles} compact />;
}
