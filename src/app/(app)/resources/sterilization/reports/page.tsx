'use client';

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart3,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardGrid, StatsRow } from '@/components/layout';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SummaryReport {
  period: { startDate: string; endDate: string };
  cycles: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  };
  packages: {
    total: number;
    sterile: number;
    used: number;
    expired: number;
    expiringWithin7Days: number;
  };
  usages: { total: number };
  recentCycles: Array<{
    id: string;
    cycleNumber: string;
    cycleType: string;
    status: string;
    startTime: string;
    mechanicalPass: boolean | null;
    chemicalPass: boolean | null;
    biologicalPass: boolean | null;
  }>;
  recentUsages: Array<{
    id: string;
    patientId: string;
    usedAt: string;
    procedureType: string | null;
    package: {
      packageNumber: string;
      instrumentNames: string[];
    };
  }>;
}

interface ComplianceReport {
  period: { startDate: string; endDate: string };
  biologicalIndicators: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    passRate: number | null;
    weeksMissing: number;
  };
  failedCycles: {
    count: number;
    cycles: Array<{
      id: string;
      cycleNumber: string;
      startTime: string;
      failureReason: string | null;
    }>;
  };
  complianceLogs: {
    total: number;
    compliant: number;
    deficiencies: number;
  };
}

interface PackageReport {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  expiringSoon: Array<{
    id: string;
    packageNumber: string;
    packageType: string;
    instrumentNames: string[];
    expirationDate: string;
    daysUntilExpiration: number;
  }>;
}

type ReportType = 'summary' | 'compliance' | 'packages';

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function SterilizationReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [summaryData, setSummaryData] = useState<SummaryReport | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceReport | null>(null);
  const [packageData, setPackageData] = useState<PackageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchReport = async (type: ReportType) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        startDate,
        endDate,
      });

      const response = await fetch(`/api/resources/sterilization/reports?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch report');
      }

      switch (type) {
        case 'summary':
          setSummaryData(result.data);
          break;
        case 'compliance':
          setComplianceData(result.data);
          break;
        case 'packages':
          setPackageData(result.data);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType, startDate, endDate]);

  const handleRefresh = () => {
    fetchReport(reportType);
  };

  return (
    <>
      <PageHeader
        title="Sterilization Reports"
        description="Analytics and compliance tracking"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Reports' },
        ]}
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Date Filters */}
          <Card variant="ghost">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-end gap-4">
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                      setEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                      setEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
                      setEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                  >
                    Last 90 days
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Type Tabs */}
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <TabsList>
              <TabsTrigger value="summary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="packages">
                <Package className="h-4 w-4 mr-2" />
                Packages
              </TabsTrigger>
            </TabsList>

            {/* Error State */}
            {error && (
              <div className="mt-6 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-4">
                <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Summary Report */}
            <TabsContent value="summary" className="mt-6">
              {loading ? (
                <ReportSkeleton />
              ) : summaryData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <StatsRow>
                    <StatCard accentColor="primary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Cycles Run</p>
                          <p className="text-xl font-bold">{summaryData.cycles.total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {summaryData.cycles.successRate.toFixed(1)}% success rate
                          </p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                          <Activity className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="accent">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Packages Created</p>
                          <p className="text-xl font-bold">{summaryData.packages.total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {summaryData.packages.sterile} currently sterile
                          </p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
                          <Package className="h-5 w-5 text-accent-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="success">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Packages Used</p>
                          <p className="text-xl font-bold">{summaryData.usages.total}</p>
                          <p className="text-xs text-muted-foreground mt-1">With patients</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                          <TrendingUp className="h-5 w-5 text-success-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={summaryData.packages.expiringWithin7Days > 0 ? 'warning' : 'secondary'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Expiring Soon</p>
                          <p className="text-xl font-bold">{summaryData.packages.expiringWithin7Days}</p>
                          <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                          <Clock className="h-5 w-5 text-warning-600" />
                        </div>
                      </div>
                    </StatCard>
                  </StatsRow>

                  <DashboardGrid>
                    <DashboardGrid.TwoThirds>
                      {/* Cycle Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Cycle Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
                              <p className="text-3xl font-bold text-success-600">
                                {summaryData.cycles.completed}
                              </p>
                              <p className="text-sm text-success-700 dark:text-success-400">
                                Completed
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-error-50 dark:bg-error-900/20">
                              <p className="text-3xl font-bold text-error-600">
                                {summaryData.cycles.failed}
                              </p>
                              <p className="text-sm text-error-700 dark:text-error-400">
                                Failed
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="text-3xl font-bold">
                                {summaryData.cycles.total - summaryData.cycles.completed - summaryData.cycles.failed}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                In Progress/Other
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Cycles */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Recent Cycles</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {summaryData.recentCycles.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No cycles in this period
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {summaryData.recentCycles.map((cycle) => (
                                <div
                                  key={cycle.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                      {cycle.mechanicalPass === true && (
                                        <CheckCircle className="h-4 w-4 text-success-600" />
                                      )}
                                      {cycle.mechanicalPass === false && (
                                        <XCircle className="h-4 w-4 text-error-600" />
                                      )}
                                      {cycle.chemicalPass === true && (
                                        <CheckCircle className="h-4 w-4 text-success-600" />
                                      )}
                                      {cycle.chemicalPass === false && (
                                        <XCircle className="h-4 w-4 text-error-600" />
                                      )}
                                      {cycle.biologicalPass === true && (
                                        <CheckCircle className="h-4 w-4 text-success-600" />
                                      )}
                                      {cycle.biologicalPass === false && (
                                        <XCircle className="h-4 w-4 text-error-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{cycle.cycleNumber}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {cycle.cycleType.replace(/_/g, ' ')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        cycle.status === 'COMPLETED'
                                          ? 'success'
                                          : cycle.status === 'FAILED'
                                          ? 'error'
                                          : 'secondary'
                                      }
                                    >
                                      {cycle.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(cycle.startTime), 'MMM d')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DashboardGrid.TwoThirds>

                    <DashboardGrid.OneThird>
                      {/* Package Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Package Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Sterile</span>
                            <Badge variant="success">{summaryData.packages.sterile}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Used</span>
                            <Badge variant="secondary">{summaryData.packages.used}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Expired</span>
                            <Badge variant="error">{summaryData.packages.expired}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Usages */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Recent Usages</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {summaryData.recentUsages.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 text-sm">
                              No usages recorded
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {summaryData.recentUsages.map((usage) => (
                                <div
                                  key={usage.id}
                                  className="p-2 rounded-lg bg-muted/30 text-sm"
                                >
                                  <p className="font-medium">{usage.package.packageNumber}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {usage.procedureType || 'General'} •{' '}
                                    {format(new Date(usage.usedAt), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DashboardGrid.OneThird>
                  </DashboardGrid>
                </div>
              ) : null}
            </TabsContent>

            {/* Compliance Report */}
            <TabsContent value="compliance" className="mt-6">
              {loading ? (
                <ReportSkeleton />
              ) : complianceData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <StatsRow>
                    <StatCard accentColor="primary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">BI Tests</p>
                          <p className="text-xl font-bold">{complianceData.biologicalIndicators.total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {complianceData.biologicalIndicators.passRate !== null
                              ? `${complianceData.biologicalIndicators.passRate.toFixed(1)}% pass rate`
                              : 'No results yet'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                          <ClipboardCheck className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="success">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">BI Passed</p>
                          <p className="text-xl font-bold">{complianceData.biologicalIndicators.passed}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={complianceData.biologicalIndicators.failed > 0 ? 'error' : 'secondary'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">BI Failed</p>
                          <p className="text-xl font-bold">{complianceData.biologicalIndicators.failed}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                          <XCircle className="h-5 w-5 text-error-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={complianceData.failedCycles.count > 0 ? 'warning' : 'success'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Failed Cycles</p>
                          <p className="text-xl font-bold">{complianceData.failedCycles.count}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                          <AlertTriangle className="h-5 w-5 text-warning-600" />
                        </div>
                      </div>
                    </StatCard>
                  </StatsRow>

                  {/* Alerts */}
                  {complianceData.biologicalIndicators.weeksMissing > 0 && (
                    <div className="rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 p-4">
                      <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400">
                        <AlertTriangle className="h-5 w-5" />
                        <p>
                          <strong>Compliance Alert:</strong> Missing{' '}
                          {complianceData.biologicalIndicators.weeksMissing} weekly biological
                          indicator test(s) in this period.
                        </p>
                      </div>
                    </div>
                  )}

                  <DashboardGrid>
                    <DashboardGrid.TwoThirds>
                      {/* Failed Cycles List */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Failed Cycles</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {complianceData.failedCycles.cycles.length === 0 ? (
                            <div className="text-center py-8">
                              <CheckCircle className="h-12 w-12 mx-auto text-success-500 mb-2" />
                              <p className="text-muted-foreground">
                                No failed cycles in this period
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {complianceData.failedCycles.cycles.map((cycle) => (
                                <div
                                  key={cycle.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{cycle.cycleNumber}</p>
                                    <p className="text-xs text-error-600 dark:text-error-400">
                                      {cycle.failureReason || 'No reason specified'}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(cycle.startTime), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DashboardGrid.TwoThirds>

                    <DashboardGrid.OneThird>
                      {/* BI Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Biological Indicators</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Passed</span>
                            <Badge variant="success">
                              {complianceData.biologicalIndicators.passed}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Failed</span>
                            <Badge variant="error">
                              {complianceData.biologicalIndicators.failed}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Pending</span>
                            <Badge variant="warning">
                              {complianceData.biologicalIndicators.pending}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Compliance Logs */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Compliance Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Total Logs</span>
                            <Badge variant="secondary">
                              {complianceData.complianceLogs.total}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Compliant</span>
                            <Badge variant="success">
                              {complianceData.complianceLogs.compliant}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Deficiencies</span>
                            <Badge variant={complianceData.complianceLogs.deficiencies > 0 ? 'error' : 'success'}>
                              {complianceData.complianceLogs.deficiencies}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DashboardGrid.OneThird>
                  </DashboardGrid>
                </div>
              ) : null}
            </TabsContent>

            {/* Packages Report */}
            <TabsContent value="packages" className="mt-6">
              {loading ? (
                <ReportSkeleton />
              ) : packageData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <StatsRow>
                    <StatCard accentColor="primary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Packages</p>
                          <p className="text-xl font-bold">{packageData.total}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="success">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Sterile</p>
                          <p className="text-xl font-bold">{packageData.byStatus.STERILE || 0}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="secondary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="text-xl font-bold">{packageData.byStatus.USED || 0}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
                          <Activity className="h-5 w-5 text-secondary-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={(packageData.byStatus.EXPIRED || 0) > 0 ? 'error' : 'secondary'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Expired</p>
                          <p className="text-xl font-bold">{packageData.byStatus.EXPIRED || 0}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                          <Clock className="h-5 w-5 text-error-600" />
                        </div>
                      </div>
                    </StatCard>
                  </StatsRow>

                  <DashboardGrid>
                    <DashboardGrid.TwoThirds>
                      {/* Expiring Soon */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm" className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning-500" />
                            Expiring Soon
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {packageData.expiringSoon.length === 0 ? (
                            <div className="text-center py-8">
                              <CheckCircle className="h-12 w-12 mx-auto text-success-500 mb-2" />
                              <p className="text-muted-foreground">
                                No packages expiring within 7 days
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {packageData.expiringSoon.map((pkg) => (
                                <div
                                  key={pkg.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{pkg.packageNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {pkg.instrumentNames.slice(0, 3).join(', ')}
                                      {pkg.instrumentNames.length > 3 && ` +${pkg.instrumentNames.length - 3} more`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="warning">
                                      {pkg.daysUntilExpiration} day{pkg.daysUntilExpiration !== 1 ? 's' : ''}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(pkg.expirationDate), 'MMM d')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DashboardGrid.TwoThirds>

                    <DashboardGrid.OneThird>
                      {/* By Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">By Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {Object.entries(packageData.byStatus).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{status.toLowerCase()}</span>
                              <Badge
                                variant={
                                  status === 'STERILE'
                                    ? 'success'
                                    : status === 'EXPIRED' || status === 'RECALLED'
                                    ? 'error'
                                    : status === 'COMPROMISED'
                                    ? 'warning'
                                    : 'secondary'
                                }
                              >
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* By Type */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">By Type</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {Object.entries(packageData.byType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm">
                                {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <Badge variant="soft-primary">{count}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </DashboardGrid.OneThird>
                  </DashboardGrid>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </>
  );
}
