import { cookies } from 'next/headers';
import { format } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  User,
  Camera,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { db } from '@/lib/db';
import { PortalSection, PortalCard, PortalEmptyState } from '@/components/portal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PhaseStatus, MilestoneStatus, TreatmentPhaseType } from '@prisma/client';

async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('portal_session')?.value;

  if (!sessionToken) return null;

  const session = await db.portalSession.findFirst({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: {
      account: {
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!session?.account) return null;

  return {
    accountId: session.account.id,
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
  };
}

async function getTreatmentPlans(patientId: string, clinicId: string) {
  const plans = await db.treatmentPlan.findMany({
    where: {
      patientId,
      clinicId,
      deletedAt: null,
    },
    include: {
      phases: {
        orderBy: { phaseNumber: 'asc' },
      },
      milestones: {
        where: {
          visibleToPatient: true,
        },
        orderBy: { targetDate: 'asc' },
      },
      progressPhotos: {
        where: {
          visibleToPatient: true,
        },
        orderBy: { takenDate: 'desc' },
        take: 4,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get provider info separately if needed
  const plansWithProvider = await Promise.all(
    plans.map(async (plan) => {
      let provider = null;
      if (plan.primaryProviderId) {
        provider = await db.staffProfile.findUnique({
          where: { id: plan.primaryProviderId },
          select: { id: true, firstName: true, lastName: true },
        });
      }
      return { ...plan, primaryProvider: provider };
    })
  );

  return plansWithProvider;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success" dot>Active</Badge>;
    case 'COMPLETED':
      return <Badge variant="soft-primary">Completed</Badge>;
    case 'ON_HOLD':
      return <Badge variant="warning">On Hold</Badge>;
    case 'PRESENTED':
      return <Badge variant="info">Presented</Badge>;
    case 'ACCEPTED':
      return <Badge variant="success">Accepted</Badge>;
    case 'DISCONTINUED':
      return <Badge variant="destructive">Discontinued</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getMilestoneIcon(status: MilestoneStatus) {
  switch (status) {
    case 'ACHIEVED':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'IN_PROGRESS':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'PENDING':
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    case 'MISSED':
    case 'DEFERRED':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

function getPhaseTypeLabel(type: TreatmentPhaseType) {
  const labels: Record<TreatmentPhaseType, string> = {
    INITIAL_ALIGNMENT: 'Alignment',
    LEVELING: 'Leveling',
    SPACE_CLOSURE: 'Space Closure',
    FINISHING: 'Finishing',
    DETAILING: 'Detailing',
    RETENTION: 'Retention',
    OBSERVATION: 'Observation',
    CUSTOM: 'Custom',
  };
  return labels[type] || type;
}

function getPhaseStatusIcon(status: PhaseStatus) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'IN_PROGRESS':
      return <Activity className="h-4 w-4 text-primary" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

export const metadata = {
  title: 'Treatment Progress',
};

export default async function PortalProgressPage() {
  const session = await getPortalSession();
  if (!session) return null;

  const treatmentPlans = await getTreatmentPlans(session.patientId, session.clinicId);

  // Log activity
  await db.portalActivityLog.create({
    data: {
      accountId: session.accountId,
      activityType: 'TREATMENT_VIEW',
      description: 'Viewed treatment progress',
    },
  });

  // Find active plan (most important to show)
  const activePlan = treatmentPlans.find((p) => p.status === 'ACTIVE');
  const otherPlans = treatmentPlans.filter((p) => p.id !== activePlan?.id);

  // Calculate progress for a plan
  const calculateProgress = (plan: typeof treatmentPlans[0]) => {
    if (plan.phases.length === 0) return 0;
    const totalProgress = plan.phases.reduce((sum, p) => sum + p.progressPercent, 0);
    return Math.round(totalProgress / plan.phases.length);
  };

  // Get upcoming milestones for a plan
  const getUpcomingMilestones = (plan: typeof treatmentPlans[0]) => {
    return plan.milestones
      .filter((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => {
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return a.targetDate.getTime() - b.targetDate.getTime();
      })
      .slice(0, 3);
  };

  return (
    <div className="py-6">
      <PortalSection className="mb-6">
        <h1 className="text-2xl font-bold">Treatment Progress</h1>
        <p className="text-muted-foreground">Track your orthodontic journey</p>
      </PortalSection>

      {treatmentPlans.length === 0 ? (
        <div className="px-4">
          <PortalEmptyState
            icon={<Activity className="h-10 w-10 text-muted-foreground" />}
            title="No treatment plans"
            description="You don't have any treatment plans yet. Your orthodontist will create one after your consultation."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Treatment Plan */}
          {activePlan && (
            <PortalSection>
              <PortalCard>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold">{activePlan.planName}</h2>
                      {getStatusBadge(activePlan.status)}
                    </div>
                    {activePlan.primaryProvider && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Dr. {activePlan.primaryProvider.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-2xl font-bold text-primary">
                      {calculateProgress(activePlan)}%
                    </span>
                  </div>
                  <Progress value={calculateProgress(activePlan)} className="h-3" />
                  {activePlan.estimatedEndDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Estimated completion: {format(activePlan.estimatedEndDate, 'MMMM yyyy')}
                    </p>
                  )}
                </div>

                {/* Phases */}
                {activePlan.phases.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Treatment Phases
                    </h3>
                    <div className="space-y-3">
                      {activePlan.phases.map((phase) => (
                        <div
                          key={phase.id}
                          className={`p-3 rounded-lg border ${
                            phase.status === 'IN_PROGRESS'
                              ? 'border-primary bg-primary/5'
                              : phase.status === 'COMPLETED'
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getPhaseStatusIcon(phase.status)}
                              <span className="font-medium text-sm">{phase.phaseName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getPhaseTypeLabel(phase.phaseType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <Progress value={phase.progressPercent} className="h-1.5 flex-1" />
                            <span className="text-xs font-medium w-8">
                              {phase.progressPercent}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Milestones */}
                {getUpcomingMilestones(activePlan).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Upcoming Milestones
                    </h3>
                    <div className="space-y-2">
                      {getUpcomingMilestones(activePlan).map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          {getMilestoneIcon(milestone.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{milestone.milestoneName}</p>
                            {(milestone.patientDescription || milestone.description) && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {milestone.patientDescription || milestone.description}
                              </p>
                            )}
                          </div>
                          {milestone.targetDate && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(milestone.targetDate, 'MMM d')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Photos */}
                {activePlan.progressPhotos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Progress Photos
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {activePlan.progressPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                        >
                          {photo.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.thumbnailUrl}
                              alt={photo.description || 'Progress photo'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {activePlan.progressPhotos.length} progress photo
                      {activePlan.progressPhotos.length !== 1 && 's'}
                    </p>
                  </div>
                )}
              </PortalCard>
            </PortalSection>
          )}

          {/* Other Plans */}
          {otherPlans.length > 0 && (
            <PortalSection title="Other Plans">
              <div className="space-y-3">
                {otherPlans.map((plan) => (
                  <PortalCard key={plan.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{plan.planName}</h3>
                          {getStatusBadge(plan.status)}
                        </div>
                        {plan.status === 'COMPLETED' && plan.actualEndDate && (
                          <p className="text-sm text-muted-foreground">
                            Completed {format(plan.actualEndDate, 'MMMM d, yyyy')}
                          </p>
                        )}
                        {plan.status === 'PRESENTED' && (
                          <p className="text-sm text-muted-foreground">
                            Awaiting your decision
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {calculateProgress(plan)}%
                        </span>
                      </div>
                    </div>
                  </PortalCard>
                ))}
              </div>
            </PortalSection>
          )}
        </div>
      )}
    </div>
  );
}
