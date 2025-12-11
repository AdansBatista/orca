'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Presentation,
  Clock,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  AlertCircle,
  CalendarCheck,
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

interface CasePresentationDetail {
  id: string;
  presentationDate: string;
  duration: number | null;
  outcome: string;
  attendees: string | null;
  locationDetails: string | null;
  presentationNotes: string | null;
  patientQuestions: string | null;
  patientConcerns: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpNotes: string | null;
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
  presenter: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  treatmentOptionsPresented: Array<{
    id: string;
    optionNumber: number;
    optionName: string;
    applianceSystem: string;
  }>;
}

const outcomeBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  ACCEPTED: 'success',
  DECLINED: 'destructive',
  CONSIDERING: 'warning',
  NEEDS_FOLLOWUP: 'info',
  RESCHEDULED: 'secondary',
};

const outcomeLabels: Record<string, string> = {
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CONSIDERING: 'Considering',
  NEEDS_FOLLOWUP: 'Needs Follow-up',
  RESCHEDULED: 'Rescheduled',
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

export default function CasePresentationDetailPage({
  params,
}: {
  params: Promise<{ id: string; presentationId: string }>;
}) {
  const { id: planId, presentationId } = use(params);
  const router = useRouter();
  const [presentation, setPresentation] = useState<CasePresentationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        const response = await fetch(`/api/case-presentations/${presentationId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch presentation');
        }

        setPresentation(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPresentation();
  }, [presentationId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/case-presentations/${presentationId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete presentation');
      }

      router.push(`/treatment/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Case Presentation" compact />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !presentation) {
    return (
      <>
        <PageHeader title="Case Presentation" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Presentation</h3>
              <p className="text-muted-foreground mb-4">{error || 'Presentation not found'}</p>
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

  const canEdit = !['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(
    presentation.treatmentPlan.status
  );
  const canDelete = canEdit;

  return (
    <>
      <PageHeader
        title="Case Presentation"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: presentation.treatmentPlan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'Presentation' },
        ]}
        actions={
          <div className="flex gap-2">
            {canEdit && (
              <Link href={`/treatment/plans/${planId}/presentations/${presentationId}/edit`}>
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
                    <AlertDialogTitle>Delete Presentation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this
                      case presentation record.
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
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Presentation className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Case Presentation
                      </h2>
                      <p className="text-muted-foreground">
                        {format(new Date(presentation.presentationDate), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={outcomeBadgeVariant[presentation.outcome]} className="text-sm">
                    {outcomeLabels[presentation.outcome]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Presentation Details */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Presentation Details</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {format(new Date(presentation.presentationDate), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {presentation.duration && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{presentation.duration} minutes</p>
                      </div>
                    </div>
                  )}
                  {presentation.locationDetails && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{presentation.locationDetails}</p>
                      </div>
                    </div>
                  )}
                  {presentation.attendees && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Attendees</p>
                        <p className="font-medium">{presentation.attendees}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Options Presented */}
            {presentation.treatmentOptionsPresented.length > 0 && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Treatment Options Presented</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-2">
                    {presentation.treatmentOptionsPresented.map((option) => (
                      <Link
                        key={option.id}
                        href={`/treatment/plans/${planId}/options/${option.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div>
                            <p className="font-medium">
                              Option {option.optionNumber}: {option.optionName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {applianceSystemLabels[option.applianceSystem]}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {(presentation.presentationNotes ||
              presentation.patientQuestions ||
              presentation.patientConcerns) && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes & Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-4">
                  {presentation.presentationNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Presentation Notes</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {presentation.presentationNotes}
                      </p>
                    </div>
                  )}
                  {presentation.patientQuestions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Patient Questions</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {presentation.patientQuestions}
                      </p>
                    </div>
                  )}
                  {presentation.patientConcerns && (
                    <div>
                      <p className="text-sm font-medium mb-1">Patient Concerns</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {presentation.patientConcerns}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Follow-up */}
            {presentation.followUpRequired && (
              <Card className="border-warning-200 bg-warning-50/50">
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2 text-warning-700">
                    <CalendarCheck className="h-4 w-4" />
                    Follow-up Required
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  {presentation.followUpDate && (
                    <p className="font-medium text-warning-700 mb-2">
                      Scheduled: {format(new Date(presentation.followUpDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  {presentation.followUpNotes && (
                    <p className="text-sm text-warning-600">{presentation.followUpNotes}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird className="space-y-4">
            {/* Patient */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Patient</CardTitle>
              </CardHeader>
              <CardContent compact>
                <Link
                  href={`/patients/${presentation.patient.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium">
                    <PhiProtected fakeData={getFakeName()}>
                      {presentation.patient.firstName} {presentation.patient.lastName}
                    </PhiProtected>
                  </p>
                  <p className="text-sm text-muted-foreground">View patient profile</p>
                </Link>
              </CardContent>
            </Card>

            {/* Presenter */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Presenter</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">
                    {presentation.presenter.title ? `${presentation.presenter.title} ` : ''}
                    {presentation.presenter.firstName} {presentation.presenter.lastName}
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    {presentation.treatmentPlan.planName || presentation.treatmentPlan.planNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {presentation.treatmentPlan.planNumber}
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
                <p>Created: {format(new Date(presentation.createdAt), 'MMM d, yyyy h:mm a')}</p>
                <p>Updated: {format(new Date(presentation.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
