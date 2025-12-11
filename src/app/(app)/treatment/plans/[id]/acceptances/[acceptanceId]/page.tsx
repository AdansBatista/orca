'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileSignature,
  Check,
  AlertCircle,
  DollarSign,
  Shield,
  Pen,
  User,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
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

interface CaseAcceptanceDetail {
  id: string;
  status: string;
  consentType: string;
  financialAgreementAmount: number | null;
  paymentPlanDetails: string | null;
  insuranceVerified: boolean;
  patientResponsibility: number | null;
  requiresGuardianSignature: boolean;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianSignature: string | null;
  guardianSignedAt: string | null;
  patientSignature: string | null;
  patientSignedAt: string | null;
  witnessSignature: string | null;
  witnessSignedAt: string | null;
  acceptanceDate: string | null;
  specialConditions: string | null;
  riskDisclosures: string | null;
  createdAt: string;
  updatedAt: string;
  treatmentPlan: {
    id: string;
    planNumber: string;
    planName: string;
    status: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  selectedOption: {
    id: string;
    optionNumber: number;
    optionName: string;
    applianceSystem: string;
    estimatedCost: number | null;
  } | null;
  witness: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  PENDING: 'secondary',
  PARTIALLY_SIGNED: 'warning',
  FULLY_SIGNED: 'success',
  EXPIRED: 'secondary',
  REVOKED: 'secondary',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending Signatures',
  PARTIALLY_SIGNED: 'Partially Signed',
  FULLY_SIGNED: 'Fully Signed',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

const consentTypeLabels: Record<string, string> = {
  TREATMENT_CONSENT: 'Treatment Consent',
  FINANCIAL_AGREEMENT: 'Financial Agreement',
  INFORMED_CONSENT: 'Informed Consent',
  HIPAA_AUTHORIZATION: 'HIPAA Authorization',
  PHOTO_CONSENT: 'Photo/Video Consent',
  COMBINED: 'Combined Consent Form',
};

const applianceSystemLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal',
  TRADITIONAL_CERAMIC: 'Traditional Ceramic',
  SELF_LIGATING_METAL: 'Self-Ligating Metal',
  SELF_LIGATING_CERAMIC: 'Self-Ligating Ceramic',
  LINGUAL: 'Lingual',
  INVISALIGN: 'Invisalign',
  CLEAR_ALIGNERS_OTHER: 'Clear Aligners',
  COMBINATION: 'Combination',
  OTHER: 'Other',
};

export default function CaseAcceptanceDetailPage({
  params,
}: {
  params: Promise<{ id: string; acceptanceId: string }>;
}) {
  const { id: planId, acceptanceId } = use(params);
  const router = useRouter();
  const [acceptance, setAcceptance] = useState<CaseAcceptanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchAcceptance = async () => {
      try {
        const response = await fetch(`/api/case-acceptances/${acceptanceId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch case acceptance');
        }

        setAcceptance(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptance();
  }, [acceptanceId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/case-acceptances/${acceptanceId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete acceptance');
      }

      router.push(`/treatment/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const handleCollectSignatures = async () => {
    setSigning(true);
    try {
      // This would typically open a signature collection modal/flow
      // For now, we'll simulate collecting signatures
      const response = await fetch(`/api/case-acceptances/${acceptanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientSignature: 'Collected',
          guardianSignature: acceptance?.requiresGuardianSignature ? 'Collected' : undefined,
          witnessSignature: acceptance?.witness ? 'Collected' : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to collect signatures');
      }

      setAcceptance(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Case Acceptance" compact />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !acceptance) {
    return (
      <>
        <PageHeader title="Case Acceptance" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Acceptance</h3>
              <p className="text-muted-foreground mb-4">{error || 'Acceptance not found'}</p>
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

  const canEdit = acceptance.status === 'PENDING';
  const canDelete = acceptance.status !== 'FULLY_SIGNED';
  const canSign = acceptance.status !== 'FULLY_SIGNED' && acceptance.status !== 'EXPIRED';

  // Calculate required signatures
  const requiredSignatures = [
    { label: 'Patient', signed: !!acceptance.patientSignature, signedAt: acceptance.patientSignedAt },
  ];
  if (acceptance.requiresGuardianSignature) {
    requiredSignatures.push({
      label: 'Guardian',
      signed: !!acceptance.guardianSignature,
      signedAt: acceptance.guardianSignedAt,
    });
  }
  if (acceptance.witness) {
    requiredSignatures.push({
      label: 'Witness',
      signed: !!acceptance.witnessSignature,
      signedAt: acceptance.witnessSignedAt,
    });
  }

  const signedCount = requiredSignatures.filter((s) => s.signed).length;

  return (
    <>
      <PageHeader
        title="Case Acceptance"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: acceptance.treatmentPlan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'Acceptance' },
        ]}
        actions={
          <div className="flex gap-2">
            {canSign && (
              <Button onClick={handleCollectSignatures} disabled={signing}>
                <Pen className="h-4 w-4 mr-2" />
                {signing ? 'Processing...' : 'Collect Signatures'}
              </Button>
            )}
            {canEdit && (
              <Link href={`/treatment/plans/${planId}/acceptances/${acceptanceId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Acceptance Form?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this
                      case acceptance form.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds className="space-y-4">
            {/* Status Banner */}
            {acceptance.status === 'FULLY_SIGNED' && (
              <Card className="border-success-200 bg-success-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success-100">
                      <Check className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-success-700">Fully Signed & Accepted</p>
                      {acceptance.acceptanceDate && (
                        <p className="text-sm text-success-600">
                          Accepted on {format(new Date(acceptance.acceptanceDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {consentTypeLabels[acceptance.consentType]}
                      </h2>
                      <p className="text-muted-foreground">
                        {signedCount}/{requiredSignatures.length} signatures collected
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant[acceptance.status]} className="text-sm">
                    {statusLabels[acceptance.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Selected Treatment */}
            {acceptance.selectedOption && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Selected Treatment
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  <Link
                    href={`/treatment/plans/${planId}/options/${acceptance.selectedOption.id}`}
                    className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Option {acceptance.selectedOption.optionNumber}:{' '}
                          {acceptance.selectedOption.optionName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {applianceSystemLabels[acceptance.selectedOption.applianceSystem]}
                        </p>
                      </div>
                      {acceptance.selectedOption.estimatedCost && (
                        <p className="font-medium">
                          ${acceptance.selectedOption.estimatedCost.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Financial Details */}
            {(acceptance.financialAgreementAmount || acceptance.patientResponsibility) && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Agreement
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="grid gap-4 md:grid-cols-2">
                    {acceptance.financialAgreementAmount && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Treatment Cost</p>
                        <p className="text-2xl font-bold">
                          ${acceptance.financialAgreementAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {acceptance.patientResponsibility && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Patient Responsibility</p>
                        <p className="text-2xl font-bold">
                          ${acceptance.patientResponsibility.toLocaleString()}
                        </p>
                        {acceptance.insuranceVerified && (
                          <Badge variant="success" className="mt-2">
                            Insurance Verified
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {acceptance.paymentPlanDetails && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Payment Plan</p>
                      <p className="text-sm">{acceptance.paymentPlanDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Signatures */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Pen className="h-4 w-4" />
                  Signatures
                </CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="space-y-3">
                  {requiredSignatures.map((sig, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        sig.signed ? 'bg-success-50 border border-success-200' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {sig.signed ? (
                          <Check className="h-5 w-5 text-success-600" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <div>
                          <p className="font-medium">{sig.label} Signature</p>
                          {sig.signedAt && (
                            <p className="text-xs text-muted-foreground">
                              Signed: {format(new Date(sig.signedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                      {sig.signed ? (
                        <Badge variant="success">Signed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Disclosures / Special Conditions */}
            {(acceptance.riskDisclosures || acceptance.specialConditions) && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Additional Information</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-4">
                  {acceptance.riskDisclosures && (
                    <div>
                      <p className="text-sm font-medium mb-1">Risk Disclosures</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {acceptance.riskDisclosures}
                      </p>
                    </div>
                  )}
                  {acceptance.specialConditions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Special Conditions</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {acceptance.specialConditions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird className="space-y-4">
            {/* Patient */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </CardTitle>
              </CardHeader>
              <CardContent compact>
                <Link
                  href={`/patients/${acceptance.patient.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium">
                    <PhiProtected fakeData={getFakeName()}>
                      {acceptance.patient.firstName} {acceptance.patient.lastName}
                    </PhiProtected>
                  </p>
                </Link>
              </CardContent>
            </Card>

            {/* Guardian */}
            {acceptance.requiresGuardianSignature && acceptance.guardianName && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Parent/Guardian</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">
                      <PhiProtected fakeData={getFakeName()}>
                        {acceptance.guardianName}
                      </PhiProtected>
                    </p>
                    {acceptance.guardianRelationship && (
                      <p className="text-sm text-muted-foreground">
                        {acceptance.guardianRelationship}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Witness */}
            {acceptance.witness && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Witness</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">
                      {acceptance.witness.title ? `${acceptance.witness.title} ` : ''}
                      {acceptance.witness.firstName} {acceptance.witness.lastName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Treatment Plan */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent compact>
                <Link
                  href={`/treatment/plans/${planId}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium">
                    {acceptance.treatmentPlan.planName || acceptance.treatmentPlan.planNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {acceptance.treatmentPlan.planNumber}
                  </p>
                </Link>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">History</CardTitle>
              </CardHeader>
              <CardContent compact className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(new Date(acceptance.createdAt), 'MMM d, yyyy h:mm a')}</p>
                <p>Updated: {format(new Date(acceptance.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                {acceptance.acceptanceDate && (
                  <p>
                    Accepted: {format(new Date(acceptance.acceptanceDate), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
