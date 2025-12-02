'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Wrench,
  FileCheck,
  User,
  Building2,
  Loader2,
} from 'lucide-react';
import type { ValidationType, ValidationResult } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardGrid } from '@/components/layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ValidationDetail {
  id: string;
  clinicId: string;
  equipmentId: string;
  validationType: ValidationType;
  validationDate: string;
  nextValidationDue: string | null;
  result: ValidationResult;
  parameters: Record<string, unknown> | null;
  performedBy: string;
  performedById: string | null;
  vendorName: string | null;
  technicianName: string | null;
  certificateNumber: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
  failureDetails: string | null;
  correctiveAction: string | null;
  retestDate: string | null;
  retestResult: ValidationResult | null;
  maintenanceRecordId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    name: string;
    equipmentNumber: string;
    serialNumber: string | null;
  } | null;
}

function getValidationTypeLabel(type: ValidationType): string {
  const labels: Record<ValidationType, string> = {
    INSTALLATION_QUALIFICATION: 'Installation Qualification (IQ)',
    OPERATIONAL_QUALIFICATION: 'Operational Qualification (OQ)',
    PERFORMANCE_QUALIFICATION: 'Performance Qualification (PQ)',
    BOWIE_DICK_TEST: 'Bowie-Dick Test',
    LEAK_RATE_TEST: 'Leak Rate Test',
    CALIBRATION: 'Calibration',
    PREVENTIVE_MAINTENANCE: 'Preventive Maintenance',
    REPAIR_VERIFICATION: 'Repair Verification',
    ANNUAL_VALIDATION: 'Annual Validation',
  };
  return labels[type] || type;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

export default function ValidationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [validation, setValidation] = useState<ValidationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidation = async () => {
      try {
        const res = await fetch(`/api/resources/sterilization/validations/${id}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch validation');
        }

        setValidation(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchValidation();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/resources/sterilization/validations/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete validation');
      }

      router.push('/resources/sterilization/validations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Validation Details"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Validations', href: '/resources/sterilization/validations' },
            { label: 'Details' },
          ]}
        />
        <PageContent>
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !validation) {
    return (
      <>
        <PageHeader
          title="Validation Details"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Validations', href: '/resources/sterilization/validations' },
            { label: 'Details' },
          ]}
        />
        <PageContent>
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
              <p className="text-error-600">{error || 'Validation not found'}</p>
              <Link href="/resources/sterilization/validations">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Validations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const ResultIcon =
    validation.result === 'PASS'
      ? CheckCircle
      : validation.result === 'FAIL'
      ? XCircle
      : AlertTriangle;

  const resultColor =
    validation.result === 'PASS'
      ? 'success'
      : validation.result === 'FAIL'
      ? 'error'
      : 'warning';

  return (
    <>
      <PageHeader
        title={getValidationTypeLabel(validation.validationType)}
        description={`Validation record from ${format(new Date(validation.validationDate), 'MMMM d, yyyy')}`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Validations', href: '/resources/sterilization/validations' },
          { label: getValidationTypeLabel(validation.validationType) },
        ]}
        actions={
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Validation Record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this
                    validation record from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-error-600 hover:bg-error-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href={`/resources/sterilization/validations/${id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Result Card */}
            <Card
              className={`border-${resultColor}-200 dark:border-${resultColor}-800 bg-${resultColor}-50 dark:bg-${resultColor}-900/20`}
            >
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl bg-${resultColor}-100 dark:bg-${resultColor}-900/30`}
                  >
                    <ResultIcon className={`h-8 w-8 text-${resultColor}-600`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{validation.result}</h2>
                    <p className="text-muted-foreground">
                      {getValidationTypeLabel(validation.validationType)}
                    </p>
                  </div>
                  <Badge variant={resultColor} className="ml-auto text-lg px-4 py-1">
                    {validation.result}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Validation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Validation Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(validation.validationDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {validation.nextValidationDue && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Due</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(validation.nextValidationDue), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Performed By</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {validation.performedBy}
                    </p>
                  </div>
                  {validation.vendorName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {validation.vendorName}
                      </p>
                    </div>
                  )}
                </div>

                {validation.technicianName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Technician</p>
                    <p className="font-medium">{validation.technicianName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificate Info */}
            {(validation.certificateNumber || validation.certificateExpiry) && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Certificate Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {validation.certificateNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Certificate Number</p>
                        <p className="font-medium">{validation.certificateNumber}</p>
                      </div>
                    )}
                    {validation.certificateExpiry && (
                      <div>
                        <p className="text-sm text-muted-foreground">Certificate Expiry</p>
                        <p className="font-medium">
                          {format(new Date(validation.certificateExpiry), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Failure Details */}
            {validation.result === 'FAIL' && validation.failureDetails && (
              <Card className="border-error-200 dark:border-error-800">
                <CardHeader>
                  <CardTitle size="sm" className="text-error-700 dark:text-error-400 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Failure Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Details</p>
                    <p className="mt-1">{validation.failureDetails}</p>
                  </div>
                  {validation.correctiveAction && (
                    <div>
                      <p className="text-sm text-muted-foreground">Corrective Action</p>
                      <p className="mt-1">{validation.correctiveAction}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {validation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{validation.notes}</p>
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Equipment Info */}
            {validation.equipment && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{validation.equipment.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equipment #</p>
                    <p className="font-medium">{validation.equipment.equipmentNumber}</p>
                  </div>
                  {validation.equipment.serialNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Serial #</p>
                      <p className="font-medium">{validation.equipment.serialNumber}</p>
                    </div>
                  )}
                  <Link href={`/resources/equipment/${validation.equipment.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Equipment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Record Info */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Record Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{format(new Date(validation.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{format(new Date(validation.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
