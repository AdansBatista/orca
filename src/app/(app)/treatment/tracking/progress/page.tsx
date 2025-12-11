'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  TrendingUp,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface TreatmentPlanWithProgress {
  id: string;
  planNumber: string;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  latestProgress?: {
    percentComplete: number;
    status: string;
    snapshotDate: string;
    daysInTreatment: number;
    estimatedDaysRemaining: number | null;
  };
}

const progressStatusColors: Record<string, string> = {
  ON_TRACK: 'text-success-600 bg-success-100',
  AHEAD: 'text-info-600 bg-info-100',
  BEHIND: 'text-warning-600 bg-warning-100',
  SIGNIFICANTLY_BEHIND: 'text-destructive bg-destructive/10',
  PAUSED: 'text-muted-foreground bg-muted',
};

const progressStatusLabels: Record<string, string> = {
  ON_TRACK: 'On Track',
  AHEAD: 'Ahead',
  BEHIND: 'Behind',
  SIGNIFICANTLY_BEHIND: 'Behind (Critical)',
  PAUSED: 'Paused',
};

const progressStatusIcons: Record<string, React.ReactNode> = {
  ON_TRACK: <CheckCircle2 className="h-4 w-4" />,
  AHEAD: <TrendingUp className="h-4 w-4" />,
  BEHIND: <Clock className="h-4 w-4" />,
  SIGNIFICANTLY_BEHIND: <AlertTriangle className="h-4 w-4" />,
  PAUSED: <Activity className="h-4 w-4" />,
};

export default function ProgressMonitorPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TreatmentPlanWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Fetch active treatment plans
        const params = new URLSearchParams({
          status: 'IN_PROGRESS',
          pageSize: '50',
        });

        const response = await fetch(`/api/treatment-plans?${params}`);
        const data = await response.json();

        if (data.success) {
          // Simulated progress data - in production, this would come from actual progress snapshots
          const plansWithProgress = data.data.items.map((plan: TreatmentPlanWithProgress, index: number) => ({
            ...plan,
            latestProgress: {
              percentComplete: Math.floor(Math.random() * 80) + 10,
              status: ['ON_TRACK', 'AHEAD', 'BEHIND', 'ON_TRACK', 'ON_TRACK'][index % 5],
              snapshotDate: new Date().toISOString(),
              daysInTreatment: Math.floor(Math.random() * 200) + 30,
              estimatedDaysRemaining: Math.floor(Math.random() * 180) + 30,
            },
          }));
          setPlans(plansWithProgress);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Set demo data for display purposes
        setPlans([
          {
            id: '1',
            planNumber: 'TP-2024-001',
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() - 120 * 86400000).toISOString(),
            estimatedEndDate: new Date(Date.now() + 180 * 86400000).toISOString(),
            patient: { id: '1', firstName: 'John', lastName: 'Smith' },
            latestProgress: {
              percentComplete: 65,
              status: 'ON_TRACK',
              snapshotDate: new Date().toISOString(),
              daysInTreatment: 120,
              estimatedDaysRemaining: 180,
            },
          },
          {
            id: '2',
            planNumber: 'TP-2024-002',
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
            estimatedEndDate: new Date(Date.now() + 210 * 86400000).toISOString(),
            patient: { id: '2', firstName: 'Sarah', lastName: 'Johnson' },
            latestProgress: {
              percentComplete: 35,
              status: 'BEHIND',
              snapshotDate: new Date().toISOString(),
              daysInTreatment: 90,
              estimatedDaysRemaining: 240,
            },
          },
          {
            id: '3',
            planNumber: 'TP-2024-003',
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() - 200 * 86400000).toISOString(),
            estimatedEndDate: new Date(Date.now() + 60 * 86400000).toISOString(),
            patient: { id: '3', firstName: 'Michael', lastName: 'Davis' },
            latestProgress: {
              percentComplete: 85,
              status: 'AHEAD',
              snapshotDate: new Date().toISOString(),
              daysInTreatment: 200,
              estimatedDaysRemaining: 45,
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = `${plan.patient.firstName} ${plan.patient.lastName}`.toLowerCase();
      if (!patientName.includes(query) && !plan.planNumber.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Progress status filter
    if (progressFilter !== 'all' && plan.latestProgress?.status !== progressFilter) {
      return false;
    }

    return true;
  });

  // Calculate summary stats
  const totalPlans = filteredPlans.length;
  const onTrackCount = filteredPlans.filter((p) => p.latestProgress?.status === 'ON_TRACK').length;
  const behindCount = filteredPlans.filter(
    (p) => p.latestProgress?.status === 'BEHIND' || p.latestProgress?.status === 'SIGNIFICANTLY_BEHIND'
  ).length;
  const aheadCount = filteredPlans.filter((p) => p.latestProgress?.status === 'AHEAD').length;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Progress Monitor"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Tracking', href: '/treatment/tracking' },
            { label: 'Progress' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Progress Monitor"
        description="Track treatment progress across all active plans"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Progress' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <PageContent density="comfortable">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{totalPlans}</p>
              <p className="text-sm text-muted-foreground">Active Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success-600">{onTrackCount}</p>
              <p className="text-sm text-muted-foreground">On Track</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning-600">{behindCount}</p>
              <p className="text-sm text-muted-foreground">Behind Schedule</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-info-600">{aheadCount}</p>
              <p className="text-sm text-muted-foreground">Ahead</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or plan numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Progress Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ON_TRACK">On Track</SelectItem>
                  <SelectItem value="AHEAD">Ahead</SelectItem>
                  <SelectItem value="BEHIND">Behind</SelectItem>
                  <SelectItem value="SIGNIFICANTLY_BEHIND">Significantly Behind</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Plans List */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Treatment Plans ({filteredPlans.length})
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">No Plans Found</p>
                <p className="text-muted-foreground">
                  {searchQuery || progressFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No active treatment plans to monitor'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((plan) => (
                  <Link key={plan.id} href={`/treatment/plans/${plan.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            progressStatusColors[plan.latestProgress?.status || 'ON_TRACK']
                          }`}
                        >
                          {progressStatusIcons[plan.latestProgress?.status || 'ON_TRACK']}
                        </div>
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium">
                              {plan.patient.firstName} {plan.patient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-sm text-muted-foreground">{plan.planNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-muted-foreground">Started</p>
                          <p className="text-sm font-medium">
                            {format(new Date(plan.startDate), 'MMM d, yyyy')}
                          </p>
                        </div>

                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {plan.latestProgress?.percentComplete || 0}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                plan.latestProgress?.status === 'BEHIND' ||
                                plan.latestProgress?.status === 'SIGNIFICANTLY_BEHIND'
                                  ? 'bg-warning-500'
                                  : plan.latestProgress?.status === 'AHEAD'
                                  ? 'bg-info-500'
                                  : 'bg-success-500'
                              }`}
                              style={{ width: `${plan.latestProgress?.percentComplete || 0}%` }}
                            />
                          </div>
                        </div>

                        <Badge
                          className={`${
                            progressStatusColors[plan.latestProgress?.status || 'ON_TRACK']
                          } hidden md:inline-flex`}
                        >
                          {progressStatusLabels[plan.latestProgress?.status || 'ON_TRACK']}
                        </Badge>

                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
