'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  FlaskConical,
  Clock,
  Thermometer,
  Gauge,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Package,
  TestTube,
  FileText,
  Edit,
  Printer,
} from 'lucide-react';
import type {
  SterilizationCycle,
  SterilizationLoad,
  BiologicalIndicator,
  ChemicalIndicator,
  CycleStatus,
  SterilizationCycleType,
} from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardGrid } from '@/components/layout';
import { SterilizationLabel } from '@/components/sterilization/SterilizationLabel';

type CycleDetail = SterilizationCycle & {
  loads: SterilizationLoad[];
  biologicalIndicators: BiologicalIndicator[];
  chemicalIndicators: ChemicalIndicator[];
};

const cycleTypeLabels: Record<SterilizationCycleType, string> = {
  STEAM_GRAVITY: 'Steam Gravity',
  STEAM_PREVACUUM: 'Steam Pre-Vacuum',
  STEAM_FLASH: 'Flash/Immediate',
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

function getIndicatorStatus(pass: boolean | null) {
  if (pass === true) return { icon: CheckCircle, color: 'text-success-600', label: 'Passed' };
  if (pass === false) return { icon: XCircle, color: 'text-error-600', label: 'Failed' };
  return { icon: AlertTriangle, color: 'text-warning-600', label: 'Pending' };
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const response = await fetch(`/api/resources/sterilization/cycles/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch cycle');
        }

        setCycle(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCycle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Sterilization Cycle"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <DetailSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !cycle) {
    return (
      <>
        <PageHeader
          title="Sterilization Cycle"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
              <p className="text-error-600 mb-4">{error || 'Cycle not found'}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const mechanicalStatus = getIndicatorStatus(cycle.mechanicalPass);
  const chemicalStatus = getIndicatorStatus(cycle.chemicalPass);
  const biologicalStatus = getIndicatorStatus(cycle.biologicalPass);

  return (
    <>
      <PageHeader
        title={cycle.cycleNumber}
        description={`${cycleTypeLabels[cycle.cycleType]} sterilization cycle`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: cycle.cycleNumber },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href={`/resources/sterilization/${cycle.id}/print`}>
              <Button variant="outline">
                <Printer className="h-4 w-4" />
                Print Labels
              </Button>
            </Link>
            <Link href={`/resources/sterilization/${cycle.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Status and overview */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <FlaskConical className="h-7 w-7 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{cycle.cycleNumber}</h2>
                <Badge variant={statusVariants[cycle.status]} dot>
                  {statusLabels[cycle.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Started {format(new Date(cycle.startTime), 'PPpp')}
              </p>
            </div>
          </div>

          <DashboardGrid>
            <DashboardGrid.TwoThirds className="space-y-6">
              {/* Cycle Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Cycle Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cycle Type</p>
                      <p className="font-medium">{cycleTypeLabels[cycle.cycleType]}</p>
                    </div>
                    {cycle.temperature != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Thermometer className="h-3 w-3" /> Temperature
                        </p>
                        <p className="font-medium">{Number(cycle.temperature).toFixed(2)}°C</p>
                      </div>
                    )}
                    {cycle.pressure != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> Pressure
                        </p>
                        <p className="font-medium">{Number(cycle.pressure).toFixed(2)} PSI</p>
                      </div>
                    )}
                    {cycle.exposureTime != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Exposure
                        </p>
                        <p className="font-medium">{Number(cycle.exposureTime).toFixed(2)} min</p>
                      </div>
                    )}
                    {cycle.dryingTime != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Drying Time</p>
                        <p className="font-medium">{Number(cycle.dryingTime).toFixed(2)} min</p>
                      </div>
                    )}
                    {cycle.endTime && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">End Time</p>
                        <p className="font-medium">
                          {format(new Date(cycle.endTime), 'PPpp')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Load Items */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Load Items ({cycle.loads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cycle.loads.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items loaded in this cycle</p>
                  ) : (
                    <div className="space-y-2">
                      {cycle.loads.map((load) => (
                        <div
                          key={load.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div>
                            <p className="font-medium">{load.itemDescription}</p>
                            <p className="text-xs text-muted-foreground">
                              {load.itemType} • Qty: {load.quantity}
                              {load.position && ` • ${load.position}`}
                            </p>
                          </div>
                          {load.packBarcode && (
                            <Badge variant="outline">{load.packBarcode}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {cycle.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{cycle.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Failure Reason */}
              {cycle.failureReason && (
                <Card className="border-error-200 bg-error-50/50">
                  <CardHeader>
                    <CardTitle size="sm" className="text-error-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Failure Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-error-600">{cycle.failureReason}</p>
                  </CardContent>
                </Card>
              )}
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird className="space-y-6">
              {/* Indicator Results */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Indicator Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <mechanicalStatus.icon className={`h-5 w-5 ${mechanicalStatus.color}`} />
                      <span className="text-sm font-medium">Mechanical</span>
                    </div>
                    <span className={`text-sm ${mechanicalStatus.color}`}>
                      {mechanicalStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <chemicalStatus.icon className={`h-5 w-5 ${chemicalStatus.color}`} />
                      <span className="text-sm font-medium">Chemical</span>
                    </div>
                    <span className={`text-sm ${chemicalStatus.color}`}>
                      {chemicalStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <biologicalStatus.icon className={`h-5 w-5 ${biologicalStatus.color}`} />
                      <span className="text-sm font-medium">Biological</span>
                    </div>
                    <span className={`text-sm ${biologicalStatus.color}`}>
                      {biologicalStatus.label}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Biological Indicators */}
              {cycle.biologicalIndicators.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Biological Tests ({cycle.biologicalIndicators.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cycle.biologicalIndicators.map((bi) => (
                      <div key={bi.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{bi.lotNumber}</span>
                          <Badge
                            variant={
                              bi.result === 'PASSED'
                                ? 'success'
                                : bi.result === 'FAILED'
                                  ? 'error'
                                  : 'secondary'
                            }
                            size="sm"
                          >
                            {bi.result}
                          </Badge>
                        </div>
                        {bi.brand && (
                          <p className="text-xs text-muted-foreground mt-1">{bi.brand}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Chemical Indicators */}
              {cycle.chemicalIndicators.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle size="sm">Chemical Indicators ({cycle.chemicalIndicators.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cycle.chemicalIndicators.map((ci) => (
                      <div key={ci.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ci.indicatorClass}</span>
                          <Badge
                            variant={
                              ci.result === 'PASSED'
                                ? 'success'
                                : ci.result === 'FAILED'
                                  ? 'error'
                                  : 'secondary'
                            }
                            size="sm"
                          >
                            {ci.result}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Sterilization Label with QR Code */}
              {cycle.status === 'COMPLETED' && (
                <SterilizationLabel
                  cycle={{
                    id: cycle.id,
                    cycleNumber: cycle.cycleNumber,
                    cycleType: cycle.cycleType,
                    startTime: cycle.startTime,
                    temperature: cycle.temperature,
                    pressure: cycle.pressure,
                    exposureTime: cycle.exposureTime,
                    status: cycle.status,
                  }}
                  expirationDays={30}
                />
              )}
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
