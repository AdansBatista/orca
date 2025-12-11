'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Calendar,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface RetainerDetail {
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
  retainerType: string;
  arch: string;
  material: string | null;
  status: string;
  orderedDate: string | null;
  receivedDate: string | null;
  deliveredDate: string | null;
  wearSchedule: string | null;
  nextCheckDate: string | null;
  replacementCount: number;
  isReplacement: boolean;
  notes: string | null;
  orderedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  deliveredBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const retainerTypeLabels: Record<string, string> = {
  HAWLEY: 'Hawley',
  ESSIX: 'Essix',
  VIVERA: 'Vivera',
  FIXED_BONDED: 'Fixed Bonded',
  SPRING_RETAINER: 'Spring Retainer',
  WRAP_AROUND: 'Wrap Around',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  ORDERED: 'info',
  IN_FABRICATION: 'warning',
  RECEIVED: 'info',
  DELIVERED: 'success',
  ACTIVE: 'success',
  REPLACED: 'secondary',
  LOST: 'destructive',
  BROKEN: 'destructive',
};

const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  IN_FABRICATION: 'In Fabrication',
  RECEIVED: 'Received',
  DELIVERED: 'Delivered',
  ACTIVE: 'Active',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

const wearScheduleLabels: Record<string, string> = {
  FULL_TIME: 'Full Time (22+ hours/day)',
  NIGHTS_ONLY: 'Nights Only (8-10 hours)',
  EVERY_OTHER_NIGHT: 'Every Other Night',
  FEW_NIGHTS_WEEK: 'Few Nights per Week',
  AS_NEEDED: 'As Needed',
};

export default function RetainerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [retainer, setRetainer] = useState<RetainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRetainer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/retainers/${id}`);
      const data = await res.json();

      if (data.success) {
        setRetainer(data.data);
      } else {
        setError(data.error?.message || 'Failed to load retainer');
      }
    } catch (err) {
      console.error('Error fetching retainer:', err);
      setError('Failed to load retainer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRetainer();
  }, [fetchRetainer]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/retainers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/treatment/appliances/retainers');
      } else {
        setError(data.error?.message || 'Failed to delete retainer');
      }
    } catch (err) {
      console.error('Error deleting retainer:', err);
      setError('Failed to delete retainer');
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
            { label: 'Retainers', href: '/treatment/appliances/retainers' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading retainer details...
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  if (error || !retainer) {
    return (
      <>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Appliances', href: '/treatment/appliances' },
            { label: 'Retainers', href: '/treatment/appliances/retainers' },
            { label: 'Error' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">{error || 'Retainer not found'}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/retainers')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Retainers
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${retainerTypeLabels[retainer.retainerType] || retainer.retainerType} - ${archLabels[retainer.arch] || retainer.arch}`}
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Retainers', href: '/treatment/appliances/retainers' },
          { label: retainerTypeLabels[retainer.retainerType] || retainer.retainerType },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/appliances/retainers/${id}/edit`)}
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
                  <AlertDialogTitle>Delete Retainer Record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the retainer
                    record from the system.
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
        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Retainer Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm">Retainer Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[retainer.status] || 'secondary'}>
                      {statusLabels[retainer.status] || retainer.status}
                    </Badge>
                    {retainer.isReplacement && (
                      <Badge variant="outline">Replacement</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">
                      <Link
                        href={`/patients/${retainer.patient.id}`}
                        className="text-primary hover:underline"
                      >
                        <PhiProtected fakeData={getFakeName()}>
                          {retainer.patient.firstName} {retainer.patient.lastName}
                        </PhiProtected>
                      </Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {retainerTypeLabels[retainer.retainerType] || retainer.retainerType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Arch</p>
                    <p className="font-medium">{archLabels[retainer.arch] || retainer.arch}</p>
                  </div>
                  {retainer.material && (
                    <div>
                      <p className="text-sm text-muted-foreground">Material</p>
                      <p className="font-medium">{retainer.material}</p>
                    </div>
                  )}
                  {retainer.replacementCount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Replacement Count</p>
                      <p className="font-medium">{retainer.replacementCount}</p>
                    </div>
                  )}
                </div>

                {retainer.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{retainer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wear Schedule */}
            {retainer.wearSchedule && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Retention Protocol</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {wearScheduleLabels[retainer.wearSchedule] || retainer.wearSchedule}
                      </p>
                      <p className="text-sm text-muted-foreground">Current Wear Schedule</p>
                    </div>
                  </div>

                  {retainer.nextCheckDate && (
                    <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-warning" />
                        <p className="text-sm font-medium">
                          Next Check: {new Date(retainer.nextCheckDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {retainer.orderedDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-info/10">
                      <Package className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ordered</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(retainer.orderedDate).toLocaleDateString()}
                      </p>
                      {retainer.orderedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {retainer.orderedBy.title ? `${retainer.orderedBy.title} ` : ''}
                          {retainer.orderedBy.firstName} {retainer.orderedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {retainer.receivedDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Package className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Received</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(retainer.receivedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {retainer.deliveredDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Shield className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(retainer.deliveredDate).toLocaleDateString()}
                      </p>
                      {retainer.deliveredBy && (
                        <p className="text-xs text-muted-foreground">
                          by {retainer.deliveredBy.title ? `${retainer.deliveredBy.title} ` : ''}
                          {retainer.deliveredBy.firstName} {retainer.deliveredBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>Created: {new Date(retainer.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(retainer.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            {retainer.treatmentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/treatment/plans/${retainer.treatmentPlan.id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{retainer.treatmentPlan.planName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {retainer.treatmentPlan.status.toLowerCase().replace('_', ' ')}
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
