'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  CalendarDays,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Analytics {
  summary: {
    totalLeads: number;
    conversions: number;
    lostLeads: number;
    conversionRate: number;
    lossRate: number;
    avgConversionDays: number;
    recentActivity: number;
    pendingTasks: number;
    overdueTasks: number;
  };
  bySource: { source: string; count: number }[];
  byStage: { stage: string; count: number }[];
  topReferrers: {
    id: string;
    practiceName: string;
    firstName: string;
    lastName: string;
    totalReferrals: number;
    referralsThisYear: number;
  }[];
}

const stageLabels: Record<string, string> = {
  INQUIRY: 'Inquiry',
  CONTACTED: 'Contacted',
  CONSULTATION_SCHEDULED: 'Consultation Scheduled',
  CONSULTATION_COMPLETED: 'Consultation Done',
  PENDING_DECISION: 'Pending Decision',
  TREATMENT_ACCEPTED: 'Accepted',
  TREATMENT_STARTED: 'Started',
  LOST: 'Lost',
};

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Website',
  PHONE_CALL: 'Phone Call',
  WALK_IN: 'Walk-in',
  REFERRAL_DENTIST: 'Dentist Referral',
  REFERRAL_PATIENT: 'Patient Referral',
  SOCIAL_MEDIA: 'Social Media',
  GOOGLE_ADS: 'Google Ads',
  INSURANCE_DIRECTORY: 'Insurance Directory',
  OTHER: 'Other',
};

export default function CRMDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/leads/analytics?days=30');
        const result = await response.json();
        if (result.success) {
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="CRM Dashboard"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'CRM' },
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
        title="CRM Dashboard"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/crm/leads/new">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                New Lead
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
                  <p className="text-xs text-muted-foreground">Active Leads</p>
                  <p className="text-2xl font-bold">{analytics?.summary.totalLeads || 0}</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <Users className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{analytics?.summary.conversions || 0}</p>
                  <p className="text-xs text-success-600">
                    {analytics?.summary.conversionRate || 0}% rate
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">{analytics?.summary.pendingTasks || 0}</p>
                  <p className="text-xs text-warning-600">
                    {analytics?.summary.overdueTasks || 0} overdue
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Conversion Time</p>
                  <p className="text-2xl font-bold">{analytics?.summary.avgConversionDays || 0}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              {/* Pipeline Overview */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Pipeline Overview
                  </CardTitle>
                  <CardDescription>Leads by stage</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    {analytics?.byStage
                      .filter((s) => s.stage !== 'LOST')
                      .map((stage) => (
                        <div key={stage.stage} className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground">
                            {stageLabels[stage.stage] || stage.stage}
                          </div>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((stage.count || 0) /
                                    Math.max(
                                      analytics?.byStage.reduce(
                                        (max, s) => Math.max(max, s.count),
                                        1
                                      ) || 1,
                                      1
                                    )) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <Badge variant="secondary" className="min-w-[40px] justify-center">
                            {stage.count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/crm/pipeline">
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Pipeline
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Sources */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Lead Sources
                  </CardTitle>
                  <CardDescription>Where leads are coming from</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="grid grid-cols-2 gap-2">
                    {analytics?.bySource.map((source) => (
                      <div
                        key={source.source}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm">
                          {sourceLabels[source.source] || source.source}
                        </span>
                        <Badge variant="soft-primary">{source.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird>
              {/* Quick Actions */}
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-2">
                  <Link href="/crm/leads" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      View All Leads
                    </Button>
                  </Link>
                  <Link href="/crm/leads/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Lead
                    </Button>
                  </Link>
                  <Link href="/crm/pipeline" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Pipeline Board
                    </Button>
                  </Link>
                  <Link href="/crm/referrers" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Referring Providers
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Top Referrers */}
              {analytics?.topReferrers && analytics.topReferrers.length > 0 && (
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Top Referrers</CardTitle>
                    <CardDescription>Most active referring providers</CardDescription>
                  </CardHeader>
                  <CardContent compact>
                    <div className="space-y-2">
                      {analytics.topReferrers.slice(0, 5).map((referrer) => (
                        <div
                          key={referrer.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{referrer.practiceName}</p>
                            <p className="text-xs text-muted-foreground">
                              Dr. {referrer.firstName} {referrer.lastName}
                            </p>
                          </div>
                          <Badge variant="success">{referrer.totalReferrals}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              {analytics && analytics.summary.overdueTasks > 0 && (
                <Card variant="ghost" className="border-warning-200 bg-warning-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-700">Overdue Tasks</p>
                        <p className="text-xs text-warning-600">
                          You have {analytics.summary.overdueTasks} overdue tasks that need
                          attention
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
