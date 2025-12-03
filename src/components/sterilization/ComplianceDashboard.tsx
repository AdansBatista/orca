'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Activity,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Calendar,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardGrid, StatsRow } from '@/components/layout';
import { ListItem, ListItemTitle, ListItemDescription, ListActivity } from '@/components/ui/list-item';

interface ComplianceData {
  overall: {
    score: number;
    status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  };
  biologicalIndicators: {
    lastTest: string | null;
    daysUntilNextRequired: number;
    weeklyCompliance: boolean;
    passRate: number;
    recentTests: Array<{
      id: string;
      testDate: string;
      result: string;
      lotNumber: string;
    }>;
  };
  cycles: {
    today: number;
    thisWeek: number;
    successRate: number;
    activeCycles: Array<{
      id: string;
      cycleNumber: string;
      cycleType: string;
      startTime: string;
      status: string;
    }>;
  };
  packages: {
    sterile: number;
    expiringToday: number;
    expiringThisWeek: number;
    quarantined: number;
  };
  validations: {
    overdueCount: number;
    upcomingCount: number;
    nextDue: {
      type: string;
      equipment: string;
      dueDate: string;
    } | null;
  };
  alerts: Array<{
    id: string;
    type: 'WARNING' | 'ERROR' | 'INFO';
    title: string;
    message: string;
    actionUrl?: string;
    createdAt: string;
  }>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function ComplianceDashboard() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resources/sterilization/compliance/dashboard');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch compliance data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-6">
        <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'success';
      case 'AT_RISK':
        return 'warning';
      case 'NON_COMPLIANT':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg p-4 border flex items-start justify-between ${
                alert.type === 'ERROR'
                  ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                  : alert.type === 'WARNING'
                  ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                  : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.type === 'ERROR' ? (
                  <XCircle className="h-5 w-5 text-error-600 mt-0.5" />
                ) : alert.type === 'WARNING' ? (
                  <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
              {alert.actionUrl && (
                <Link href={alert.actionUrl}>
                  <Button variant="ghost" size="sm">
                    View
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Key Stats */}
      <StatsRow>
        <StatCard accentColor={getComplianceColor(data.overall.status) as 'success' | 'warning' | 'error'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Compliance Score</p>
              <p className="text-xl font-bold">{data.overall.score}%</p>
              <Badge
                variant={getComplianceColor(data.overall.status) as 'success' | 'warning' | 'error'}
                className="mt-1"
              >
                {data.overall.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
              <ShieldCheck className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </StatCard>

        <StatCard accentColor={data.biologicalIndicators.weeklyCompliance ? 'success' : 'warning'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Weekly BI Testing</p>
              <p className="text-xl font-bold">
                {data.biologicalIndicators.weeklyCompliance ? 'Compliant' : 'Due'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.biologicalIndicators.daysUntilNextRequired > 0
                  ? `${data.biologicalIndicators.daysUntilNextRequired} days until next required`
                  : 'Test required today'}
              </p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
              <Activity className="h-5 w-5 text-accent-600" />
            </div>
          </div>
        </StatCard>

        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cycles Today</p>
              <p className="text-xl font-bold">{data.cycles.today}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.cycles.successRate.toFixed(0)}% success rate
              </p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
              <TrendingUp className="h-5 w-5 text-success-600" />
            </div>
          </div>
        </StatCard>

        <StatCard accentColor={data.packages.quarantined > 0 ? 'warning' : 'secondary'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Quarantined</p>
              <p className="text-xl font-bold">{data.packages.quarantined}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending BI results</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
          </div>
        </StatCard>
      </StatsRow>

      <DashboardGrid>
        <DashboardGrid.TwoThirds>
          {/* Active Cycles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle size="sm">Active Cycles</CardTitle>
              <Link href="/resources/sterilization">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.cycles.activeCycles.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No active cycles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.cycles.activeCycles.map((cycle) => (
                    <Link key={cycle.id} href={`/resources/sterilization/${cycle.id}`}>
                      <ListItem showArrow>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <Activity className="h-4 w-4 text-primary-600 animate-pulse" />
                          </div>
                          <div>
                            <ListItemTitle>{cycle.cycleNumber}</ListItemTitle>
                            <ListItemDescription>
                              {cycle.cycleType.replace(/_/g, ' ')} • Started{' '}
                              {format(new Date(cycle.startTime), 'h:mm a')}
                            </ListItemDescription>
                          </div>
                        </div>
                        <Badge variant="soft-primary">{cycle.status}</Badge>
                      </ListItem>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle size="sm">Package Status Overview</CardTitle>
              <Link href="/resources/sterilization/packages">
                <Button variant="ghost" size="sm">
                  View Packages
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-success-50 dark:bg-success-900/20 text-center">
                  <p className="text-2xl font-bold text-success-600">{data.packages.sterile}</p>
                  <p className="text-sm text-success-700 dark:text-success-400">Sterile</p>
                </div>
                <div
                  className={`p-4 rounded-lg text-center ${
                    data.packages.expiringToday > 0
                      ? 'bg-error-50 dark:bg-error-900/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      data.packages.expiringToday > 0 ? 'text-error-600' : ''
                    }`}
                  >
                    {data.packages.expiringToday}
                  </p>
                  <p
                    className={`text-sm ${
                      data.packages.expiringToday > 0
                        ? 'text-error-700 dark:text-error-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Expiring Today
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg text-center ${
                    data.packages.expiringThisWeek > 0
                      ? 'bg-warning-50 dark:bg-warning-900/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      data.packages.expiringThisWeek > 0 ? 'text-warning-600' : ''
                    }`}
                  >
                    {data.packages.expiringThisWeek}
                  </p>
                  <p
                    className={`text-sm ${
                      data.packages.expiringThisWeek > 0
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Expiring This Week
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg text-center ${
                    data.packages.quarantined > 0
                      ? 'bg-warning-50 dark:bg-warning-900/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      data.packages.quarantined > 0 ? 'text-warning-600' : ''
                    }`}
                  >
                    {data.packages.quarantined}
                  </p>
                  <p
                    className={`text-sm ${
                      data.packages.quarantined > 0
                        ? 'text-warning-700 dark:text-warning-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Quarantined
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardGrid.TwoThirds>

        <DashboardGrid.OneThird>
          {/* Recent Biological Tests */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Recent BI Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {data.biologicalIndicators.recentTests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">No recent tests</p>
              ) : (
                <div className="space-y-2">
                  {data.biologicalIndicators.recentTests.slice(0, 5).map((test) => (
                    <ListActivity
                      key={test.id}
                      indicatorColor={
                        test.result === 'NEGATIVE'
                          ? 'success'
                          : test.result === 'POSITIVE'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      <p className="text-sm font-medium">
                        {test.result === 'NEGATIVE' ? 'Passed' : test.result === 'POSITIVE' ? 'Failed' : 'Pending'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lot #{test.lotNumber} • {format(new Date(test.testDate), 'MMM d')}
                      </p>
                    </ListActivity>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle size="sm">Validation Status</CardTitle>
              <Link href="/resources/sterilization/validations">
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.validations.overdueCount > 0 && (
                <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
                  <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      {data.validations.overdueCount} Overdue
                    </p>
                  </div>
                </div>
              )}

              {data.validations.nextDue && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Next Validation Due</p>
                  <p className="font-medium text-sm mt-1">
                    {data.validations.nextDue.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.validations.nextDue.equipment}
                  </p>
                  <Badge variant="soft-primary" className="mt-2">
                    {format(new Date(data.validations.nextDue.dueDate), 'MMM d, yyyy')}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Upcoming (30 days)</span>
                <Badge variant="secondary">{data.validations.upcomingCount}</Badge>
              </div>
            </CardContent>
          </Card>
        </DashboardGrid.OneThird>
      </DashboardGrid>
    </div>
  );
}
