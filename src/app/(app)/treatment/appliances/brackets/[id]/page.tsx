'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Calendar,
  User,
  LayoutGrid,
  Plus,
  AlertCircle,
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
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';

interface ApplianceDetail {
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
  applianceType: string;
  applianceSystem: string | null;
  manufacturer: string | null;
  specification: Record<string, unknown> | null;
  arch: string;
  toothNumbers: string[];
  status: string;
  placedDate: string | null;
  removedDate: string | null;
  notes: string | null;
  placedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  removedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  wireRecords: {
    id: string;
    wireType: string;
    arch: string;
    size: string | null;
    material: string | null;
    status: string;
    placedDate: string;
    sequenceNumber: number;
    placedBy: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

const applianceTypeLabels: Record<string, string> = {
  BRACKETS: 'Brackets',
  BANDS: 'Bands',
  EXPANDER: 'Expander',
  HERBST: 'Herbst',
  MARA: 'MARA',
  HEADGEAR: 'Headgear',
  FACEMASK: 'Facemask',
  TAD: 'TAD',
  ELASTICS: 'Elastics',
  SPRING: 'Spring',
  POWER_CHAIN: 'Power Chain',
  OTHER: 'Other',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  ACTIVE: 'success',
  ORDERED: 'info',
  RECEIVED: 'info',
  ADJUSTED: 'warning',
  REMOVED: 'secondary',
  REPLACED: 'secondary',
  LOST: 'destructive',
  BROKEN: 'destructive',
};

const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  ACTIVE: 'Active',
  ADJUSTED: 'Adjusted',
  REMOVED: 'Removed',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

const wireStatusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  REMOVED: 'Removed',
  BROKEN: 'Broken',
};

const wireTypeLabels: Record<string, string> = {
  INITIAL: 'Initial',
  WORKING: 'Working',
  FINISHING: 'Finishing',
  RECTANGULAR: 'Rectangular',
  ROUND: 'Round',
  SECTIONAL: 'Sectional',
};

export default function BracketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appliance, setAppliance] = useState<ApplianceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAppliance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appliances/${id}`);
      const data = await res.json();

      if (data.success) {
        setAppliance(data.data);
      } else {
        setError(data.error?.message || 'Failed to load appliance');
      }
    } catch (err) {
      console.error('Error fetching appliance:', err);
      setError('Failed to load appliance');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppliance();
  }, [fetchAppliance]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/appliances/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        router.push('/treatment/appliances/brackets');
      } else {
        setError(data.error?.message || 'Failed to delete appliance');
      }
    } catch (err) {
      console.error('Error deleting appliance:', err);
      setError('Failed to delete appliance');
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
            { label: 'Brackets', href: '/treatment/appliances/brackets' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading appliance details...
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  if (error || !appliance) {
    return (
      <>
        <PageHeader
          title="Error"
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Appliances', href: '/treatment/appliances' },
            { label: 'Brackets', href: '/treatment/appliances/brackets' },
            { label: 'Error' },
          ]}
        />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">{error || 'Appliance not found'}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/brackets')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Brackets
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
        title={`${applianceTypeLabels[appliance.applianceType] || appliance.applianceType} - ${archLabels[appliance.arch] || appliance.arch}`}
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Brackets', href: '/treatment/appliances/brackets' },
          { label: applianceTypeLabels[appliance.applianceType] || appliance.applianceType },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/appliances/brackets/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={appliance.wireRecords.length > 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Appliance Record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the appliance
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
            {/* Appliance Details */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Appliance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">
                      <Link
                        href={`/patients/${appliance.patient.id}`}
                        className="text-primary hover:underline"
                      >
                        <PhiProtected fakeData={getFakeName()}>
                          {appliance.patient.firstName} {appliance.patient.lastName}
                        </PhiProtected>
                      </Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={statusVariants[appliance.status] || 'secondary'}>
                      {statusLabels[appliance.status] || appliance.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {applianceTypeLabels[appliance.applianceType] || appliance.applianceType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Arch</p>
                    <p className="font-medium">{archLabels[appliance.arch] || appliance.arch}</p>
                  </div>
                  {appliance.applianceSystem && (
                    <div>
                      <p className="text-sm text-muted-foreground">System</p>
                      <p className="font-medium">{appliance.applianceSystem}</p>
                    </div>
                  )}
                  {appliance.manufacturer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Manufacturer</p>
                      <p className="font-medium">{appliance.manufacturer}</p>
                    </div>
                  )}
                  {appliance.toothNumbers.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Teeth</p>
                      <p className="font-medium">{appliance.toothNumbers.join(', ')}</p>
                    </div>
                  )}
                </div>

                {appliance.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{appliance.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wire Records */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Wire Records</CardTitle>
                <Button
                  size="sm"
                  onClick={() => router.push(`/treatment/appliances/brackets/${id}/wires/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wire
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {appliance.wireRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No wire records yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {appliance.wireRecords.map((wire) => (
                      <ListItem
                        key={wire.id}
                        showArrow
                        className="px-4"
                        onClick={() => router.push(`/treatment/appliances/wires/${wire.id}`)}
                        leading={
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            #{wire.sequenceNumber}
                          </div>
                        }
                        trailing={
                          <Badge
                            variant={
                              wire.status === 'ACTIVE'
                                ? 'success'
                                : wire.status === 'BROKEN'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {wireStatusLabels[wire.status] || wire.status}
                          </Badge>
                        }
                      >
                        <ListItemTitle>
                          {wireTypeLabels[wire.wireType] || wire.wireType}
                          {wire.size && ` - ${wire.size}`}
                        </ListItemTitle>
                        <ListItemDescription>
                          <span className="flex items-center gap-2">
                            <span>{archLabels[wire.arch] || wire.arch}</span>
                            {wire.material && <span>• {wire.material}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(wire.placedDate).toLocaleDateString()}
                            </span>
                          </span>
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
                {appliance.placedDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Calendar className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appliance.placedDate).toLocaleDateString()}
                      </p>
                      {appliance.placedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {appliance.placedBy.title ? `${appliance.placedBy.title} ` : ''}
                          {appliance.placedBy.firstName} {appliance.placedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {appliance.removedDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Removed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appliance.removedDate).toLocaleDateString()}
                      </p>
                      {appliance.removedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {appliance.removedBy.title ? `${appliance.removedBy.title} ` : ''}
                          {appliance.removedBy.firstName} {appliance.removedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>Created: {new Date(appliance.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(appliance.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            {appliance.treatmentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/treatment/plans/${appliance.treatmentPlan.id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{appliance.treatmentPlan.planName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {appliance.treatmentPlan.status.toLowerCase().replace('_', ' ')}
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
