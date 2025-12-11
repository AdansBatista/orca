'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Target,
  FileText,
  Plus,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  ListChecks,
  Presentation,
  FileSignature,
  Star,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface TreatmentOption {
  id: string;
  optionNumber: number;
  optionName: string;
  description: string | null;
  applianceSystem: string;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  estimatedCost: number | null;
  isRecommended: boolean;
  status: string;
  advantages: string[];
  disadvantages: string[];
}

interface CasePresentation {
  id: string;
  presentationDate: string;
  outcome: string;
  presentedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

interface CaseAcceptance {
  id: string;
  status: string;
  acceptedDate: string | null;
  selectedOption: {
    id: string;
    optionName: string;
  } | null;
}

interface TreatmentPlanDetail {
  id: string;
  planNumber: string;
  planName: string;
  planType: string | null;
  status: string;
  chiefComplaint: string | null;
  diagnosis: string[];
  treatmentGoals: string[];
  treatmentDescription: string | null;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  totalFee: number | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  actualEndDate: string | null;
  acceptedDate: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    patientNumber: string;
  };
  primaryProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  supervisingProvider?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  phases: {
    id: string;
    phaseName: string;
    phaseNumber: number;
    phaseType: string;
    status: string;
    progressPercent: number;
    plannedStartDate: string | null;
    plannedEndDate: string | null;
  }[];
  milestones: {
    id: string;
    milestoneName: string;
    status: string;
    targetDate: string | null;
    achievedDate: string | null;
  }[];
  treatmentOptions: TreatmentOption[];
  casePresentations: CasePresentation[];
  caseAcceptances: CaseAcceptance[];
  _count: {
    progressNotes: number;
  };
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary'> = {
  DRAFT: 'secondary',
  PRESENTED: 'info',
  ACCEPTED: 'soft-primary',
  ACTIVE: 'default',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'destructive',
  TRANSFERRED: 'secondary',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PRESENTED: 'Presented',
  ACCEPTED: 'Accepted',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  DISCONTINUED: 'Discontinued',
  TRANSFERRED: 'Transferred',
};

const phaseStatusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  NOT_STARTED: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

const phaseStatusLabels: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
};

const milestoneStatusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  ACHIEVED: 'success',
  MISSED: 'destructive',
  DEFERRED: 'warning',
};

const milestoneStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  ACHIEVED: 'Achieved',
  MISSED: 'Missed',
  DEFERRED: 'Deferred',
};

const optionStatusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  PRESENTED: 'info',
  SELECTED: 'success',
  DECLINED: 'destructive',
  ARCHIVED: 'secondary',
};

const optionStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PRESENTED: 'Presented',
  SELECTED: 'Selected',
  DECLINED: 'Declined',
  ARCHIVED: 'Archived',
};

const applianceSystemLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal',
  TRADITIONAL_CERAMIC: 'Traditional Ceramic',
  SELF_LIGATING_METAL: 'Self-Ligating Metal',
  SELF_LIGATING_CERAMIC: 'Self-Ligating Ceramic',
  LINGUAL: 'Lingual',
  INVISALIGN: 'Invisalign',
  CLEAR_ALIGNERS_OTHER: 'Clear Aligners (Other)',
  COMBINATION: 'Combination',
  OTHER: 'Other',
};

const presentationOutcomeBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  ACCEPTED: 'success',
  DECLINED: 'destructive',
  CONSIDERING: 'warning',
  NEEDS_FOLLOWUP: 'info',
  RESCHEDULED: 'secondary',
};

const presentationOutcomeLabels: Record<string, string> = {
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CONSIDERING: 'Considering',
  NEEDS_FOLLOWUP: 'Needs Follow-up',
  RESCHEDULED: 'Rescheduled',
};

const acceptanceStatusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  PENDING: 'secondary',
  PARTIALLY_SIGNED: 'warning',
  FULLY_SIGNED: 'success',
  EXPIRED: 'secondary',
  REVOKED: 'secondary',
};

const acceptanceStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PARTIALLY_SIGNED: 'Partially Signed',
  FULLY_SIGNED: 'Fully Signed',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

export default function TreatmentPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<TreatmentPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/treatment-plans/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment plan');
        }

        setPlan(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/treatment-plans/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete treatment plan');
      }

      router.push('/treatment/plans');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/treatment-plans/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to accept treatment plan');
      }

      setPlan(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const calculateOverallProgress = () => {
    if (!plan?.phases.length) return 0;
    const totalProgress = plan.phases.reduce((sum, phase) => sum + (phase.progressPercent || 0), 0);
    return Math.round(totalProgress / plan.phases.length);
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Treatment Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !plan) {
    return (
      <>
        <PageHeader
          title="Treatment Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Plan</h3>
              <p className="text-muted-foreground mb-4">{error || 'Treatment plan not found'}</p>
              <Link href="/treatment/plans">
                <Button variant="outline">Back to Plans</Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const canEdit = !['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(plan.status);
  const canDelete = plan.status === 'DRAFT';
  const canAccept = plan.status === 'PRESENTED';

  return (
    <>
      <PageHeader
        title={plan.planNumber}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber },
        ]}
        actions={
          <div className="flex gap-2">
            {canAccept && (
              <Button variant="default" onClick={handleAccept}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Plan
              </Button>
            )}
            {canEdit && (
              <Link href={`/treatment/plans/${id}/edit`}>
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
                    <AlertDialogTitle>Delete Treatment Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this treatment plan? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{plan.planName || plan.planNumber}</h2>
                    <Badge variant={statusBadgeVariant[plan.status]}>
                      {statusLabels[plan.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <PhiProtected fakeData={getFakeName()}>
                        {plan.patient.firstName} {plan.patient.lastName}
                      </PhiProtected>
                    </span>
                    {plan.primaryProvider && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Dr. {plan.primaryProvider.firstName} {plan.primaryProvider.lastName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold">{calculateOverallProgress()}%</p>
                  </div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardGrid>
            <DashboardGrid.TwoThirds className="space-y-4">
              {/* Plan Details */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Plan Details</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan Type</p>
                      <p className="font-medium">{plan.planType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fee</p>
                      <p className="font-medium">
                        {plan.totalFee ? `$${plan.totalFee.toLocaleString()}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Duration</p>
                      <p className="font-medium">
                        {plan.estimatedDuration ? `${plan.estimatedDuration} months` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Visits</p>
                      <p className="font-medium">
                        {plan.estimatedVisits ? `${plan.estimatedVisits} visits` : 'Not set'}
                      </p>
                    </div>
                    {plan.chiefComplaint && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Chief Complaint</p>
                        <p className="font-medium">{plan.chiefComplaint}</p>
                      </div>
                    )}
                    {plan.treatmentDescription && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Treatment Description</p>
                        <p className="font-medium">{plan.treatmentDescription}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Phases */}
              <Card>
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Treatment Phases
                      </CardTitle>
                      <CardDescription>{plan.phases.length} phases</CardDescription>
                    </div>
                    {canEdit && (
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Phase
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent compact>
                  {plan.phases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No phases defined yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plan.phases.map((phase) => (
                        <div
                          key={phase.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Phase {phase.phaseNumber}: {phase.phaseName}
                              </span>
                              <Badge variant={phaseStatusBadgeVariant[phase.status]}>
                                {phaseStatusLabels[phase.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{phase.phaseType}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${phase.progressPercent || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-10 text-right">
                              {phase.progressPercent || 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Milestones
                      </CardTitle>
                      <CardDescription>{plan.milestones.length} milestones</CardDescription>
                    </div>
                    {canEdit && (
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent compact>
                  {plan.milestones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No milestones defined yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <span className="font-medium">{milestone.milestoneName}</span>
                            {milestone.targetDate && (
                              <p className="text-sm text-muted-foreground">
                                Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge variant={milestoneStatusBadgeVariant[milestone.status]}>
                            {milestoneStatusLabels[milestone.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Treatment Options */}
              <Card>
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Treatment Options
                      </CardTitle>
                      <CardDescription>
                        {plan.treatmentOptions?.length || 0} option{(plan.treatmentOptions?.length || 0) !== 1 ? 's' : ''} available
                      </CardDescription>
                    </div>
                    {canEdit && plan.status === 'DRAFT' && (
                      <Link href={`/treatment/plans/${id}/options/new`}>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent compact>
                  {!plan.treatmentOptions || plan.treatmentOptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No treatment options defined yet</p>
                      {plan.status === 'DRAFT' && (
                        <p className="text-xs mt-2">Add treatment options to present to the patient</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plan.treatmentOptions.map((option) => (
                        <Link
                          key={option.id}
                          href={`/treatment/plans/${id}/options/${option.id}`}
                          className="block"
                        >
                          <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    Option {option.optionNumber}: {option.optionName}
                                  </span>
                                  {option.isRecommended && (
                                    <Badge variant="soft-primary" className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {applianceSystemLabels[option.applianceSystem] || option.applianceSystem}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  {option.estimatedDuration && (
                                    <span>{option.estimatedDuration} months</span>
                                  )}
                                  {option.estimatedCost && (
                                    <span>${option.estimatedCost.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <Badge variant={optionStatusBadgeVariant[option.status]}>
                                {optionStatusLabels[option.status]}
                              </Badge>
                            </div>
                            {(option.advantages.length > 0 || option.disadvantages.length > 0) && (
                              <div className="flex gap-4 mt-3 text-xs">
                                {option.advantages.length > 0 && (
                                  <div className="flex items-center gap-1 text-success-600">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{option.advantages.length} pro{option.advantages.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                {option.disadvantages.length > 0 && (
                                  <div className="flex items-center gap-1 text-destructive">
                                    <ThumbsDown className="h-3 w-3" />
                                    <span>{option.disadvantages.length} con{option.disadvantages.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                      {plan.treatmentOptions.length > 0 && (
                        <Link
                          href={`/treatment/plans/${id}/options`}
                          className="block text-center text-sm text-primary hover:underline pt-2"
                        >
                          Compare all options
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird className="space-y-4">
              {/* Case Presentation & Acceptance */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Presentation className="h-4 w-4" />
                    Case Presentation
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  {!plan.casePresentations || plan.casePresentations.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No presentations yet</p>
                      {plan.status === 'DRAFT' && plan.treatmentOptions && plan.treatmentOptions.length > 0 && (
                        <Link href={`/treatment/plans/${id}/presentations/new`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Presentation className="h-4 w-4 mr-2" />
                            Schedule Presentation
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan.casePresentations.slice(0, 3).map((presentation) => (
                        <Link
                          key={presentation.id}
                          href={`/treatment/plans/${id}/presentations/${presentation.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(presentation.presentationDate), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {presentation.presentedBy.title ? `${presentation.presentedBy.title} ` : ''}
                                {presentation.presentedBy.firstName} {presentation.presentedBy.lastName}
                              </p>
                            </div>
                            <Badge variant={presentationOutcomeBadgeVariant[presentation.outcome]}>
                              {presentationOutcomeLabels[presentation.outcome]}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case Acceptance */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Case Acceptance
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  {!plan.caseAcceptances || plan.caseAcceptances.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No acceptance forms yet</p>
                      {plan.status === 'PRESENTED' && (
                        <Link href={`/treatment/plans/${id}/acceptances/new`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <FileSignature className="h-4 w-4 mr-2" />
                            Create Acceptance Form
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan.caseAcceptances.map((acceptance) => (
                        <Link
                          key={acceptance.id}
                          href={`/treatment/plans/${id}/acceptances/${acceptance.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                            <div>
                              <p className="text-sm font-medium">
                                {acceptance.selectedOption?.optionName || 'No option selected'}
                              </p>
                              {acceptance.acceptedDate && (
                                <p className="text-xs text-muted-foreground">
                                  Accepted: {format(new Date(acceptance.acceptedDate), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            <Badge variant={acceptanceStatusBadgeVariant[acceptance.status]}>
                              {acceptanceStatusLabels[acceptance.status]}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {plan.startDate
                          ? format(new Date(plan.startDate), 'MMM d, yyyy')
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated End</p>
                      <p className="font-medium">
                        {plan.estimatedEndDate
                          ? format(new Date(plan.estimatedEndDate), 'MMM d, yyyy')
                          : 'Not set'}
                      </p>
                    </div>
                    {plan.acceptedDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Accepted Date</p>
                        <p className="font-medium">
                          {format(new Date(plan.acceptedDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {plan.actualEndDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Date</p>
                        <p className="font-medium">
                          {format(new Date(plan.actualEndDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Statistics</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phases</span>
                      <Badge variant="secondary">{plan.phases.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Milestones</span>
                      <Badge variant="secondary">{plan.milestones.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progress Notes</span>
                      <Badge variant="secondary">{plan._count.progressNotes}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Progress Note
                  </Button>
                  <Link href={`/patients/${plan.patient.id}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      View Patient
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
