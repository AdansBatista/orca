'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Target,
  Check,
  Clock,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Milestone {
  id: string;
  milestoneName: string;
  milestoneType: string | null;
  description: string | null;
  status: string;
  targetDate: string | null;
  achievedDate: string | null;
  notAchievedReason: string | null;
  sequenceOrder: number;
}

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  ACHIEVED: 'success',
  MISSED: 'destructive',
  DEFERRED: 'warning',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  ACHIEVED: 'Achieved',
  MISSED: 'Missed',
  DEFERRED: 'Deferred',
};

const milestoneTypeLabels: Record<string, string> = {
  BONDING: 'Bonding',
  WIRE_CHANGE: 'Wire Change',
  ALIGNER_START: 'Aligner Start',
  ALIGNER_REFINEMENT: 'Aligner Refinement',
  APPLIANCE_PLACEMENT: 'Appliance Placement',
  APPLIANCE_REMOVAL: 'Appliance Removal',
  MID_TREATMENT: 'Mid-Treatment Check',
  DEBOND: 'Debond',
  RETENTION_START: 'Retention Start',
  PROGRESS_PHOTOS: 'Progress Photos',
  CUSTOM: 'Custom',
};

export default function MilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/treatment-plans/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment plan');
        }

        setPlan(result.data);
        setMilestones(result.data.milestones || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Milestones"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !plan) {
    return (
      <>
        <PageHeader title="Milestones" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Milestones</h3>
              <p className="text-muted-foreground mb-4">{error || 'Plan not found'}</p>
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

  const canEdit = !['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(plan.status);

  // Calculate stats
  const totalMilestones = milestones.length;
  const achievedMilestones = milestones.filter((m) => m.status === 'ACHIEVED').length;
  const pendingMilestones = milestones.filter((m) => m.status === 'PENDING').length;
  const inProgressMilestones = milestones.filter((m) => m.status === 'IN_PROGRESS').length;
  const missedMilestones = milestones.filter((m) => m.status === 'MISSED').length;
  const progressPercentage = totalMilestones > 0
    ? Math.round((achievedMilestones / totalMilestones) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Treatment Milestones"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Milestones' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {canEdit && (
              <Link href={`/treatment/plans/${id}/milestones/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </Link>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        {/* Progress Summary */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{progressPercentage}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success-600">{achievedMilestones}</p>
              <p className="text-sm text-muted-foreground">Achieved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary-600">{inProgressMilestones}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{pendingMilestones}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{missedMilestones}</p>
              <p className="text-sm text-muted-foreground">Missed</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestones List */}
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Milestones</h3>
              <p className="text-muted-foreground mb-4">
                No milestones have been created for this treatment plan.
              </p>
              {canEdit && (
                <Link href={`/treatment/plans/${id}/milestones/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Milestone
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                All Milestones ({milestones.length})
              </CardTitle>
            </CardHeader>
            <CardContent compact>
              <div className="space-y-3">
                {milestones
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map((milestone, index) => (
                    <Link
                      key={milestone.id}
                      href={`/treatment/plans/${id}/milestones/${milestone.id}`}
                      className="block"
                    >
                      <div
                        className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                          milestone.status === 'ACHIEVED'
                            ? 'bg-success-50/50 hover:bg-success-50'
                            : milestone.status === 'MISSED'
                            ? 'bg-destructive-50/50 hover:bg-destructive-50'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-primary-50/50 hover:bg-primary-50'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              milestone.status === 'ACHIEVED'
                                ? 'bg-success-100'
                                : milestone.status === 'MISSED'
                                ? 'bg-destructive-100'
                                : milestone.status === 'IN_PROGRESS'
                                ? 'bg-primary-100'
                                : 'bg-muted'
                            }`}
                          >
                            {milestone.status === 'ACHIEVED' ? (
                              <Check className="h-4 w-4 text-success-600" />
                            ) : milestone.status === 'MISSED' ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : milestone.status === 'IN_PROGRESS' ? (
                              <Clock className="h-4 w-4 text-primary-600" />
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>
                          {index < milestones.length - 1 && (
                            <div
                              className={`w-0.5 h-full min-h-[40px] mt-2 ${
                                milestone.status === 'ACHIEVED'
                                  ? 'bg-success-200'
                                  : 'bg-muted-foreground/20'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{milestone.milestoneName}</p>
                              {milestone.milestoneType && (
                                <p className="text-sm text-muted-foreground">
                                  {milestoneTypeLabels[milestone.milestoneType] ||
                                    milestone.milestoneType}
                                </p>
                              )}
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                            <Badge variant={statusBadgeVariant[milestone.status]}>
                              {statusLabels[milestone.status]}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {milestone.targetDate && (
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>
                                  Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            )}
                            {milestone.achievedDate && (
                              <div className="flex items-center gap-1 text-success-600">
                                <Check className="h-3 w-3" />
                                <span>
                                  Achieved: {format(new Date(milestone.achievedDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>

                          {milestone.notAchievedReason && (
                            <p className="text-xs text-destructive mt-1">
                              {milestone.notAchievedReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </>
  );
}
