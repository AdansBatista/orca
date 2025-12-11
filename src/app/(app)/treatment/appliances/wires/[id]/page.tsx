'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cable,
  ArrowLeft,
  Calendar,
  User,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

interface WireRecordDetail {
  id: string;
  wireType: string;
  wireSize: string;
  wireMaterial: string;
  arch: string;
  placedDate: string;
  removedDate: string | null;
  status: string;
  sequenceNumber: number | null;
  bends: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  applianceRecord: {
    id: string;
    applianceType: string;
    applianceSystem: string | null;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
    treatmentPlan: {
      id: string;
      planNumber: string;
    } | null;
  } | null;
  placedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  removedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
}

const wireTypeLabels: Record<string, string> = {
  NITI_ROUND: 'NiTi Round',
  NITI_RECTANGULAR: 'NiTi Rectangular',
  NITI_HEAT_ACTIVATED: 'NiTi Heat-Activated',
  SS_ROUND: 'SS Round',
  SS_RECTANGULAR: 'SS Rectangular',
  TMA: 'TMA',
  BETA_TITANIUM: 'Beta Titanium',
  BRAIDED: 'Braided',
  COAXIAL: 'Coaxial',
};

const wireMaterialLabels: Record<string, string> = {
  NICKEL_TITANIUM: 'Nickel Titanium',
  STAINLESS_STEEL: 'Stainless Steel',
  TMA: 'TMA',
  BETA_TITANIUM: 'Beta Titanium',
  COPPER_NITI: 'Copper NiTi',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  REMOVED: 'Removed',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

const statusVariants: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  REMOVED: 'secondary',
  REPLACED: 'secondary',
  LOST: 'warning',
  BROKEN: 'destructive',
};

export default function WireRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [wire, setWire] = useState<WireRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeDate, setRemoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [removeReason, setRemoveReason] = useState<string>('REPLACED');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const fetchWire = async () => {
      try {
        const res = await fetch(`/api/wires/${id}`);
        const data = await res.json();

        if (data.success) {
          setWire(data.data);
        } else {
          setError(data.error?.message || 'Failed to load wire record');
        }
      } catch (err) {
        console.error('Error fetching wire:', err);
        setError('Failed to load wire record');
      } finally {
        setLoading(false);
      }
    };

    fetchWire();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/wires/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        router.push('/treatment/appliances/wires');
      } else {
        setError(data.error?.message || 'Failed to delete wire record');
      }
    } catch (err) {
      console.error('Error deleting wire:', err);
      setError('Failed to delete wire record');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/wires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: removeReason,
          removedDate: new Date(removeDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWire(data.data);
        setRemoveDialogOpen(false);
      } else {
        setError(data.error?.message || 'Failed to update wire record');
      }
    } catch (err) {
      console.error('Error updating wire:', err);
      setError('Failed to update wire record');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Wire Record" description="Loading..." compact />
        <PageContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Skeleton className="h-64 lg:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !wire) {
    return (
      <>
        <PageHeader
          title="Wire Record"
          description="Error loading record"
          compact
          actions={
            <Button variant="outline" onClick={() => router.push('/treatment/appliances/wires')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wires
            </Button>
          }
        />
        <PageContent>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error || 'Wire record not found'}</p>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Wire Record"
        description={`${wireTypeLabels[wire.wireType] || wire.wireType} - ${wire.wireSize}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Wires', href: '/treatment/appliances/wires' },
          { label: wire.wireSize },
        ]}
        actions={
          <div className="flex gap-2">
            {wire.status === 'ACTIVE' && (
              <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Removed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Wire</AlertDialogTitle>
                    <AlertDialogDescription>
                      Record the removal of this wire from the patient.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <FormField label="Removal Date" required>
                      <Input
                        type="date"
                        value={removeDate}
                        onChange={(e) => setRemoveDate(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Reason">
                      <Select value={removeReason} onValueChange={setRemoveReason}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPLACED">Replaced with new wire</SelectItem>
                          <SelectItem value="REMOVED">Removed (treatment complete)</SelectItem>
                          <SelectItem value="BROKEN">Broken</SelectItem>
                          <SelectItem value="LOST">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} disabled={removing}>
                      {removing ? 'Updating...' : 'Confirm Removal'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Wire Record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this wire record? This action cannot be undone.
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
            <Button variant="outline" onClick={() => router.push('/treatment/appliances/wires')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wires
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Status Banner */}
        <Card className={wire.status === 'ACTIVE' ? 'border-success/50 bg-success/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  wire.status === 'ACTIVE' ? 'bg-success-100' : 'bg-muted'
                }`}>
                  <Cable className={`h-6 w-6 ${
                    wire.status === 'ACTIVE' ? 'text-success' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="font-medium">
                    {wireTypeLabels[wire.wireType] || wire.wireType} - {wire.wireSize}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {wireMaterialLabels[wire.wireMaterial] || wire.wireMaterial} • {archLabels[wire.arch]} Arch
                  </p>
                </div>
              </div>
              <Badge variant={statusVariants[wire.status] || 'secondary'} className="text-base px-3 py-1">
                {statusLabels[wire.status] || wire.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Wire Details */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Wire Details</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Wire Type</p>
                    <p className="font-medium">{wireTypeLabels[wire.wireType] || wire.wireType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wire Size</p>
                    <p className="font-medium">{wire.wireSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material</p>
                    <p className="font-medium">{wireMaterialLabels[wire.wireMaterial] || wire.wireMaterial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Arch</p>
                    <p className="font-medium">{archLabels[wire.arch] || wire.arch}</p>
                  </div>
                  {wire.sequenceNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sequence Number</p>
                      <p className="font-medium">#{wire.sequenceNumber}</p>
                    </div>
                  )}
                  {wire.bends && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Bends/Adjustments</p>
                      <p className="font-medium">{wire.bends}</p>
                    </div>
                  )}
                  {wire.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{wire.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-success-100">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(wire.placedDate).toLocaleDateString()} by{' '}
                        <PhiProtected fakeData={getFakeName()}>
                          {wire.placedBy.title ? `${wire.placedBy.title} ` : ''}
                          {wire.placedBy.firstName} {wire.placedBy.lastName}
                        </PhiProtected>
                      </p>
                    </div>
                  </div>
                  {wire.removedDate && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-muted">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{statusLabels[wire.status] || 'Removed'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(wire.removedDate).toLocaleDateString()}
                          {wire.removedBy && (
                            <>
                              {' '}by{' '}
                              <PhiProtected fakeData={getFakeName()}>
                                {wire.removedBy.title ? `${wire.removedBy.title} ` : ''}
                                {wire.removedBy.firstName} {wire.removedBy.lastName}
                              </PhiProtected>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Patient Info */}
            {wire.applianceRecord?.patient && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Patient</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="font-medium">
                    <PhiProtected fakeData={getFakeName()}>
                      {wire.applianceRecord.patient.firstName} {wire.applianceRecord.patient.lastName}
                    </PhiProtected>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => router.push(`/patients/${wire.applianceRecord!.patient.id}`)}
                  >
                    View Patient
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Appliance Record */}
            {wire.applianceRecord && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Appliance Record</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="font-medium">{wire.applianceRecord.applianceType}</p>
                  {wire.applianceRecord.applianceSystem && (
                    <p className="text-sm text-muted-foreground">
                      {wire.applianceRecord.applianceSystem}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => router.push(`/treatment/appliances/brackets/${wire.applianceRecord!.id}`)}
                  >
                    View Appliance
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Treatment Plan */}
            {wire.applianceRecord?.treatmentPlan && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="font-medium">{wire.applianceRecord.treatmentPlan.planNumber}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => router.push(`/treatment/plans/${wire.applianceRecord!.treatmentPlan!.id}`)}
                  >
                    View Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Record Info */}
            <Card variant="ghost">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p>Created: {new Date(wire.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(wire.updatedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
