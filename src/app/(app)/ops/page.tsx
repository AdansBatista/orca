'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  Map,
  RefreshCw,
  Settings,
  CheckSquare,
  Clock,
  Users,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientFlowBoard } from '@/components/ops/PatientFlowBoard';
import { QueueDisplay } from '@/components/ops/QueueDisplay';
import { toast } from 'sonner';

interface DashboardMetrics {
  appointments: {
    scheduled: number;
    arrived: number;
    inProgress: number;
    completed: number;
    noShow: number;
    cancelled: number;
    remaining: number;
  };
  waitTime: {
    average: number;
    max: number;
    patientsWaiting: number;
    extendedWait: number;
  };
  chairTime: {
    average: number;
  };
  performance: {
    onTimePercentage: number;
    chairUtilization: number;
  };
  flow: Record<string, number>;
  resources: {
    totalChairs: number;
    occupiedChairs: number;
    availableChairs: number;
  };
}

export default function OpsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState<'kanban' | 'queue'>('kanban');

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/dashboard/metrics');
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchMetrics();

    // Poll every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshKey]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Operations' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ops/floor-plan">
              <Button variant="outline" size="sm">
                <Map className="h-4 w-4 mr-2" />
                Floor Plan
              </Button>
            </Link>
            <Link href="/ops/tasks">
              <Button variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats Overview */}
          <StatsRow>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Waiting</p>
                  <p className="text-xl font-bold">{metrics?.waitTime.patientsWaiting ?? 0}</p>
                  {metrics?.waitTime.extendedWait ? (
                    <p className="text-xs text-warning-600">
                      {metrics.waitTime.extendedWait} extended wait
                    </p>
                  ) : null}
                </div>
                <Users className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
            <StatCard
              accentColor={
                (metrics?.waitTime.average ?? 0) > 15
                  ? 'error'
                  : (metrics?.waitTime.average ?? 0) > 10
                    ? 'warning'
                    : 'success'
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Wait</p>
                  <p className="text-xl font-bold">{metrics?.waitTime.average ?? 0} min</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </StatCard>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Treatment</p>
                  <p className="text-xl font-bold">{metrics?.appointments.inProgress ?? 0}</p>
                </div>
                <Activity className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{metrics?.appointments.completed ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    of {metrics?.appointments.scheduled ?? 0} scheduled
                  </p>
                </div>
                <CheckSquare className="h-8 w-8 text-success-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div>
                <p className="text-xs text-muted-foreground">Chair Utilization</p>
                <p className="text-xl font-bold">{metrics?.performance.chairUtilization ?? 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.resources.occupiedChairs ?? 0}/{metrics?.resources.totalChairs ?? 0} chairs
                </p>
              </div>
            </StatCard>
          </StatsRow>

          {/* View Toggle and Patient Flow */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Patient Flow</CardTitle>
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'kanban' | 'queue')}>
                  <TabsList>
                    <TabsTrigger value="kanban">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Board
                    </TabsTrigger>
                    <TabsTrigger value="queue">
                      <List className="h-4 w-4 mr-2" />
                      Queue
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {activeView === 'kanban' ? (
                <PatientFlowBoard key={refreshKey} onRefresh={handleRefresh} />
              ) : (
                <QueueDisplay key={refreshKey} onRefresh={handleRefresh} />
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="ghost">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {metrics?.flow?.scheduled ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {(metrics?.flow?.checkedIn ?? 0) + (metrics?.flow?.waiting ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Checked In</div>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {metrics?.flow?.inChair ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">In Chair</div>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {(metrics?.flow?.completed ?? 0) +
                    (metrics?.flow?.checkedOut ?? 0) +
                    (metrics?.flow?.departed ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Done Today</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
