'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Clock, Users, Calendar, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

interface CollectionAnalytics {
  summary: {
    totalAR: number;
    totalInCollection: number;
    collectionRate: number;
    averageDaysToCollect: number;
    dso: number;
    recoveryRate: number;
  };
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    over120: number;
  };
  performance: {
    promiseKeptRate: number;
    agencyRecoveryRate: number;
    writeOffRate: number;
    reminderResponseRate: number;
  };
  trends: {
    arTrend: number;
    collectionTrend: number;
    dsoTrend: number;
  };
}

export default function CollectionAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CollectionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/analytics?period=${period}`);
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
    if (value === 0) return <span className="text-muted-foreground">-</span>;
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}{suffix}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/collections">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Collection Analytics</h1>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Collection Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and collection insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total AR</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.summary.totalAR)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-2">
                  <TrendIndicator value={analytics.trends.arTrend} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold mt-1">{analytics.summary.collectionRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <TrendIndicator value={analytics.trends.collectionTrend} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">DSO (Days Sales Outstanding)</p>
                    <p className="text-2xl font-bold mt-1">{analytics.summary.dso.toFixed(0)} days</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <TrendIndicator value={-analytics.trends.dsoTrend} suffix=" days" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Collections</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.summary.totalInCollection)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Recovery rate: {analytics.summary.recoveryRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aging Breakdown and Performance */}
          <div className="grid grid-cols-2 gap-6">
            {/* Aging Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Aging Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AgingBar label="Current" amount={analytics.aging.current} total={analytics.summary.totalAR} color="bg-green-500" />
                <AgingBar label="1-30 Days" amount={analytics.aging.days1to30} total={analytics.summary.totalAR} color="bg-yellow-500" />
                <AgingBar label="31-60 Days" amount={analytics.aging.days31to60} total={analytics.summary.totalAR} color="bg-orange-500" />
                <AgingBar label="61-90 Days" amount={analytics.aging.days61to90} total={analytics.summary.totalAR} color="bg-red-400" />
                <AgingBar label="91-120 Days" amount={analytics.aging.days91to120} total={analytics.summary.totalAR} color="bg-red-500" />
                <AgingBar label="120+ Days" amount={analytics.aging.over120} total={analytics.summary.totalAR} color="bg-red-700" />
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PerformanceMetric
                  label="Promise Kept Rate"
                  value={analytics.performance.promiseKeptRate}
                  description="Percentage of payment promises fulfilled"
                  threshold={{ good: 70, warning: 50 }}
                />
                <PerformanceMetric
                  label="Agency Recovery Rate"
                  value={analytics.performance.agencyRecoveryRate}
                  description="Percentage recovered through agencies"
                  threshold={{ good: 30, warning: 15 }}
                />
                <PerformanceMetric
                  label="Reminder Response Rate"
                  value={analytics.performance.reminderResponseRate}
                  description="Percentage responding to payment reminders"
                  threshold={{ good: 40, warning: 20 }}
                />
                <PerformanceMetric
                  label="Write-off Rate"
                  value={analytics.performance.writeOffRate}
                  description="Percentage of AR written off"
                  threshold={{ good: 2, warning: 5 }}
                  inverse
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Common collection tasks</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/billing/collections/aging">View Aging Report</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/billing/collections/workqueue">Open Workqueue</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/billing/collections/write-offs">Manage Write-offs</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AgingBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</div>
    </div>
  );
}

function PerformanceMetric({
  label,
  value,
  description,
  threshold,
  inverse = false,
}: {
  label: string;
  value: number;
  description: string;
  threshold: { good: number; warning: number };
  inverse?: boolean;
}) {
  let status: 'success' | 'warning' | 'destructive';

  if (inverse) {
    // Lower is better (like write-off rate)
    if (value <= threshold.good) status = 'success';
    else if (value <= threshold.warning) status = 'warning';
    else status = 'destructive';
  } else {
    // Higher is better
    if (value >= threshold.good) status = 'success';
    else if (value >= threshold.warning) status = 'warning';
    else status = 'destructive';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium">{label}</span>
        <Badge variant={status}>{value.toFixed(1)}%</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
