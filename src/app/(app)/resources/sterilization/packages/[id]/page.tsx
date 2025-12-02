'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  User,
} from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SterilizationLabel } from '@/components/sterilization/SterilizationLabel';
import { getDaysUntilExpiration } from '@/lib/sterilization/qr-code';

interface PackageDetail {
  id: string;
  packageNumber: string;
  qrCode: string;
  packageType: PackageType;
  status: PackageStatus;
  sterilizedDate: string;
  expirationDate: string;
  instrumentNames: string[];
  itemCount: number;
  cassetteName?: string | null;
  notes?: string | null;
  cycle: {
    id: string;
    cycleNumber: string;
    cycleType: string;
    status: string;
    startTime: string;
    endTime?: string | null;
    temperature?: number | null;
    pressure?: number | null;
    exposureTime?: number | null;
    mechanicalPass?: boolean | null;
    chemicalPass?: boolean | null;
    biologicalPass?: boolean | null;
  };
  usages: Array<{
    id: string;
    patientId: string;
    usedAt: string;
    procedureType?: string | null;
  }>;
  _count: {
    usages: number;
  };
}

const packageTypeLabels: Record<PackageType, string> = {
  CASSETTE_FULL: 'Full Cassette',
  CASSETTE_EXAM: 'Exam Cassette',
  POUCH: 'Pouch',
  WRAPPED: 'Wrapped',
  INDIVIDUAL: 'Individual',
};

const statusVariants: Record<PackageStatus, 'success' | 'warning' | 'error' | 'secondary' | 'info'> = {
  STERILE: 'success',
  USED: 'secondary',
  EXPIRED: 'error',
  COMPROMISED: 'warning',
  RECALLED: 'error',
};

const statusLabels: Record<PackageStatus, string> = {
  STERILE: 'Sterile',
  USED: 'Used',
  EXPIRED: 'Expired',
  COMPROMISED: 'Compromised',
  RECALLED: 'Recalled',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/resources/sterilization/packages/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch package');
        }

        setPkg(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPackage();
    }
  }, [params.id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Package Details"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Packages', href: '/resources/sterilization/packages' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <DetailSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !pkg) {
    return (
      <>
        <PageHeader
          title="Package Details"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Packages', href: '/resources/sterilization/packages' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
              <p className="text-error-600 mb-4">{error || 'Package not found'}</p>
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

  const sterilizedDate = new Date(pkg.sterilizedDate);
  const expirationDate = new Date(pkg.expirationDate);
  const now = new Date();
  const isExpired = expirationDate < now && pkg.status === 'STERILE';
  const daysUntilExpiration = getDaysUntilExpiration(sterilizedDate, 30);
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 7 && pkg.status === 'STERILE';
  const displayStatus = isExpired ? 'EXPIRED' : pkg.status;
  const canUse = pkg.status === 'STERILE' && !isExpired;

  return (
    <>
      <PageHeader
        title={pkg.packageNumber}
        description={`${packageTypeLabels[pkg.packageType]}${pkg.cassetteName ? ` - ${pkg.cassetteName}` : ''}`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Packages', href: '/resources/sterilization/packages' },
          { label: pkg.packageNumber },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={statusVariants[displayStatus]} dot>
              {statusLabels[displayStatus]}
            </Badge>
            {isExpiringSoon && (
              <Badge variant="warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expires in {daysUntilExpiration} days
              </Badge>
            )}
            <Link href={`/resources/sterilization/${pkg.cycle.id}`}>
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                View Cycle
              </Button>
            </Link>
            {canUse && (
              <Link href={`/resources/sterilization/packages/${pkg.id}/use`}>
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Record Usage
                </Button>
              </Link>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Package Contents */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Package Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Item Count</p>
                  <p className="font-medium">{pkg.itemCount} item{pkg.itemCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Sterilized
                  </p>
                  <p className="font-medium">{format(sterilizedDate, 'PPP')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires
                  </p>
                  <p className={`font-medium ${isExpired ? 'text-error-600' : isExpiringSoon ? 'text-warning-600' : ''}`}>
                    {format(expirationDate, 'PPP')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cycle</p>
                  <Link
                    href={`/resources/sterilization/${pkg.cycle.id}`}
                    className="font-medium text-primary-600 hover:underline"
                  >
                    {pkg.cycle.cycleNumber}
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Instruments</p>
                <div className="flex flex-wrap gap-2">
                  {pkg.instrumentNames.map((name, i) => (
                    <Badge key={i} variant="outline">{name}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sterilization Cycle Info */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Sterilization Cycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{pkg.cycle.cycleNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.cycle.cycleType.replace(/_/g, ' ')}
                  </p>
                </div>
                <Badge variant={pkg.cycle.status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {pkg.cycle.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                {pkg.cycle.temperature && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="font-medium">{Number(pkg.cycle.temperature).toFixed(0)}°C</p>
                  </div>
                )}
                {pkg.cycle.pressure && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pressure</p>
                    <p className="font-medium">{Number(pkg.cycle.pressure).toFixed(0)} PSI</p>
                  </div>
                )}
                {pkg.cycle.exposureTime && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Exposure</p>
                    <p className="font-medium">{pkg.cycle.exposureTime} min</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mechanical</p>
                  <div className="flex items-center gap-1">
                    {pkg.cycle.mechanicalPass === true ? (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    ) : pkg.cycle.mechanicalPass === false ? (
                      <XCircle className="h-4 w-4 text-error-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning-600" />
                    )}
                    <span className="text-sm">{pkg.cycle.mechanicalPass === true ? 'Pass' : pkg.cycle.mechanicalPass === false ? 'Fail' : 'Pending'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Chemical</p>
                  <div className="flex items-center gap-1">
                    {pkg.cycle.chemicalPass === true ? (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    ) : pkg.cycle.chemicalPass === false ? (
                      <XCircle className="h-4 w-4 text-error-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning-600" />
                    )}
                    <span className="text-sm">{pkg.cycle.chemicalPass === true ? 'Pass' : pkg.cycle.chemicalPass === false ? 'Fail' : 'Pending'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Biological</p>
                  <div className="flex items-center gap-1">
                    {pkg.cycle.biologicalPass === true ? (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    ) : pkg.cycle.biologicalPass === false ? (
                      <XCircle className="h-4 w-4 text-error-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning-600" />
                    )}
                    <span className="text-sm">{pkg.cycle.biologicalPass === true ? 'Pass' : pkg.cycle.biologicalPass === false ? 'Fail' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage History */}
          {pkg.usages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Usage History ({pkg._count.usages})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.usages.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Patient: {usage.patientId.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {usage.procedureType || 'General procedure'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(usage.usedAt), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {pkg.notes && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{pkg.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Sterilization Label with QR Code */}
          <SterilizationLabel
            cycle={{
              id: pkg.cycle.id,
              cycleNumber: pkg.cycle.cycleNumber,
              cycleType: pkg.cycle.cycleType,
              startTime: pkg.cycle.startTime,
              temperature: pkg.cycle.temperature,
              pressure: pkg.cycle.pressure,
              exposureTime: pkg.cycle.exposureTime,
              status: pkg.cycle.status,
            }}
            expirationDays={30}
          />
        </div>
      </PageContent>
    </>
  );
}
