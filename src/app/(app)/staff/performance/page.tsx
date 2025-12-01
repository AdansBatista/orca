'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  BarChart3,
  Target,
  Award,
  BookOpen,
  GraduationCap,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Plus,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

interface DashboardStats {
  metrics: {
    total: number;
    recentCount: number;
    avgValue: number;
  };
  goals: {
    total: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
  reviews: {
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
  };
  training: {
    total: number;
    completed: number;
    overdue: number;
    expiringSoon: number;
  };
  ceCredits: {
    totalCredits: number;
    verified: number;
    pending: number;
  };
  recognition: {
    total: number;
    thisMonth: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'metric' | 'goal' | 'review' | 'training' | 'ce_credit' | 'recognition';
  title: string;
  staffName: string;
  date: string;
  status?: string;
}

export default function PerformanceDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentGoals, setRecentGoals] = useState<any[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  const [overdueTraining, setOverdueTraining] = useState<any[]>([]);
  const [recentRecognitions, setRecentRecognitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState('all');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [
        goalsRes,
        reviewsRes,
        trainingRes,
        ceCreditsRes,
        recognitionRes,
      ] = await Promise.all([
        fetch('/api/staff/goals?pageSize=5'),
        fetch('/api/staff/reviews?pageSize=5&status=SCHEDULED'),
        fetch('/api/staff/training?overdue=true&pageSize=5'),
        fetch('/api/staff/ce-credits?pageSize=5'),
        fetch('/api/staff/recognition?pageSize=5'),
      ]);

      const [goalsData, reviewsData, trainingData, ceCreditsData, recognitionData] = await Promise.all([
        goalsRes.json(),
        reviewsRes.json(),
        trainingRes.json(),
        ceCreditsRes.json(),
        recognitionRes.json(),
      ]);

      // Set recent items
      if (goalsData.success) setRecentGoals(goalsData.data.items);
      if (reviewsData.success) setUpcomingReviews(reviewsData.data.items);
      if (trainingData.success) setOverdueTraining(trainingData.data.items);
      if (recognitionData.success) setRecentRecognitions(recognitionData.data.items);

      // Calculate stats from responses
      const completedGoals = goalsData.success
        ? goalsData.data.items.filter((g: any) => g.status === 'COMPLETED').length
        : 0;
      const inProgressGoals = goalsData.success
        ? goalsData.data.items.filter((g: any) => g.status === 'IN_PROGRESS').length
        : 0;

      setStats({
        metrics: {
          total: 0,
          recentCount: 0,
          avgValue: 0,
        },
        goals: {
          total: goalsData.success ? goalsData.data.total : 0,
          inProgress: inProgressGoals,
          completed: completedGoals,
          completionRate: goalsData.success && goalsData.data.total > 0
            ? Math.round((completedGoals / goalsData.data.total) * 100)
            : 0,
        },
        reviews: {
          total: reviewsData.success ? reviewsData.data.total : 0,
          scheduled: reviewsData.success ? reviewsData.data.items.length : 0,
          completed: 0,
          overdue: 0,
        },
        training: {
          total: trainingData.success ? trainingData.data.total : 0,
          completed: 0,
          overdue: trainingData.success ? trainingData.data.total : 0,
          expiringSoon: 0,
        },
        ceCredits: {
          totalCredits: ceCreditsData.success ? ceCreditsData.data.totalCredits : 0,
          verified: 0,
          pending: 0,
        },
        recognition: {
          total: recognitionData.success ? recognitionData.data.total : 0,
          thisMonth: recognitionData.success ? recognitionData.data.items.length : 0,
        },
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const goalStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'ON_HOLD':
        return 'warning';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const reviewStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'SCHEDULED':
        return 'secondary';
      case 'PENDING_APPROVAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <PageHeader
        title="Performance & Training"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff' },
          { label: 'Performance & Training' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/staff/performance/recognition">
                <Star className="h-4 w-4 mr-2" />
                Give Recognition
              </a>
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats Row */}
          {stats && (
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Goals</p>
                    <p className="text-lg font-bold">{stats.goals.inProgress}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.goals.completionRate}% completion rate
                    </p>
                  </div>
                  <Target className="h-5 w-5 text-primary-500" />
                </div>
              </StatCard>
              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Upcoming Reviews</p>
                    <p className="text-lg font-bold">{stats.reviews.scheduled}</p>
                    <p className="text-xs text-muted-foreground">scheduled</p>
                  </div>
                  <Calendar className="h-5 w-5 text-warning-500" />
                </div>
              </StatCard>
              <StatCard accentColor="destructive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Overdue Training</p>
                    <p className="text-lg font-bold">{stats.training.overdue}</p>
                    <p className="text-xs text-muted-foreground">needs attention</p>
                  </div>
                  <BookOpen className="h-5 w-5 text-destructive-500" />
                </div>
              </StatCard>
              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">CE Credits</p>
                    <p className="text-lg font-bold">{stats.ceCredits.totalCredits}</p>
                    <p className="text-xs text-muted-foreground">total earned</p>
                  </div>
                  <GraduationCap className="h-5 w-5 text-accent-500" />
                </div>
              </StatCard>
            </StatsRow>
          )}

          {/* Main Content Grid */}
          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              <div className="space-y-6">
                {/* Goals */}
                <Card>
                  <CardHeader compact>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle size="sm" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Staff Goals
                        </CardTitle>
                        <CardDescription>Recent and in-progress goals</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/staff/performance/goals">View All</a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent compact>
                    {isLoading ? (
                      <p className="text-center py-4 text-muted-foreground">Loading...</p>
                    ) : recentGoals.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No goals found</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Goal</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentGoals.map((goal) => (
                            <TableRow key={goal.id}>
                              <TableCell className="font-medium">{goal.title}</TableCell>
                              <TableCell>
                                {goal.staffProfile?.firstName} {goal.staffProfile?.lastName}
                              </TableCell>
                              <TableCell>
                                {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary-500"
                                      style={{ width: `${goal.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {goal.progress}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={goalStatusVariant(goal.status)}>
                                  {goal.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Reviews */}
                <Card>
                  <CardHeader compact>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle size="sm" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Upcoming Reviews
                        </CardTitle>
                        <CardDescription>Scheduled performance reviews</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/staff/performance/reviews">View All</a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent compact>
                    {isLoading ? (
                      <p className="text-center py-4 text-muted-foreground">Loading...</p>
                    ) : upcomingReviews.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No upcoming reviews</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Review Type</TableHead>
                            <TableHead>Review Period</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingReviews.map((review) => (
                            <TableRow key={review.id}>
                              <TableCell className="font-medium">
                                {review.staffProfile?.firstName} {review.staffProfile?.lastName}
                              </TableCell>
                              <TableCell>{review.reviewType.replace('_', ' ')}</TableCell>
                              <TableCell>
                                {format(new Date(review.reviewPeriodStart), 'MMM d')} -{' '}
                                {format(new Date(review.reviewPeriodEnd), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={reviewStatusVariant(review.status)}>
                                  {review.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird>
              <div className="space-y-6">
                {/* Overdue Training */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2 text-destructive">
                      <BookOpen className="h-4 w-4" />
                      Overdue Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : overdueTraining.length === 0 ? (
                      <p className="text-sm text-success-600">All training is up to date!</p>
                    ) : (
                      <div className="space-y-3">
                        {overdueTraining.slice(0, 5).map((training) => (
                          <div
                            key={training.id}
                            className="flex items-start justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium">{training.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {training.staffProfile?.firstName} {training.staffProfile?.lastName}
                              </p>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href="/staff/performance/training">View All Training</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Recognition */}
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent-500" />
                      Recent Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : recentRecognitions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">No recognitions yet</p>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/staff/performance/recognition">
                            <Plus className="h-3 w-3 mr-1" />
                            Give Recognition
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentRecognitions.slice(0, 5).map((rec) => (
                          <div key={rec.id} className="border-l-2 border-accent-500 pl-3">
                            <p className="font-medium text-sm">{rec.title}</p>
                            <p className="text-xs text-muted-foreground">
                              to {rec.staffProfile?.firstName} {rec.staffProfile?.lastName}
                              {rec.givenByName && !rec.isAnonymous && ` from ${rec.givenByName}`}
                            </p>
                            <Badge variant="soft-primary" className="mt-1 text-xs">
                              {rec.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href="/staff/performance/recognition">View All</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card variant="ghost">
                  <CardHeader compact>
                    <CardTitle size="sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <a href="/staff/performance/goals">
                          <Target className="h-4 w-4 mr-2" />
                          Manage Goals
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <a href="/staff/performance/reviews">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Reviews
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <a href="/staff/performance/training">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Training Records
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <a href="/staff/performance/ce-credits">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          CE Credits
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
