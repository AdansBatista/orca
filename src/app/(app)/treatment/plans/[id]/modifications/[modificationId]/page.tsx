'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  DollarSign,
  GitBranch,
  FileText,
  AlertTriangle,
  Pen,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SignatureCanvas from '@/components/ui/signature-canvas';

interface PlanModification {
  id: string;
  modificationType: string;
  modificationDate: string;
  previousVersion: number;
  newVersion: number;
  createsNewVersion: boolean;
  changeDescription: string;
  reason: string;
  changedFields: Record<string, { old: unknown; new: unknown }> | null;
  previousFee: number | null;
  newFee: number | null;
  feeChangeAmount: number | null;
  requiresAcknowledgment: boolean;
  acknowledgedAt: string | null;
  acknowledgmentMethod: string | null;
  acknowledgmentNotes: string | null;
  requiresNewConsent: boolean;
  newConsentObtained: boolean;
  previousStateSnapshot: Record<string, unknown> | null;
  modifiedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  acknowledgedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  treatmentPlan: {
    id: string;
    planNumber: string;
    planName: string;
    version: number;
    status: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

const modificationTypeLabels: Record<string, string> = {
  MINOR_ADJUSTMENT: 'Minor Adjustment',
  PHASE_ADDITION: 'Phase Addition',
  PHASE_REMOVAL: 'Phase Removal',
  APPLIANCE_CHANGE: 'Appliance Change',
  DURATION_EXTENSION: 'Duration Extension',
  DURATION_REDUCTION: 'Duration Reduction',
  TREATMENT_UPGRADE: 'Treatment Upgrade',
  TREATMENT_DOWNGRADE: 'Treatment Downgrade',
  FEE_ADJUSTMENT: 'Fee Adjustment',
  PROVIDER_CHANGE: 'Provider Change',
  GOAL_MODIFICATION: 'Goal Modification',
  CLINICAL_PROTOCOL: 'Clinical Protocol',
  OTHER: 'Other',
};

const modificationTypeVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  MINOR_ADJUSTMENT: 'secondary',
  PHASE_ADDITION: 'info',
  PHASE_REMOVAL: 'warning',
  APPLIANCE_CHANGE: 'destructive',
  DURATION_EXTENSION: 'warning',
  DURATION_REDUCTION: 'info',
  TREATMENT_UPGRADE: 'success',
  TREATMENT_DOWNGRADE: 'warning',
  FEE_ADJUSTMENT: 'warning',
  PROVIDER_CHANGE: 'secondary',
  GOAL_MODIFICATION: 'info',
  CLINICAL_PROTOCOL: 'info',
  OTHER: 'secondary',
};

export default function ModificationDetailPage({
  params,
}: {
  params: Promise<{ id: string; modificationId: string }>;
}) {
  const { id, modificationId } = use(params);
  const router = useRouter();

  const [modification, setModification] = useState<PlanModification | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Acknowledgment dialog state
  const [showAckDialog, setShowAckDialog] = useState(false);
  const [ackMethod, setAckMethod] = useState<string>('verbal');
  const [ackNotes, setAckNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    const fetchModification = async () => {
      try {
        const res = await fetch(`/api/treatment-plans/${id}/modifications/${modificationId}`);
        const data = await res.json();
        if (data.success) {
          setModification(data.data);
        }
      } catch (err) {
        console.error('Error fetching modification:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModification();
  }, [id, modificationId]);

  const handleAcknowledge = async () => {
    if (ackMethod === 'signature' && !signature) {
      setError('Please provide a signature');
      return;
    }

    setAcknowledging(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/treatment-plans/${id}/modifications/${modificationId}/acknowledge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acknowledgmentMethod: ackMethod,
            acknowledgmentNotes: ackNotes || null,
            patientSignature: ackMethod === 'signature' ? signature : null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to record acknowledgment');
      }

      setModification(result.data);
      setShowAckDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Modification Details" compact />
        <PageContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!modification) {
    return (
      <>
        <PageHeader title="Modification Not Found" compact />
        <PageContent>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Plan modification not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/treatment/plans/${id}/modifications`)}
              >
                Back to Modifications
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const plan = modification.treatmentPlan;
  const needsAcknowledgment = modification.requiresAcknowledgment && !modification.acknowledgedAt;

  return (
    <>
      <PageHeader
        title="Modification Details"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Modifications', href: `/treatment/plans/${id}/modifications` },
          { label: modificationTypeLabels[modification.modificationType] },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/plans/${id}/modifications`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
            {needsAcknowledgment && (
              <Button onClick={() => setShowAckDialog(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Record Acknowledgment
              </Button>
            )}
          </div>
        }
      />

      <PageContent>
        {/* Pending Acknowledgment Alert */}
        {needsAcknowledgment && (
          <Alert className="border-warning bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription>
              This modification requires patient acknowledgment before it becomes effective.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modification Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={modificationTypeVariants[modification.modificationType] || 'secondary'}>
                        {modificationTypeLabels[modification.modificationType] || modification.modificationType}
                      </Badge>
                      {modification.createsNewVersion && (
                        <Badge variant="outline">
                          <GitBranch className="h-3 w-3 mr-1" />
                          v{modification.previousVersion} → v{modification.newVersion}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{modification.changeDescription}</CardTitle>
                  </div>
                  {modification.acknowledgedAt ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Acknowledged
                    </Badge>
                  ) : modification.requiresAcknowledgment ? (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reason for Change</p>
                  <p>{modification.reason}</p>
                </div>

                {/* Changed Fields */}
                {modification.changedFields && Object.keys(modification.changedFields).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Changed Fields</p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {Object.entries(modification.changedFields).map(([field, change]) => (
                        <div key={field} className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through">
                              {String(change.old ?? 'Not set')}
                            </span>
                            <span>→</span>
                            <span className="font-medium">{String(change.new ?? 'Not set')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Impact */}
                {modification.feeChangeAmount !== null && modification.feeChangeAmount !== 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Financial Impact</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span>Previous Fee</span>
                        <span>${modification.previousFee?.toLocaleString() ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>New Fee</span>
                        <span>${modification.newFee?.toLocaleString() ?? 'N/A'}</span>
                      </div>
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t font-medium ${
                        modification.feeChangeAmount > 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        <span>Change</span>
                        <span>
                          {modification.feeChangeAmount > 0 ? '+' : ''}
                          ${modification.feeChangeAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acknowledgment Details */}
            {modification.acknowledgedAt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Acknowledgment Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Acknowledged By</p>
                      <p className="font-medium">
                        {modification.acknowledgedBy
                          ? `${modification.acknowledgedBy.firstName} ${modification.acknowledgedBy.lastName}`
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(modification.acknowledgedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Method</p>
                      <p className="font-medium capitalize">
                        {modification.acknowledgmentMethod || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  {modification.acknowledgmentNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p>{modification.acknowledgmentNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Previous State Snapshot */}
            {modification.previousStateSnapshot && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Previous State (v{modification.previousVersion})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    {Object.entries(modification.previousStateSnapshot).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span>{String(value ?? 'Not set')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Modification Info */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Modification Info</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(modification.modificationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {modification.modifiedBy.title ? `${modification.modifiedBy.title} ` : ''}
                    {modification.modifiedBy.firstName} {modification.modifiedBy.lastName}
                  </span>
                </div>
                {modification.createsNewVersion && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Version {modification.previousVersion} → {modification.newVersion}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <p className="font-medium">{plan.planName}</p>
                <p className="text-sm text-muted-foreground">{plan.planNumber}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{plan.version}</Badge>
                  <Badge variant="secondary">{plan.status}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => router.push(`/treatment/plans/${id}`)}
                >
                  View Plan
                </Button>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Requirements</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Creates New Version</span>
                  {modification.createsNewVersion ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Requires Acknowledgment</span>
                  {modification.requiresAcknowledgment ? (
                    modification.acknowledgedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Requires New Consent</span>
                  {modification.requiresNewConsent ? (
                    modification.newConsentObtained ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>

      {/* Acknowledgment Dialog */}
      <Dialog open={showAckDialog} onOpenChange={setShowAckDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Patient Acknowledgment</DialogTitle>
            <DialogDescription>
              Document that the patient has been informed of and acknowledges this plan modification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField label="Acknowledgment Method">
              <Select value={ackMethod} onValueChange={setAckMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal">Verbal Confirmation</SelectItem>
                  <SelectItem value="signature">Digital Signature</SelectItem>
                  <SelectItem value="portal">Patient Portal</SelectItem>
                  <SelectItem value="written">Written Document</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {ackMethod === 'signature' && (
              <FormField label="Patient Signature">
                <SignatureCanvas onSignatureChange={setSignature} />
              </FormField>
            )}

            <FormField label="Notes (optional)">
              <Textarea
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="Any additional notes about the acknowledgment..."
                rows={3}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAckDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={acknowledging}>
              {acknowledging ? 'Recording...' : 'Record Acknowledgment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
