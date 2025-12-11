'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleDot,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ElasticPrescription {
  id: string;
  elasticType: string;
  elasticSize: string;
  elasticForce: string | null;
  fromTooth: number;
  toTooth: number;
  configuration: string | null;
  wearSchedule: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  discontinuedDate: string | null;
  discontinuedReason: string | null;
  complianceNotes: string | null;
  instructions: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  prescribedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  treatmentPlan: {
    id: string;
    planNumber: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const elasticTypeLabels: Record<string, string> = {
  CLASS_II: 'Class II',
  CLASS_III: 'Class III',
  VERTICAL: 'Vertical',
  CROSS: 'Cross',
  BOX: 'Box',
  TRIANGLE: 'Triangle',
  ZIG_ZAG: 'Zig-Zag',
  CUSTOM: 'Custom',
};

const elasticSizeLabels: Record<string, string> = {
  LIGHT_1_8: '1/8" Light',
  LIGHT_3_16: '3/16" Light',
  MEDIUM_1_4: '1/4" Medium',
  MEDIUM_5_16: '5/16" Medium',
  HEAVY_3_8: '3/8" Heavy',
  HEAVY_1_2: '1/2" Heavy',
};

const elasticTypeDescriptions: Record<string, string> = {
  CLASS_II: 'Used to correct Class II malocclusion by moving upper teeth back or lower teeth forward',
  CLASS_III: 'Used to correct Class III malocclusion by moving lower teeth back or upper teeth forward',
  VERTICAL: 'Used for open bite or deep bite correction',
  CROSS: 'Used to correct crossbite relationships',
  BOX: 'Four-point configuration for complex movements',
  TRIANGLE: 'Three-point configuration for targeted movements',
  ZIG_ZAG: 'Alternating pattern for specific tooth movements',
  CUSTOM: 'Custom configuration as prescribed',
};

export default function ElasticDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [elastic, setElastic] = useState<ElasticPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [discontinueOpen, setDiscontinueOpen] = useState(false);
  const [discontinueReason, setDiscontinueReason] = useState('');
  const [discontinuing, setDiscontinuing] = useState(false);

  const fetchElastic = useCallback(async () => {
    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`);
      const data = await res.json();
      if (data.success) {
        setElastic(data.data);
      }
    } catch (error) {
      console.error('Error fetching elastic:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchElastic();
  }, [fetchElastic]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/treatment/appliances/elastics');
      }
    } catch (error) {
      console.error('Error deleting elastic:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDiscontinue = async () => {
    setDiscontinuing(true);
    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: false,
          discontinuedDate: new Date(),
          discontinuedReason: discontinueReason || 'Discontinued by provider',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setElastic(data.data);
        setDiscontinueOpen(false);
        setDiscontinueReason('');
      }
    } catch (error) {
      console.error('Error discontinuing elastic:', error);
    } finally {
      setDiscontinuing(false);
    }
  };

  const handleReactivate = async () => {
    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: true,
          discontinuedDate: null,
          discontinuedReason: null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setElastic(data.data);
      }
    } catch (error) {
      console.error('Error reactivating elastic:', error);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Elastic Prescription" compact />
        <PageContent>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </>
    );
  }

  if (!elastic) {
    return (
      <>
        <PageHeader title="Elastic Prescription" compact />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Elastic prescription not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/elastics')}
              >
                Back to Elastics
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(elastic.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <PageHeader
        title="Elastic Prescription"
        description={`${elasticTypeLabels[elastic.elasticType]} - ${elasticSizeLabels[elastic.elasticSize]}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Elastics', href: '/treatment/appliances/elastics' },
          { label: elasticTypeLabels[elastic.elasticType] || 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/appliances/elastics/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this elastic prescription? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            {!elastic.isActive && (
              <Card variant="ghost" className="border-warning-200 bg-warning-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-warning-600" />
                      <div>
                        <p className="font-medium text-warning-800">Prescription Discontinued</p>
                        {elastic.discontinuedDate && (
                          <p className="text-sm text-warning-600">
                            Discontinued on {new Date(elastic.discontinuedDate).toLocaleDateString()}
                            {elastic.discontinuedReason && ` - ${elastic.discontinuedReason}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleReactivate}>
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescription Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5" />
                    Prescription Details
                  </CardTitle>
                  <Badge variant={elastic.isActive ? 'success' : 'secondary'}>
                    {elastic.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Elastic Type</p>
                    <p className="font-medium">{elasticTypeLabels[elastic.elasticType]}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {elasticTypeDescriptions[elastic.elasticType]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size & Force</p>
                    <p className="font-medium">{elasticSizeLabels[elastic.elasticSize]}</p>
                    {elastic.elasticForce && (
                      <p className="text-sm text-muted-foreground">{elastic.elasticForce}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attachment Points</p>
                    <p className="font-medium">
                      Tooth #{elastic.fromTooth} → Tooth #{elastic.toTooth}
                    </p>
                    {elastic.configuration && (
                      <p className="text-sm text-muted-foreground">{elastic.configuration}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wear Schedule</p>
                    <p className="font-medium">{elastic.wearSchedule}</p>
                    <p className="text-sm text-muted-foreground">{elastic.hoursPerDay} hours/day</p>
                  </div>
                </div>

                {elastic.instructions && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Special Instructions</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{elastic.instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Prescription Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(elastic.createdAt).toLocaleDateString()} at{' '}
                        {new Date(elastic.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(elastic.startDate).toLocaleDateString()}
                        {elastic.isActive && ` (${daysSinceStart} days ago)`}
                      </p>
                    </div>
                  </div>

                  {elastic.discontinuedDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">Discontinued</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(elastic.discontinuedDate).toLocaleDateString()}
                          {elastic.discontinuedReason && ` - ${elastic.discontinuedReason}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {elastic.endDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Target End Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(elastic.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Notes */}
            {elastic.complianceNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{elastic.complianceNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhiProtected fakeData={getFakeName()}>
                  <p className="font-medium">
                    {elastic.patient.firstName} {elastic.patient.lastName}
                  </p>
                </PhiProtected>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/patients/${elastic.patient.id}`)}
                >
                  View Patient Profile
                </Button>
              </CardContent>
            </Card>

            {/* Provider Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prescribed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {elastic.prescribedBy.title || 'Dr.'} {elastic.prescribedBy.firstName}{' '}
                  {elastic.prescribedBy.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(elastic.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Treatment Plan Link */}
            {elastic.treatmentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{elastic.treatmentPlan.planNumber}</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push(`/treatment/plans/${elastic.treatmentPlan!.id}`)}
                  >
                    View Treatment Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Days Active</span>
                  <span className="font-medium">{daysSinceStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Wear</span>
                  <span className="font-medium">{elastic.hoursPerDay}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expected Weekly</span>
                  <span className="font-medium">{elastic.hoursPerDay * 7}h</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {elastic.isActive && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDiscontinueOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Discontinue Prescription
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContent>

      {/* Discontinue Dialog */}
      <Dialog open={discontinueOpen} onOpenChange={setDiscontinueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discontinue Elastic Prescription</DialogTitle>
            <DialogDescription>
              This will mark the prescription as inactive. You can reactivate it later if needed.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Reason for Discontinuation">
            <Textarea
              value={discontinueReason}
              onChange={(e) => setDiscontinueReason(e.target.value)}
              placeholder="e.g., Treatment phase complete, patient non-compliance..."
              rows={3}
            />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscontinueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDiscontinue} disabled={discontinuing}>
              {discontinuing ? 'Discontinuing...' : 'Discontinue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
