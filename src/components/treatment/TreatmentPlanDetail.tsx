'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Edit,
  MoreVertical,
  Play,
  CheckCircle,
  Pause,
  FileText,
  Target,
  Activity,
  DollarSign,
  Milestone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { TreatmentStatusBadge } from './TreatmentStatusBadge';

interface TreatmentPhase {
  id: string;
  phaseName: string;
  phaseType: string;
  status: string;
  progressPercent: number;
  plannedStartDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
}

interface TreatmentMilestone {
  id: string;
  milestoneName: string;
  milestoneType: string;
  status: string;
  targetDate: string | null;
  achievedDate: string | null;
}

interface TreatmentPlanData {
  id: string;
  planNumber: string;
  planName: string;
  planType: string | null;
  status: string;
  chiefComplaint: string | null;
  treatmentDescription: string | null;
  diagnosis: string[];
  treatmentGoals: string[];
  startDate: string | null;
  estimatedEndDate: string | null;
  actualEndDate: string | null;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  totalFee: number | null;
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
    title: string | null;
  } | null;
  phases: TreatmentPhase[];
  milestones: TreatmentMilestone[];
  _count?: {
    progressNotes: number;
    options: number;
  };
}

interface TreatmentPlanDetailProps {
  plan: TreatmentPlanData;
  onRefresh?: () => void;
}

export function TreatmentPlanDetail({ plan, onRefresh }: TreatmentPlanDetailProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const calculateOverallProgress = () => {
    if (plan.phases.length === 0) return 0;
    const total = plan.phases.reduce((sum, phase) => sum + (phase.progressPercent || 0), 0);
    return Math.round(total / plan.phases.length);
  };

  const handleAction = async (action: 'activate' | 'complete' | 'hold') => {
    setActionLoading(action);
    try {
      const endpoint =
        action === 'activate'
          ? `/api/treatment-plans/${plan.id}/activate`
          : action === 'complete'
            ? `/api/treatment-plans/${plan.id}/complete`
            : `/api/treatment-plans/${plan.id}`;

      const method = action === 'hold' ? 'PATCH' : 'POST';
      const body = action === 'hold' ? JSON.stringify({ status: 'ON_HOLD' }) : undefined;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.ok) {
        onRefresh?.();
        router.refresh();
      }
    } catch {
      // Handle error
    } finally {
      setActionLoading(null);
    }
  };

  const progress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{plan.planNumber}</h1>
            <TreatmentStatusBadge status={plan.status} showDot />
          </div>
          {plan.planName && (
            <p className="text-lg text-muted-foreground">{plan.planName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/treatment/plans/${plan.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {plan.status === 'ACCEPTED' && (
                <DropdownMenuItem
                  onClick={() => handleAction('activate')}
                  disabled={actionLoading === 'activate'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Treatment
                </DropdownMenuItem>
              )}
              {plan.status === 'ACTIVE' && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleAction('hold')}
                    disabled={actionLoading === 'hold'}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Put On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAction('complete')}
                    disabled={actionLoading === 'complete'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Treatment
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/treatment/plans/${plan.id}/options`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Treatment Options
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/treatment/plans/${plan.id}/milestones`}>
                  <Target className="h-4 w-4 mr-2" />
                  Milestones
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-xl font-bold">{progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                <Milestone className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phases</p>
                <p className="text-xl font-bold">
                  {plan.phases.filter((p) => p.status === 'COMPLETED').length}/{plan.phases.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Milestones</p>
                <p className="text-xl font-bold">
                  {plan.milestones.filter((m) => m.status === 'ACHIEVED').length}/{plan.milestones.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-xl font-bold">{plan._count?.progressNotes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient & Provider */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Patient & Provider</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <PhiProtected fakeData={getFakeName()}>
                    <Link
                      href={`/patients/${plan.patient.id}`}
                      className="font-medium hover:underline"
                    >
                      {plan.patient.firstName} {plan.patient.lastName}
                    </Link>
                  </PhiProtected>
                  <p className="text-xs text-muted-foreground">{plan.patient.patientNumber}</p>
                </div>
              </div>

              {plan.primaryProvider && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Provider</p>
                    <p className="font-medium">
                      {plan.primaryProvider.title || 'Dr.'} {plan.primaryProvider.firstName}{' '}
                      {plan.primaryProvider.lastName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Details */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Clinical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.chiefComplaint && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Chief Complaint</p>
                  <p>{plan.chiefComplaint}</p>
                </div>
              )}

              {plan.treatmentDescription && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Treatment Description
                  </p>
                  <p>{plan.treatmentDescription}</p>
                </div>
              )}

              {plan.diagnosis && plan.diagnosis.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.diagnosis.map((d, i) => (
                      <Badge key={i} variant="secondary">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {plan.treatmentGoals && plan.treatmentGoals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Treatment Goals</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {plan.treatmentGoals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phases */}
          {plan.phases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Treatment Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{phase.phaseName}</span>
                          <TreatmentStatusBadge status={phase.status} type="phase" size="sm" />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{phase.phaseType}</span>
                          {phase.actualStartDate && (
                            <span>Started {format(new Date(phase.actualStartDate), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${phase.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {phase.progressPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {plan.startDate
                      ? format(new Date(plan.startDate), 'MMM d, yyyy')
                      : 'Not started'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. End Date</p>
                  <p className="font-medium">
                    {plan.estimatedEndDate
                      ? format(new Date(plan.estimatedEndDate), 'MMM d, yyyy')
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {plan.actualEndDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {format(new Date(plan.actualEndDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {plan.estimatedDuration && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Duration</p>
                    <p className="font-medium">{plan.estimatedDuration} months</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial */}
          {plan.totalFee && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Financial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Fee</p>
                    <p className="text-xl font-bold">
                      ${plan.totalFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones Summary */}
          {plan.milestones.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle size="sm">Upcoming Milestones</CardTitle>
                <Link href={`/treatment/plans/${plan.id}/milestones`}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.milestones
                    .filter((m) => m.status !== 'ACHIEVED' && m.status !== 'CANCELLED')
                    .slice(0, 3)
                    .map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{milestone.milestoneName}</p>
                          {milestone.targetDate && (
                            <p className="text-xs text-muted-foreground">
                              Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <TreatmentStatusBadge
                          status={milestone.status}
                          type="milestone"
                          size="sm"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
