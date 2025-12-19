'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  TrendingUp,
  ArrowRight,
  Users,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow, DashboardGrid } from '@/components/layout';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  aging: {
    totalAR: number;
    patientAR: number;
    insuranceAR: number;
    buckets: {
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days91_120: number;
      days120Plus: number;
    };
    avgDaysOutstanding: number;
  };
  dso: number;
  collections: {
    activeAccounts: number;
    pausedAccounts: number;
    atAgencyAccounts: number;
    totalBalance: number;
    totalCollected: number;
    pendingPromises: number;
    pendingWriteOffs: number;
    collectionRate: number;
  };
}

export default function CollectionsDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/collections/aging/summary');
        const data = await res.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="text-muted-foreground">
            Manage accounts receivable, aging, and collection workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/billing/collections/aging">View Aging Report</Link>
          </Button>
          <Button asChild>
            <Link href="/billing/collections/workqueue">Collection Workqueue</Link>
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total AR</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.aging.totalAR || 0)}</p>
              <p className="text-xs text-muted-foreground">{stats?.aging.avgDaysOutstanding || 0} avg days outstanding</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-500" />
          </div>
        </StatCard>
        <StatCard accentColor="accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">DSO</p>
              <p className="text-2xl font-bold">{stats?.dso || 0} days</p>
              <p className="text-xs text-muted-foreground">Days Sales Outstanding</p>
            </div>
            <Clock className="h-8 w-8 text-accent-500" />
          </div>
        </StatCard>
        <StatCard accentColor="success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold">{stats?.collections.collectionRate || 0}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(stats?.collections.totalCollected || 0)} collected</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success-500" />
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Collections</p>
              <p className="text-2xl font-bold">{stats?.collections.activeAccounts || 0}</p>
              <p className="text-xs text-muted-foreground">{stats?.collections.pausedAccounts || 0} paused</p>
            </div>
            <Users className="h-8 w-8 text-warning-500" />
          </div>
        </StatCard>
      </StatsRow>

      <DashboardGrid>
        <DashboardGrid.TwoThirds>
          {/* Aging Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AR Aging</CardTitle>
              <CardDescription>Outstanding balances by age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2 text-sm">
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <p className="font-semibold text-green-700 dark:text-green-400">Current</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.current || 0)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="font-semibold text-blue-700 dark:text-blue-400">1-30</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.days1_30 || 0)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">31-60</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.days31_60 || 0)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <p className="font-semibold text-orange-700 dark:text-orange-400">61-90</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.days61_90 || 0)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <p className="font-semibold text-red-700 dark:text-red-400">91-120</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.days91_120 || 0)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <p className="font-semibold text-purple-700 dark:text-purple-400">120+</p>
                    <p className="text-lg font-bold">{formatCurrency(stats?.aging.buckets.days120Plus || 0)}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Patient AR</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.aging.patientAR || 0)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Insurance AR</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.aging.insuranceAR || 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Link href="/billing/collections/aging">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Aging Report</h3>
                    <p className="text-sm text-muted-foreground">View detailed AR aging</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/collections/workqueue">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Collection Workqueue</h3>
                    <p className="text-sm text-muted-foreground">Manage active collections</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/collections/workflows">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Workflows</h3>
                    <p className="text-sm text-muted-foreground">Configure collection workflows</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/collections/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Collection performance</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </DashboardGrid.TwoThirds>

        <DashboardGrid.OneThird>
          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/billing/collections/promises?dueToday=true"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span>Promises Due Today</span>
                </div>
                <Badge variant="soft-primary">
                  {stats?.collections.pendingPromises || 0}
                </Badge>
              </Link>

              <Link
                href="/billing/collections/write-offs?pendingOnly=true"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Pending Write-offs</span>
                </div>
                <Badge variant="warning">
                  {stats?.collections.pendingWriteOffs || 0}
                </Badge>
              </Link>

              <Link
                href="/billing/collections/workqueue?status=PAUSED"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Pause className="h-5 w-5 text-yellow-500" />
                  <span>Paused Accounts</span>
                </div>
                <Badge variant="secondary">
                  {stats?.collections.pausedAccounts || 0}
                </Badge>
              </Link>

              <Link
                href="/billing/collections/agencies"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <span>At Agency</span>
                </div>
                <Badge variant="destructive">
                  {stats?.collections.atAgencyAccounts || 0}
                </Badge>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/billing/collections/reminders?action=batch">
                  <FileText className="mr-2 h-4 w-4" />
                  Send Batch Reminders
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/billing/collections/write-offs/new">
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Write-off
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/billing/collections/aging?export=true">
                  <FileText className="mr-2 h-4 w-4" />
                  Export Aging Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        </DashboardGrid.OneThird>
      </DashboardGrid>
    </div>
  );
}
