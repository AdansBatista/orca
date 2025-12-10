'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart3,
  Target,
  TrendingUp,
  Users,
  Award,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

interface AnalyticsData {
  goals: {
    total: number;
    byStatus: { status: string; count: number }[];
    byCategory: { category: string; count: number }[];
    completionTrend: { month: string; completed: number; total: number }[];
  };
  reviews: {
    total: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    avgRating: number;
    ratingDistribution: { rating: number; count: number }[];
  };
  training: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    byType: { type: string; count: number }[];
  };
}

const GOAL_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  EXCEEDED: '#10b981',
  NOT_MET: '#ef4444',
  CANCELLED: '#6b7280',
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  PENDING_APPROVAL: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#6b7280',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch goals, reviews, and training data in parallel
      const [goalsRes, reviewsRes, trainingRes] = await Promise.all([
        fetch('/api/staff/goals?pageSize=100'),
        fetch('/api/staff/reviews?pageSize=100'),
        fetch('/api/staff/training?pageSize=100'),
      ]);

      const [goalsData, reviewsData, trainingData] = await Promise.all([
        goalsRes.json(),
        reviewsRes.json(),
        trainingRes.json(),
      ]);

      // Process goals data
      const goals = goalsData.success ? goalsData.data.items : [];
      const goalsByStatus = goals.reduce(
        (acc: Record<string, number>, g: { status: string }) => {
          acc[g.status] = (acc[g.status] || 0) + 1;
          return acc;
        },
        {}
      );
      const goalsByCategory = goals.reduce(
        (acc: Record<string, number>, g: { category: string }) => {
          acc[g.category] = (acc[g.category] || 0) + 1;
          return acc;
        },
        {}
      );

      // Generate completion trend (last 6 months)
      const completionTrend = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthGoals = goals.filter((g: { targetDate: string }) => {
          const d = new Date(g.targetDate);
          return d >= monthStart && d <= monthEnd;
        });
        const completed = monthGoals.filter(
          (g: { status: string }) => g.status === 'COMPLETED' || g.status === 'EXCEEDED'
        ).length;
        completionTrend.push({
          month: format(month, 'MMM'),
          completed,
          total: monthGoals.length,
        });
      }

      // Process reviews data
      const reviews = reviewsData.success ? reviewsData.data.items : [];
      const reviewsByStatus = reviews.reduce(
        (acc: Record<string, number>, r: { status: string }) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        },
        {}
      );
      const reviewsByType = reviews.reduce(
        (acc: Record<string, number>, r: { reviewType: string }) => {
          acc[r.reviewType] = (acc[r.reviewType] || 0) + 1;
          return acc;
        },
        {}
      );
      const completedReviews = reviews.filter(
        (r: { status: string; overallRating: number | null }) =>
          r.status === 'COMPLETED' && r.overallRating
      );
      const avgRating =
        completedReviews.length > 0
          ? completedReviews.reduce(
              (sum: number, r: { overallRating: number }) => sum + r.overallRating,
              0
            ) / completedReviews.length
          : 0;

      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: completedReviews.filter(
          (r: { overallRating: number }) => Math.round(r.overallRating) === rating
        ).length,
      }));

      // Process training data
      const training = trainingData.success ? trainingData.data.items : [];
      const completedTraining = training.filter(
        (t: { status: string }) => t.status === 'COMPLETED'
      ).length;
      const overdueTraining = training.filter(
        (t: { status: string; dueDate: string }) =>
          t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()
      ).length;
      const trainingByType = training.reduce(
        (acc: Record<string, number>, t: { type: string }) => {
          acc[t.type] = (acc[t.type] || 0) + 1;
          return acc;
        },
        {}
      );

      setData({
        goals: {
          total: goals.length,
          byStatus: Object.entries(goalsByStatus).map(([status, count]) => ({
            status,
            count: count as number,
          })),
          byCategory: Object.entries(goalsByCategory).map(([category, count]) => ({
            category,
            count: count as number,
          })),
          completionTrend,
        },
        reviews: {
          total: reviews.length,
          byStatus: Object.entries(reviewsByStatus).map(([status, count]) => ({
            status,
            count: count as number,
          })),
          byType: Object.entries(reviewsByType).map(([type, count]) => ({
            type,
            count: count as number,
          })),
          avgRating,
          ratingDistribution,
        },
        training: {
          total: training.length,
          completed: completedTraining,
          overdue: overdueTraining,
          completionRate:
            training.length > 0
              ? Math.round((completedTraining / training.length) * 100)
              : 0,
          byType: Object.entries(trainingByType).map(([type, count]) => ({
            type,
            count: count as number,
          })),
        },
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <>
      <PageHeader
        title="Performance Analytics"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Performance', href: '/staff/performance' },
          { label: 'Analytics' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAnalyticsData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Goals</p>
                    <p className="text-lg font-bold">{data.goals.total}</p>
                  </div>
                  <Target className="h-5 w-5 text-primary-500" />
                </div>
              </StatCard>
              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Performance Reviews</p>
                    <p className="text-lg font-bold">{data.reviews.total}</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-accent-500" />
                </div>
              </StatCard>
              <StatCard accentColor="success">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Review Rating</p>
                    <p className="text-lg font-bold">{data.reviews.avgRating.toFixed(1)}/5</p>
                  </div>
                  <Award className="h-5 w-5 text-success-500" />
                </div>
              </StatCard>
              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Training Completion</p>
                    <p className="text-lg font-bold">{data.training.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-warning-500" />
                </div>
              </StatCard>
            </StatsRow>

            {/* Charts Row 1 */}
            <DashboardGrid>
              <DashboardGrid.TwoThirds>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Goal Completion Trend</CardTitle>
                    <CardDescription>Monthly goal completion over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.goals.completionTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#94a3b8"
                            name="Total Goals"
                          />
                          <Line
                            type="monotone"
                            dataKey="completed"
                            stroke="#22c55e"
                            name="Completed"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.TwoThirds>
              <DashboardGrid.OneThird>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Goals by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.goals.byStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="status"
                            label={({ name }) => formatStatusLabel(name as string)}
                          >
                            {data.goals.byStatus.map((entry, index) => (
                              <Cell
                                key={entry.status}
                                fill={GOAL_STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, formatStatusLabel(name as string)]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.OneThird>
            </DashboardGrid>

            {/* Charts Row 2 */}
            <DashboardGrid>
              <DashboardGrid.Half>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Review Rating Distribution</CardTitle>
                    <CardDescription>Distribution of review scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.reviews.ratingDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Reviews" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.Half>
              <DashboardGrid.Half>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Reviews by Type</CardTitle>
                    <CardDescription>Breakdown by review type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.reviews.byType} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="type"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => formatStatusLabel(v)}
                          />
                          <Tooltip formatter={(value, name) => [value, formatStatusLabel(name as string)]} />
                          <Bar dataKey="count" fill="#8b5cf6" name="Reviews" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.Half>
            </DashboardGrid>

            {/* Charts Row 3 */}
            <DashboardGrid>
              <DashboardGrid.Half>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Goals by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.goals.byCategory}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            nameKey="category"
                            label={({ name }) => formatStatusLabel(name as string)}
                          >
                            {data.goals.byCategory.map((_, index) => (
                              <Cell
                                key={index}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, formatStatusLabel(name as string)]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.Half>
              <DashboardGrid.Half>
                <Card>
                  <CardHeader compact>
                    <CardTitle size="sm">Training Summary</CardTitle>
                    <CardDescription>Training completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Trainings</span>
                        <span className="font-bold">{data.training.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Completed</span>
                        <Badge variant="success">{data.training.completed}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Overdue</span>
                        <Badge variant="destructive">{data.training.overdue}</Badge>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Completion Rate</span>
                          <span className="text-sm font-bold">{data.training.completionRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success-500 transition-all"
                            style={{ width: `${data.training.completionRate}%` }}
                          />
                        </div>
                      </div>
                      {data.training.byType.length > 0 && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">By Type</p>
                          <div className="space-y-2">
                            {data.training.byType.slice(0, 5).map((t) => (
                              <div key={t.type} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground truncate">
                                  {formatStatusLabel(t.type)}
                                </span>
                                <Badge variant="outline">{t.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DashboardGrid.Half>
            </DashboardGrid>
          </div>
        ) : (
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </>
  );
}
