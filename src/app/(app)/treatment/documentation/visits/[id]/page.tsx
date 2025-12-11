'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Stethoscope,
  AlertCircle,
  Ruler,
  CheckCircle,
  XCircle,
  Edit,
  Play,
  Image,
  Plus,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
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
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';

interface VisitRecordDetail {
  id: string;
  visitDate: string;
  visitType: string;
  status: string;
  chiefComplaint: string | null;
  visitSummary: string | null;
  nextVisitRecommendation: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  treatmentDuration: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
  };
  primaryProvider: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  assistingStaff: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  treatmentPlan: {
    id: string;
    planNumber: string;
    planType: string;
    status: string;
  } | null;
  progressNote: {
    id: string;
    noteDate: string;
    status: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  } | null;
  procedures: Array<{
    id: string;
    procedureCode: string;
    description: string;
    status: string;
    performedAt: string | null;
  }>;
  findings: Array<{
    id: string;
    findingType: string;
    description: string;
    severity: string | null;
    actionRequired: boolean;
  }>;
  measurements: Array<{
    id: string;
    measurementType: string;
    value: number;
    unit: string;
    recordedAt: string;
  }>;
  completedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const visitTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  PROGRESS: 'Progress',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  CONSULTATION: 'Consultation',
  RECORDS: 'Records',
  DEBOND: 'Debond',
  RETENTION: 'Retention',
  OTHER: 'Other',
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETE: 'Complete',
  INCOMPLETE: 'Incomplete',
  CANCELLED: 'Cancelled',
};

const statusVariants: Record<string, 'warning' | 'success' | 'secondary' | 'destructive'> = {
  IN_PROGRESS: 'warning',
  COMPLETE: 'success',
  INCOMPLETE: 'secondary',
  CANCELLED: 'destructive',
};

const findingTypeLabels: Record<string, string> = {
  DECALCIFICATION: 'Decalcification',
  CARIES: 'Caries',
  GINGIVITIS: 'Gingivitis',
  BRACKET_ISSUE: 'Bracket Issue',
  WIRE_ISSUE: 'Wire Issue',
  ELASTIC_COMPLIANCE: 'Elastic Compliance',
  ORAL_HYGIENE: 'Oral Hygiene',
  ROOT_RESORPTION: 'Root Resorption',
  OTHER: 'Other',
};

const severityVariants: Record<string, 'success' | 'warning' | 'destructive'> = {
  MILD: 'success',
  MODERATE: 'warning',
  SEVERE: 'destructive',
};

const measurementTypeLabels: Record<string, string> = {
  OVERJET: 'Overjet',
  OVERBITE: 'Overbite',
  CROWDING_UPPER: 'Crowding (Upper)',
  CROWDING_LOWER: 'Crowding (Lower)',
  SPACING_UPPER: 'Spacing (Upper)',
  SPACING_LOWER: 'Spacing (Lower)',
};

export default function VisitRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [visit, setVisit] = useState<VisitRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [visitSummary, setVisitSummary] = useState('');
  const [nextVisitRecommendation, setNextVisitRecommendation] = useState('');

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/visit-records/${id}`);
        const data = await res.json();

        if (data.success) {
          setVisit(data.data);
          setVisitSummary(data.data.visitSummary || '');
          setNextVisitRecommendation(data.data.nextVisitRecommendation || '');
        } else {
          setError(data.error?.message || 'Failed to load visit record');
        }
      } catch (err) {
        console.error('Error fetching visit:', err);
        setError('Failed to load visit record');
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [id]);

  const handleComplete = async () => {
    if (!visitSummary.trim()) return;

    setCompleting(true);
    try {
      const res = await fetch(`/api/visit-records/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitSummary,
          nextVisitRecommendation: nextVisitRecommendation || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVisit(data.data);
        setCompleteDialogOpen(false);
      } else {
        setError(data.error?.message || 'Failed to complete visit');
      }
    } catch (err) {
      console.error('Error completing visit:', err);
      setError('Failed to complete visit');
    } finally {
      setCompleting(false);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not recorded';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Visit Record"
          description="Loading..."
          compact
        />
        <PageContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !visit) {
    return (
      <>
        <PageHeader
          title="Visit Record"
          description="Error loading visit"
          compact
          actions={
            <Button variant="outline" onClick={() => router.push('/treatment/documentation/visits')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Visits
            </Button>
          }
        />
        <PageContent>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error || 'Visit record not found'}</p>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`;

  return (
    <>
      <PageHeader
        title="Visit Record"
        description={`${visitTypeLabels[visit.visitType] || visit.visitType} visit on ${new Date(visit.visitDate).toLocaleDateString()}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Visits', href: '/treatment/documentation/visits' },
          { label: `Visit ${new Date(visit.visitDate).toLocaleDateString()}` },
        ]}
        actions={
          <div className="flex gap-2">
            {visit.status === 'IN_PROGRESS' && (
              <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Visit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete Visit</AlertDialogTitle>
                    <AlertDialogDescription>
                      Add a summary for this visit and mark it as complete.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <FormField label="Visit Summary" required>
                      <Textarea
                        value={visitSummary}
                        onChange={(e) => setVisitSummary(e.target.value)}
                        placeholder="Summarize the visit, treatment performed, and patient status..."
                        rows={4}
                      />
                    </FormField>
                    <FormField label="Next Visit Recommendation">
                      <Textarea
                        value={nextVisitRecommendation}
                        onChange={(e) => setNextVisitRecommendation(e.target.value)}
                        placeholder="Recommendations for next visit (optional)..."
                        rows={2}
                      />
                    </FormField>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleComplete}
                      disabled={!visitSummary.trim() || completing}
                    >
                      {completing ? 'Completing...' : 'Complete Visit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => router.push('/treatment/documentation/visits')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Visits
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Visit Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visit Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(visit.visitDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {visit.checkInTime ? (
                    <>
                      {formatTime(visit.checkInTime)}
                      {visit.checkOutTime && ` - ${formatTime(visit.checkOutTime)}`}
                    </>
                  ) : (
                    'Not recorded'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{formatDuration(visit.treatmentDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Primary Provider</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <PhiProtected fakeData={getFakeName()}>
                    {visit.primaryProvider.title ? `${visit.primaryProvider.title} ` : ''}
                    {visit.primaryProvider.firstName} {visit.primaryProvider.lastName}
                  </PhiProtected>
                </p>
              </div>
            </div>

            {visit.chiefComplaint && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-1">Chief Complaint</p>
                <p className="font-medium">
                  <PhiProtected fakeData="Patient reports discomfort...">
                    {visit.chiefComplaint}
                  </PhiProtected>
                </p>
              </div>
            )}

            {visit.visitSummary && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Visit Summary</p>
                <p className="font-medium">
                  <PhiProtected fakeData="Routine adjustment completed. Patient tolerating treatment well...">
                    {visit.visitSummary}
                  </PhiProtected>
                </p>
              </div>
            )}

            {visit.nextVisitRecommendation && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Next Visit Recommendation</p>
                <p className="font-medium">
                  <PhiProtected fakeData="Continue current treatment, schedule follow-up in 4-6 weeks.">
                    {visit.nextVisitRecommendation}
                  </PhiProtected>
                </p>
              </div>
            )}

            {visit.assistingStaff.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Assisting Staff</p>
                <div className="flex flex-wrap gap-2">
                  {visit.assistingStaff.map((staff) => (
                    <Badge key={staff.id} variant="outline">
                      <PhiProtected fakeData={getFakeName()}>
                        {staff.firstName} {staff.lastName}
                      </PhiProtected>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Progress Note */}
            <Card>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Progress Note
                  </CardTitle>
                  {visit.progressNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/treatment/documentation/notes/${visit.progressNote!.id}`)}
                    >
                      View Full Note
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent compact>
                {visit.progressNote ? (
                  <div className="space-y-4">
                    {visit.progressNote.subjective && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Subjective</p>
                        <p className="text-sm">
                          <PhiProtected fakeData="Patient reports no pain or discomfort. Compliant with oral hygiene instructions.">
                            {visit.progressNote.subjective}
                          </PhiProtected>
                        </p>
                      </div>
                    )}
                    {visit.progressNote.objective && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Objective</p>
                        <p className="text-sm">
                          <PhiProtected fakeData="Oral hygiene: Good. All brackets intact. No tissue irritation noted.">
                            {visit.progressNote.objective}
                          </PhiProtected>
                        </p>
                      </div>
                    )}
                    {visit.progressNote.assessment && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Assessment</p>
                        <p className="text-sm">
                          <PhiProtected fakeData="Treatment progressing as planned. Alignment improving as expected.">
                            {visit.progressNote.assessment}
                          </PhiProtected>
                        </p>
                      </div>
                    )}
                    {visit.progressNote.plan && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                        <p className="text-sm">
                          <PhiProtected fakeData="Continue current archwire. Schedule next appointment in 4-6 weeks.">
                            {visit.progressNote.plan}
                          </PhiProtected>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No progress note attached</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => router.push('/treatment/documentation/notes/new')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Progress Note
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procedures */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Procedures ({visit.procedures.length})
                </CardTitle>
              </CardHeader>
              <CardContent compact className="p-0">
                {visit.procedures.length > 0 ? (
                  <div className="divide-y">
                    {visit.procedures.map((proc) => (
                      <div key={proc.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{proc.procedureCode}</p>
                          <p className="text-sm text-muted-foreground">{proc.description}</p>
                        </div>
                        <Badge variant={proc.status === 'COMPLETED' ? 'success' : 'secondary'}>
                          {proc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Stethoscope className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No procedures recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Treatment Plan Info */}
            {visit.treatmentPlan && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plan #</span>
                      <span className="font-medium">{visit.treatmentPlan.planNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{visit.treatmentPlan.planType}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={visit.treatmentPlan.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {visit.treatmentPlan.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => router.push(`/treatment/plans/${visit.treatmentPlan!.id}`)}
                  >
                    View Treatment Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Clinical Findings */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Findings ({visit.findings.length})
                </CardTitle>
              </CardHeader>
              <CardContent compact className="p-0">
                {visit.findings.length > 0 ? (
                  <div className="divide-y">
                    {visit.findings.map((finding) => (
                      <div key={finding.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">
                            {findingTypeLabels[finding.findingType] || finding.findingType}
                          </Badge>
                          {finding.severity && (
                            <Badge variant={severityVariants[finding.severity] || 'secondary'}>
                              {finding.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{finding.description}</p>
                        {finding.actionRequired && (
                          <Badge variant="warning" className="mt-1 text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No findings recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Measurements */}
            <Card>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Measurements ({visit.measurements.length})
                  </CardTitle>
                  {visit.measurements.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/treatment/documentation/measurements/trends?patientId=${visit.patient.id}`)}
                    >
                      View Trends
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent compact className="p-0">
                {visit.measurements.length > 0 ? (
                  <div className="divide-y">
                    {visit.measurements.map((measurement) => (
                      <div key={measurement.id} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm">
                          {measurementTypeLabels[measurement.measurementType] || measurement.measurementType}
                        </span>
                        <span className="font-medium">
                          {measurement.value} {measurement.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <Ruler className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No measurements recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completion Info */}
            {visit.completedAt && visit.completedBy && (
              <Card variant="ghost">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>
                      Completed by{' '}
                      <PhiProtected fakeData={getFakeName()}>
                        {visit.completedBy.firstName} {visit.completedBy.lastName}
                      </PhiProtected>
                      {' '}on {new Date(visit.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
