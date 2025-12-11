'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  FileText,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Activity,
  Plus,
  Users,
  TrendingUp,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TreatmentStats {
  activePlans: number;
  completedPlans: number;
  pendingAcceptance: number;
  avgCompletionDays: number;
  upcomingMilestones: number;
  overdueMilestones: number;
  recentNotes: number;
  thisWeekAppointments: number;
}

interface RecentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  primaryProvider?: {
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface UpcomingMilestone {
  id: string;
  milestoneName: string;
  targetDate: string;
  status: string;
  treatmentPlan: {
    planNumber: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

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

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive'> = {
  DRAFT: 'secondary',
  PRESENTED: 'info',
  ACCEPTED: 'success',
  ACTIVE: 'default',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'destructive',
  TRANSFERRED: 'secondary',
};

export default function TreatmentDashboardPage() {
  const [stats, setStats] = useState<TreatmentStats | null>(null);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<UpcomingMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch treatment plans for stats
        const plansResponse = await fetch('/api/treatment-plans?pageSize=10&sortBy=createdAt&sortOrder=desc');
        const plansResult = await plansResponse.json();

        if (plansResult.success) {
          const plans = plansResult.data.items;
          setRecentPlans(plans.slice(0, 5));

          // Calculate stats from plans
          const allPlansResponse = await fetch('/api/treatment-plans?pageSize=1000');
          const allPlansResult = await allPlansResponse.json();

          if (allPlansResult.success) {
            const allPlans = allPlansResult.data.items;
            setStats({
              activePlans: allPlans.filter((p: RecentPlan) => p.status === 'ACTIVE').length,
              completedPlans: allPlans.filter((p: RecentPlan) => p.status === 'COMPLETED').length,
              pendingAcceptance: allPlans.filter((p: RecentPlan) => ['DRAFT', 'PRESENTED'].includes(p.status)).length,
              avgCompletionDays: 0, // Would need additional calculation
              upcomingMilestones: 0,
              overdueMilestones: 0,
              recentNotes: 0,
              thisWeekAppointments: 0,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch treatment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Treatment Management"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <StatsRow>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </StatsRow>
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Treatment Management"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/treatment/plans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Treatment Plan
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Plans</p>
                  <p className="text-2xl font-bold">{stats?.activePlans || 0}</p>
                  <p className="text-xs text-muted-foreground">In treatment</p>
                </div>
                <Activity className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completedPlans || 0}</p>
                  <p className="text-xs text-success-600">All time</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Acceptance</p>
                  <p className="text-2xl font-bold">{stats?.pendingAcceptance || 0}</p>
                  <p className="text-xs text-warning-600">Need follow-up</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Milestones</p>
                  <p className="text-2xl font-bold">{stats?.upcomingMilestones || 0}</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
                <Target className="h-8 w-8 text-accent-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds className="space-y-4">
              {/* Recent Treatment Plans */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Recent Treatment Plans
                  </CardTitle>
                  <CardDescription>Latest plans created or updated</CardDescription>
                </CardHeader>
                <CardContent compact>
                  {recentPlans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No treatment plans yet</p>
                      <Link href="/treatment/plans/new">
                        <Button variant="outline" size="sm" className="mt-3">
                          Create First Plan
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentPlans.map((plan) => (
                        <Link
                          key={plan.id}
                          href={`/treatment/plans/${plan.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{plan.planNumber}</span>
                              <Badge variant={statusVariants[plan.status] || 'secondary'}>
                                {statusLabels[plan.status] || plan.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {plan.patient.firstName} {plan.patient.lastName}
                              {plan.planName && ` • ${plan.planName}`}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground ml-4">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/treatment/plans">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Treatment Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Plan Status Distribution
                  </CardTitle>
                  <CardDescription>Overview of treatment plan statuses</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-muted-foreground">{stats?.pendingAcceptance || 0}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-50 text-center">
                      <p className="text-2xl font-bold text-primary-600">{stats?.activePlans || 0}</p>
                      <p className="text-xs text-primary-600">Active</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success-50 text-center">
                      <p className="text-2xl font-bold text-success-600">{stats?.completedPlans || 0}</p>
                      <p className="text-xs text-success-600">Completed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning-50 text-center">
                      <p className="text-2xl font-bold text-warning-600">0</p>
                      <p className="text-xs text-warning-600">On Hold</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird className="space-y-4">
              {/* Quick Actions */}
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-2">
                  <Link href="/treatment/plans" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      View All Plans
                    </Button>
                  </Link>
                  <Link href="/treatment/plans/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Treatment Plan
                    </Button>
                  </Link>
                  <Link href="/treatment/documentation" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Clinical Documentation
                    </Button>
                  </Link>
                  <Link href="/treatment/tracking" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Treatment Tracking
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Upcoming Milestones */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Upcoming Milestones
                  </CardTitle>
                  <CardDescription>Next 7 days</CardDescription>
                </CardHeader>
                <CardContent compact>
                  {upcomingMilestones.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming milestones</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-2 rounded-lg bg-muted/50"
                        >
                          <p className="text-sm font-medium">{milestone.milestoneName}</p>
                          <p className="text-xs text-muted-foreground">
                            {milestone.treatmentPlan.patient.firstName} {milestone.treatmentPlan.patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alerts */}
              {stats && stats.overdueMilestones > 0 && (
                <Card variant="ghost" className="border-warning-200 bg-warning-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-700">Overdue Milestones</p>
                        <p className="text-xs text-warning-600">
                          You have {stats.overdueMilestones} overdue milestones that need attention
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
