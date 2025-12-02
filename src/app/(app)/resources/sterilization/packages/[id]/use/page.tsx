'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';

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
  cycle: {
    id: string;
    cycleNumber: string;
    cycleType: string;
    status: string;
  };
}

const packageTypeLabels: Record<PackageType, string> = {
  CASSETTE_FULL: 'Full Cassette',
  CASSETTE_EXAM: 'Exam Cassette',
  POUCH: 'Pouch',
  WRAPPED: 'Wrapped',
  INDIVIDUAL: 'Individual',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default function RecordUsagePage() {
  const params = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [patientId, setPatientId] = useState('');
  const [procedureType, setProcedureType] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/resources/sterilization/packages/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch package');
        }

        setPkg(result.data);

        // Check if package can be used
        const expirationDate = new Date(result.data.expirationDate);
        const now = new Date();
        if (result.data.status !== 'STERILE') {
          setError(`This package cannot be used. Current status: ${result.data.status}`);
        } else if (expirationDate < now) {
          setError('This package has expired and cannot be used.');
        }
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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!patientId.trim()) {
      errors.patientId = 'Patient ID is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/sterilization/packages/${params.id}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId.trim(),
          procedureType: procedureType.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to record usage');
      }

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/resources/sterilization/packages/${params.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Record Package Usage"
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

  if (!pkg) {
    return (
      <>
        <PageHeader
          title="Record Package Usage"
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

  const canUse = !error && pkg.status === 'STERILE';

  return (
    <>
      <PageHeader
        title="Record Package Usage"
        description={`Link ${pkg.packageNumber} to a patient`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Packages', href: '/resources/sterilization/packages' },
          { label: pkg.packageNumber, href: `/resources/sterilization/packages/${pkg.id}` },
          { label: 'Record Usage' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{pkg.packageNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {packageTypeLabels[pkg.packageType]}
                    {pkg.cassetteName && ` - ${pkg.cassetteName}`}
                  </p>
                </div>
                <Badge variant={pkg.status === 'STERILE' ? 'success' : 'secondary'} dot>
                  {pkg.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Sterilized
                  </p>
                  <p className="font-medium">
                    {format(new Date(pkg.sterilizedDate), 'PPP')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires
                  </p>
                  <p className="font-medium">
                    {format(new Date(pkg.expirationDate), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Instruments ({pkg.itemCount})</p>
                <div className="flex flex-wrap gap-2">
                  {pkg.instrumentNames.map((name, i) => (
                    <Badge key={i} variant="outline">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Link
                  href={`/resources/sterilization/${pkg.cycle.id}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Cycle: {pkg.cycle.cycleNumber}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          {error && !success && (
            <div className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-4">
              <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 p-4">
              <div className="flex items-center gap-2 text-success-700 dark:text-success-400">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Usage recorded successfully!</p>
                  <p className="text-sm">Redirecting to package details...</p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Form */}
          {canUse && !success && (
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Patient ID"
                    required
                    error={formErrors.patientId}
                  >
                    <Input
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="Enter patient ID or scan patient QR"
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField label="Procedure Type">
                    <Input
                      value={procedureType}
                      onChange={(e) => setProcedureType(e.target.value)}
                      placeholder="e.g., Bracket Placement, Adjustment, Debonding"
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField label="Notes">
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes about usage..."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={submitting}
                      />
                    </div>
                  </FormField>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Record Usage
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Cannot Use Message */}
          {!canUse && !success && (
            <Card variant="ghost">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
                <p className="text-muted-foreground mb-4">
                  This package cannot be used for patient procedures.
                </p>
                <Link href={`/resources/sterilization/packages/${pkg.id}`}>
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Package Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>
    </>
  );
}
