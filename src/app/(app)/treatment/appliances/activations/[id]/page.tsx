'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCw,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Info,
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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ApplianceActivation {
  id: string;
  activationDate: string;
  activationType: string;
  turns: number | null;
  millimeters: number | null;
  instructions: string | null;
  nextActivationDate: string | null;
  isPatientReported: boolean;
  reportedWearHours: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  applianceRecord: {
    id: string;
    applianceType: string;
    arch: string;
    status: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const applianceTypeLabels: Record<string, string> = {
  EXPANDER: 'Expander',
  HERBST: 'Herbst',
  DISTALIZER: 'Distalizer',
  FORSUS: 'Forsus',
  MARA: 'MARA',
  TWIN_BLOCK: 'Twin Block',
  HEADGEAR: 'Headgear',
  FACEMASK: 'Facemask',
  OTHER: 'Other',
};

export default function ActivationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [activation, setActivation] = useState<ApplianceActivation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchActivation = useCallback(async () => {
    try {
      const res = await fetch(`/api/appliance-activations/${id}`);
      const data = await res.json();
      if (data.success) {
        setActivation(data.data);
      }
    } catch (error) {
      console.error('Error fetching activation:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivation();
  }, [fetchActivation]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/appliance-activations/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/treatment/appliances/activations');
      }
    } catch (error) {
      console.error('Error deleting activation:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Activation Details" compact />
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

  if (!activation) {
    return (
      <>
        <PageHeader title="Activation Details" compact />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Activation record not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/activations')}
              >
                Back to Activations
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const isNextActivationDue = activation.nextActivationDate &&
    new Date(activation.nextActivationDate) <= new Date();

  return (
    <>
      <PageHeader
        title="Activation Details"
        description={`${activation.activationType} - ${new Date(activation.activationDate).toLocaleDateString()}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Activations', href: '/treatment/appliances/activations' },
          { label: activation.activationType },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/treatment/appliances/activations/${id}/edit`)}
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
                  <AlertDialogTitle>Delete Activation Record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this activation record? This action cannot be undone.
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
            {/* Next Activation Alert */}
            {isNextActivationDue && (
              <Card variant="ghost" className="border-warning-200 bg-warning-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-warning-600" />
                    <div>
                      <p className="font-medium text-warning-800">Next Activation Due</p>
                      <p className="text-sm text-warning-600">
                        The next activation was scheduled for{' '}
                        {new Date(activation.nextActivationDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activation Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <RotateCw className="h-5 w-5" />
                    Activation Details
                  </CardTitle>
                  <Badge variant={activation.isPatientReported ? 'info' : 'default'}>
                    {activation.isPatientReported ? 'Patient Reported' : 'Office Visit'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Activation Type</p>
                    <p className="font-medium">{activation.activationType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Activation Date</p>
                    <p className="font-medium">
                      {new Date(activation.activationDate).toLocaleDateString()}
                    </p>
                  </div>
                  {activation.turns !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Turns</p>
                      <p className="font-medium text-lg">{activation.turns}</p>
                      <p className="text-xs text-muted-foreground">
                        ~{(activation.turns * 0.25).toFixed(2)}mm expansion
                      </p>
                    </div>
                  )}
                  {activation.millimeters !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Millimeters</p>
                      <p className="font-medium text-lg">{activation.millimeters}mm</p>
                    </div>
                  )}
                  {activation.nextActivationDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Activation</p>
                      <p className="font-medium">
                        {new Date(activation.nextActivationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {activation.isPatientReported && activation.reportedWearHours !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reported Wear Hours</p>
                      <p className="font-medium">{activation.reportedWearHours}h/day</p>
                    </div>
                  )}
                </div>

                {activation.instructions && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Instructions</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{activation.instructions}</p>
                  </div>
                )}

                {activation.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{activation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appliance Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Appliance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Appliance Type</p>
                    <p className="font-medium">
                      {applianceTypeLabels[activation.applianceRecord.applianceType] || activation.applianceRecord.applianceType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Arch</p>
                    <p className="font-medium">{activation.applianceRecord.arch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={activation.applianceRecord.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {activation.applianceRecord.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-4"
                  onClick={() => router.push(`/treatment/appliances/${activation.applianceRecord.id}`)}
                >
                  View Appliance Record
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Record Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Activation Recorded</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activation.createdAt).toLocaleDateString()} at{' '}
                        {new Date(activation.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {activation.updatedAt !== activation.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activation.updatedAt).toLocaleDateString()} at{' '}
                          {new Date(activation.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    {activation.applianceRecord.patient.firstName} {activation.applianceRecord.patient.lastName}
                  </p>
                </PhiProtected>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/patients/${activation.applianceRecord.patient.id}`)}
                >
                  View Patient Profile
                </Button>
              </CardContent>
            </Card>

            {/* Performed By */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {activation.performedBy.title || 'Dr.'} {activation.performedBy.firstName}{' '}
                  {activation.performedBy.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(activation.activationDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activation.turns !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Turns</span>
                    <span className="font-medium">{activation.turns}</span>
                  </div>
                )}
                {activation.millimeters !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expansion</span>
                    <span className="font-medium">{activation.millimeters}mm</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="font-medium">
                    {activation.isPatientReported ? 'Patient' : 'Office'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/treatment/appliances/activations/new?applianceId=${activation.applianceRecord.id}`)}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Record New Activation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
