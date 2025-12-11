'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Edit,
  FileSignature,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  FileText,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ProgressNote {
  id: string;
  noteDate: string;
  noteType: string;
  status: string;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  proceduresSummary: string | null;
  signedAt: string | null;
  coSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  supervisingProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  treatmentPlan?: {
    id: string;
    planNumber: string;
    planName: string;
  } | null;
  _count: {
    procedures: number;
    findings: number;
  };
}

const noteTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  CONSULTATION: 'Consultation',
  RECORDS_APPOINTMENT: 'Records',
  BONDING: 'Bonding',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  DEBOND: 'Debond',
  RETENTION_CHECK: 'Retention Check',
  OBSERVATION: 'Observation',
  GENERAL: 'General',
};

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  PENDING_SIGNATURE: 'warning',
  SIGNED: 'success',
  PENDING_COSIGN: 'info',
  COSIGNED: 'success',
  AMENDED: 'default',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  SIGNED: 'Signed',
  PENDING_COSIGN: 'Pending Co-sign',
  COSIGNED: 'Co-signed',
  AMENDED: 'Amended',
};

export default function ProgressNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [note, setNote] = useState<ProgressNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/progress-notes/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch note');
        }

        setNote(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleSign = async () => {
    setSigning(true);
    try {
      const response = await fetch(`/api/progress-notes/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to sign note');
      }

      setNote(result.data);
      setSignDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign note');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Progress Note"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Documentation', href: '/treatment/documentation' },
            { label: 'Progress Notes', href: '/treatment/documentation/notes' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-24" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !note) {
    return (
      <>
        <PageHeader
          title="Progress Note"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Documentation', href: '/treatment/documentation' },
            { label: 'Progress Notes', href: '/treatment/documentation/notes' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Note not found'}</AlertDescription>
          </Alert>
        </PageContent>
      </>
    );
  }

  const canEdit = note.status === 'DRAFT';
  const canSign = note.status === 'PENDING_SIGNATURE';

  return (
    <>
      <PageHeader
        title="Progress Note"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Progress Notes', href: '/treatment/documentation/notes' },
          { label: format(new Date(note.noteDate), 'MMM d, yyyy') },
        ]}
        actions={
          <div className="flex gap-2">
            {canEdit && (
              <Link href={`/treatment/documentation/notes/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canSign && (
              <Button onClick={() => setSignDialogOpen(true)}>
                <FileSignature className="h-4 w-4 mr-2" />
                Sign Note
              </Button>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base">
                      {noteTypeLabels[note.noteType] || note.noteType}
                    </Badge>
                    <Badge variant={statusBadgeVariant[note.status]}>
                      {statusLabels[note.status] || note.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(note.noteDate), 'MMMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Dr. {note.provider.firstName} {note.provider.lastName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <PhiProtected fakeData={getFakeName()}>
                    <p className="font-semibold text-lg">
                      {note.patient.firstName} {note.patient.lastName}
                    </p>
                  </PhiProtected>
                  {note.treatmentPlan && (
                    <Link
                      href={`/treatment/plans/${note.treatmentPlan.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {note.treatmentPlan.planName}
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chief Complaint */}
          {note.chiefComplaint && (
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Chief Complaint</CardTitle>
              </CardHeader>
              <CardContent compact>
                <p className="text-muted-foreground">{note.chiefComplaint}</p>
              </CardContent>
            </Card>
          )}

          {/* SOAP Content */}
          <DashboardGrid>
            <DashboardGrid.TwoThirds className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subjective */}
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Badge variant="info">S</Badge>
                      Subjective
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {note.subjective ? (
                      <p className="whitespace-pre-wrap text-sm">{note.subjective}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No subjective information recorded</p>
                    )}
                  </CardContent>
                </Card>

                {/* Objective */}
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Badge variant="warning">O</Badge>
                      Objective
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {note.objective ? (
                      <p className="whitespace-pre-wrap text-sm">{note.objective}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No objective findings recorded</p>
                    )}
                  </CardContent>
                </Card>

                {/* Assessment */}
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Badge variant="success">A</Badge>
                      Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {note.assessment ? (
                      <p className="whitespace-pre-wrap text-sm">{note.assessment}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No assessment recorded</p>
                    )}
                  </CardContent>
                </Card>

                {/* Plan */}
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Badge variant="secondary">P</Badge>
                      Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {note.plan ? (
                      <p className="whitespace-pre-wrap text-sm">{note.plan}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No plan recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Procedures Summary */}
              {note.proceduresSummary && (
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Procedures Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <p className="whitespace-pre-wrap text-sm">{note.proceduresSummary}</p>
                  </CardContent>
                </Card>
              )}
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird className="space-y-6">
              {/* Signature Info */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Signature Status
                  </CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-4">
                  <div className="flex items-center gap-3">
                    {note.signedAt ? (
                      <CheckCircle className="h-5 w-5 text-success-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-warning-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {note.signedAt ? 'Signed' : 'Awaiting Signature'}
                      </p>
                      {note.signedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.signedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>

                  {note.supervisingProvider && (
                    <div className="flex items-center gap-3">
                      {note.coSignedAt ? (
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {note.coSignedAt ? 'Co-signed' : 'Pending Co-signature'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {note.supervisingProvider.firstName} {note.supervisingProvider.lastName}
                        </p>
                        {note.coSignedAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(note.coSignedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Records */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Related Records</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Procedures</span>
                    </div>
                    <Badge variant="secondary">{note._count.procedures}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Findings</span>
                    </div>
                    <Badge variant="secondary">{note._count.findings}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card variant="ghost">
                <CardContent className="p-4">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span>{format(new Date(note.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>

        {/* Sign Dialog */}
        <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign Progress Note</DialogTitle>
              <DialogDescription>
                By signing this note, you certify that the information is accurate and complete.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSignDialogOpen(false)} disabled={signing}>
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={signing}>
                {signing ? 'Signing...' : 'Sign Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}
