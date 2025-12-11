'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  SmilePlus,
  Calendar,
  Package,
  TrendingUp,
  AlertCircle,
  Plus,
  Clock,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
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
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';

interface AlignerDelivery {
  id: string;
  alignerNumbers: string;
  deliveredDate: string;
  wearInstructions: string | null;
  notes: string | null;
  deliveredBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface AlignerDetail {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentPlan: {
    id: string;
    planName: string;
    status: string;
  } | null;
  alignerSystem: string;
  caseNumber: string | null;
  totalAligners: number;
  currentAligner: number;
  refinementNumber: number;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  actualEndDate: string | null;
  changeFrequency: number;
  alignersDelivered: number;
  averageWearHours: number | null;
  complianceNotes: string | null;
  notes: string | null;
  deliveries: AlignerDelivery[];
  createdAt: string;
  updatedAt: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  SUBMITTED: 'info',
  APPROVED: 'info',
  MANUFACTURING: 'warning',
  IN_PROGRESS: 'success',
  REFINEMENT: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'secondary',
};

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  MANUFACTURING: 'Manufacturing',
  IN_PROGRESS: 'In Progress',
  REFINEMENT: 'Refinement',
  COMPLETED: 'Completed',
  DISCONTINUED: 'Discontinued',
};

export default function AlignerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [aligner, setAligner] = useState<AlignerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAligner = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/aligners/${id}`);
      const data = await res.json();

      if (data.success) {
        setAligner(data.data);
      } else {
        setError(data.error?.message || 'Failed to load aligner case');
      }
    } catch (err) {
      console.error('Error fetching aligner:', err);
      setError('Failed to load aligner case');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAligner();
  }, [fetchAligner]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/aligners/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/treatment/appliances/aligners');
      } else {
        setError(data.error?.message || 'Failed to delete aligner case');
      }
    } catch (err) {
      console.error('Error deleting aligner:', err);
      setError('Failed to delete aligner case');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Appliances', href: '/treatment/appliances' },
            { label: 'Aligners', href: '/treatment/appliances/aligners' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading aligner case details...
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  if (error || !aligner) {
    return (
      <>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Appliances', href: '/treatment/appliances' },
            { label: 'Aligners', href: '/treatment/appliances/aligners' },
            { label: 'Error' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">{error || 'Aligner case not found'}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/aligners')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Aligners
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const progressPercent = Math.round((aligner.currentAligner / aligner.totalAligners) * 100);
  const remainingAligners = aligner.totalAligners - aligner.currentAligner;

  return (
    <>
      <PageHeader
        title={`${aligner.alignerSystem} Case`}
        description={aligner.caseNumber ? `Case #${aligner.caseNumber}` : undefined}
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Aligners', href: '/treatment/appliances/aligners' },
          { label: aligner.alignerSystem },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/appliances/aligners/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={aligner.deliveries.length > 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Aligner Case?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the aligner
                    case from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <PageContent>
        {/* Progress Stats */}
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{progressPercent}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
            <Progress value={progressPercent} className="h-2 mt-2" />
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Aligner</p>
                <p className="text-2xl font-bold">{aligner.currentAligner}/{aligner.totalAligners}</p>
              </div>
              <SmilePlus className="h-8 w-8 text-accent-500" />
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">{remainingAligners}</p>
              </div>
              <Package className="h-8 w-8 text-success-500" />
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Wear Hours</p>
                <p className="text-2xl font-bold">
                  {aligner.averageWearHours ? `${aligner.averageWearHours}h` : 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning-500" />
            </div>
          </StatCard>
        </StatsRow>

        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">
                      <Link
                        href={`/patients/${aligner.patient.id}`}
                        className="text-primary hover:underline"
                      >
                        <PhiProtected fakeData={getFakeName()}>
                          {aligner.patient.firstName} {aligner.patient.lastName}
                        </PhiProtected>
                      </Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={statusVariants[aligner.status] || 'secondary'}>
                      {statusLabels[aligner.status] || aligner.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aligner System</p>
                    <p className="font-medium">{aligner.alignerSystem}</p>
                  </div>
                  {aligner.caseNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Case Number</p>
                      <p className="font-medium">{aligner.caseNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Change Frequency</p>
                    <p className="font-medium">Every {aligner.changeFrequency} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aligners Delivered</p>
                    <p className="font-medium">{aligner.alignersDelivered} of {aligner.totalAligners}</p>
                  </div>
                  {aligner.refinementNumber > 0 && (
                    <div className="col-span-2">
                      <Badge variant="outline">Refinement #{aligner.refinementNumber}</Badge>
                    </div>
                  )}
                </div>

                {aligner.complianceNotes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Compliance Notes</p>
                    <p className="text-sm">{aligner.complianceNotes}</p>
                  </div>
                )}

                {aligner.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{aligner.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deliveries */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Aligner Deliveries</CardTitle>
                <Button
                  size="sm"
                  onClick={() => router.push(`/treatment/appliances/aligners/${id}/deliveries/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Delivery
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {aligner.deliveries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No deliveries recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {aligner.deliveries.map((delivery) => (
                      <ListItem
                        key={delivery.id}
                        className="px-4"
                        leading={
                          <div className="p-2 rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                      >
                        <ListItemTitle>
                          Aligners: {delivery.alignerNumbers}
                        </ListItemTitle>
                        <ListItemDescription>
                          <span className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(delivery.deliveredDate).toLocaleDateString()}
                            {delivery.deliveredBy && (
                              <span>• by {delivery.deliveredBy.firstName} {delivery.deliveredBy.lastName}</span>
                            )}
                          </span>
                          {delivery.wearInstructions && (
                            <span className="block text-xs mt-1">{delivery.wearInstructions}</span>
                          )}
                        </ListItemDescription>
                      </ListItem>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(aligner.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {aligner.estimatedEndDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Calendar className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated End</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(aligner.estimatedEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {aligner.actualEndDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Calendar className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(aligner.actualEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>Created: {new Date(aligner.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(aligner.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            {aligner.treatmentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/treatment/plans/${aligner.treatmentPlan.id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{aligner.treatmentPlan.planName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {aligner.treatmentPlan.status.toLowerCase().replace('_', ' ')}
                    </p>
                  </Link>
                </CardContent>
              </Card>
            )}
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
