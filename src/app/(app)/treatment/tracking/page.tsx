'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Activity,
  Shield,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackingStats {
  totalActivePlans: number;
  onTrackPlans: number;
  behindPlans: number;
  aheadPlans: number;
  readyForDebond: number;
  inRetention: number;
  recentOutcomes: number;
  avgCompletionRate: number;
}

interface RecentProgressItem {
  id: string;
  treatmentPlanId: string;
  patientName: string;
  planNumber: string;
  status: string;
  percentComplete: number;
  snapshotDate: string;
}

interface UpcomingDebond {
  id: string;
  patientName: string;
  planNumber: string;
  targetDebondDate: string;
  readinessScore: number;
  isApproved: boolean;
}

const statusColors: Record<string, string> = {
  ON_TRACK: 'text-success-600',
  AHEAD: 'text-info-600',
  BEHIND: 'text-warning-600',
  SIGNIFICANTLY_BEHIND: 'text-destructive',
  PAUSED: 'text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  ON_TRACK: 'On Track',
  AHEAD: 'Ahead',
  BEHIND: 'Behind',
  SIGNIFICANTLY_BEHIND: 'Significantly Behind',
  PAUSED: 'Paused',
};

export default function TreatmentTrackingPage() {
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [recentProgress, setRecentProgress] = useState<RecentProgressItem[]>([]);
  const [upcomingDebonds, setUpcomingDebonds] = useState<UpcomingDebond[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch summary stats (simulated for now - would be a dedicated endpoint)
        // In production, this would be a single API call to /api/treatment-tracking/stats
        const [plansRes, outcomesRes] = await Promise.all([
          fetch('/api/treatment-plans?status=IN_PROGRESS&pageSize=100'),
          fetch('/api/treatment-outcomes?pageSize=10'),
        ]);

        const plansData = await plansRes.json();
        const outcomesData = await outcomesRes.json();

        // Calculate stats from active plans
        const activePlans = plansData.success ? plansData.data.items : [];

        // Simulated stats (in production, these would come from aggregated API data)
        setStats({
          totalActivePlans: activePlans.length || 12,
          onTrackPlans: Math.floor((activePlans.length || 12) * 0.7),
          behindPlans: Math.floor((activePlans.length || 12) * 0.2),
          aheadPlans: Math.floor((activePlans.length || 12) * 0.1),
          readyForDebond: 3,
          inRetention: 8,
          recentOutcomes: outcomesData.success ? outcomesData.data.total : 5,
          avgCompletionRate: 78,
        });

        // Simulated recent progress entries
        setRecentProgress([
          {
            id: '1',
            treatmentPlanId: 'plan-1',
            patientName: 'John Smith',
            planNumber: 'TP-2024-001',
            status: 'ON_TRACK',
            percentComplete: 65,
            snapshotDate: new Date().toISOString(),
          },
          {
            id: '2',
            treatmentPlanId: 'plan-2',
            patientName: 'Sarah Johnson',
            planNumber: 'TP-2024-002',
            status: 'BEHIND',
            percentComplete: 45,
            snapshotDate: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            treatmentPlanId: 'plan-3',
            patientName: 'Michael Davis',
            planNumber: 'TP-2024-003',
            status: 'AHEAD',
            percentComplete: 85,
            snapshotDate: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);

        // Simulated upcoming debonds
        setUpcomingDebonds([
          {
            id: '1',
            patientName: 'Emily Wilson',
            planNumber: 'TP-2023-045',
            targetDebondDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            readinessScore: 95,
            isApproved: true,
          },
          {
            id: '2',
            patientName: 'David Brown',
            planNumber: 'TP-2023-052',
            targetDebondDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            readinessScore: 88,
            isApproved: false,
          },
        ]);
      } catch (error) {
        console.error('Error fetching tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Treatment Tracking"
          description="Monitor treatment progress, debond readiness, and retention protocols"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Tracking' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Treatment Tracking"
        description="Monitor treatment progress, debond readiness, and retention protocols"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking' },
        ]}
      />
      <PageContent density="comfortable">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard accentColor="primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalActivePlans || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Plans</p>
                </div>
              </div>
            </CardContent>
          </StatCard>
          <StatCard accentColor="success">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.avgCompletionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </StatCard>
          <StatCard accentColor="accent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.readyForDebond || 0}</p>
                  <p className="text-sm text-muted-foreground">Ready for Debond</p>
                </div>
              </div>
            </CardContent>
          </StatCard>
          <StatCard accentColor="warning">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-warning-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.inRetention || 0}</p>
                  <p className="text-sm text-muted-foreground">In Retention</p>
                </div>
              </div>
            </CardContent>
          </StatCard>
        </div>

        {/* Progress Distribution */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success-600">{stats?.onTrackPlans || 0}</p>
                <p className="text-sm text-muted-foreground">On Track</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">{stats?.behindPlans || 0}</p>
                <p className="text-sm text-muted-foreground">Behind Schedule</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-info-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-info-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-info-600">{stats?.aheadPlans || 0}</p>
                <p className="text-sm text-muted-foreground">Ahead of Schedule</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Progress */}
          <Card>
            <CardHeader compact>
              <div className="flex items-center justify-between">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Recent Progress Updates
                </CardTitle>
                <Link href="/treatment/tracking/progress">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent compact>
              {recentProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent progress updates
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProgress.map((item) => (
                    <Link
                      key={item.id}
                      href={`/treatment/plans/${item.treatmentPlanId}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{item.patientName}</p>
                          <p className="text-sm text-muted-foreground">{item.planNumber}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${item.percentComplete}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-10">
                              {item.percentComplete}%
                            </span>
                          </div>
                          <p className={`text-xs ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Debonds */}
          <Card>
            <CardHeader compact>
              <div className="flex items-center justify-between">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Upcoming Debonds
                </CardTitle>
                <Link href="/treatment/tracking/debond">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent compact>
              {upcomingDebonds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming debonds scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDebonds.map((item) => (
                    <Link
                      key={item.id}
                      href={`/treatment/tracking/debond/${item.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{item.patientName}</p>
                          <p className="text-sm text-muted-foreground">{item.planNumber}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(item.targetDebondDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge
                              variant={item.isApproved ? 'success' : 'secondary'}
                              className="text-xs"
                            >
                              {item.isApproved ? 'Approved' : 'Pending'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.readinessScore}% ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Link href="/treatment/tracking/progress">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">Progress Monitor</p>
                  <p className="text-xs text-muted-foreground">Track treatment progress</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/treatment/tracking/debond">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium">Debond Readiness</p>
                  <p className="text-xs text-muted-foreground">Assess debond criteria</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/treatment/tracking/retention">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium">Retention Protocols</p>
                  <p className="text-xs text-muted-foreground">Manage retention care</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/treatment/tracking/outcomes">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-info-600" />
                </div>
                <div>
                  <p className="font-medium">Treatment Outcomes</p>
                  <p className="text-xs text-muted-foreground">Review treatment results</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </PageContent>
    </>
  );
}
