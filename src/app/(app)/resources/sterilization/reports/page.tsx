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
  Download,
  FileText,
  ShieldCheck,
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

interface ValidationReport {
  summary: {
    totalValidations: number;
    passed: number;
    failed: number;
    conditional: number;
    overdueSchedules: number;
  };
  validations: Array<{
    date: string;
    type: string;
    equipment: string;
    result: string;
    performedBy: string;
  }>;
  overdueSchedules: Array<{
    type: string;
    equipment: string;
    dueDate: string;
    daysOverdue: number;
  }>;
}

type ReportType = 'summary' | 'compliance' | 'packages' | 'validations';

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
  const [validationData, setValidationData] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
        case 'validations':
          setValidationData(result.data);
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

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate,
      });

      const response = await fetch(`/api/resources/sterilization/reports/pdf?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate report');
      }

      // Create printable HTML and open in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${result.data.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
              h2 { color: #374151; margin-top: 30px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .meta { color: #6b7280; font-size: 14px; }
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
              .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
              .stat-label { color: #6b7280; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background: #f9fafb; font-weight: 600; }
              .pass { color: #059669; }
              .fail { color: #dc2626; }
              .warning { color: #d97706; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>${result.data.title}</h1>
                <p class="meta">${result.data.clinic}</p>
              </div>
              <div class="meta" style="text-align: right;">
                <p>Period: ${format(new Date(result.data.period.startDate), 'MMM d, yyyy')} - ${format(new Date(result.data.period.endDate), 'MMM d, yyyy')}</p>
                <p>Generated: ${format(new Date(result.data.generatedAt), 'MMM d, yyyy h:mm a')}</p>
                <p>By: ${result.data.generatedBy}</p>
              </div>
            </div>

            ${reportType === 'compliance' ? `
              <h2>Summary</h2>
              <div class="summary-grid">
                <div class="stat-box">
                  <div class="stat-value">${result.data.summary?.totalCycles || 0}</div>
                  <div class="stat-label">Total Cycles</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${result.data.summary?.successRate || 0}%</div>
                  <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${result.data.summary?.overallScore || 0}%</div>
                  <div class="stat-label">Compliance Score</div>
                </div>
              </div>

              <h2>Biological Indicators</h2>
              <div class="summary-grid">
                <div class="stat-box">
                  <div class="stat-value">${result.data.biologicalIndicators?.total || 0}</div>
                  <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value class="pass"">${result.data.biologicalIndicators?.passed || 0}</div>
                  <div class="stat-label">Passed</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value ${(result.data.biologicalIndicators?.failed || 0) > 0 ? 'fail' : ''}">${result.data.biologicalIndicators?.failed || 0}</div>
                  <div class="stat-label">Failed</div>
                </div>
              </div>

              ${result.data.biologicalIndicators?.tests?.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Date</th><th>Lot Number</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    ${result.data.biologicalIndicators.tests.map((t: { date: string; lotNumber: string; result: string }) => `
                      <tr>
                        <td>${t.date}</td>
                        <td>${t.lotNumber}</td>
                        <td class="${t.result === 'PASSED' ? 'pass' : t.result === 'FAILED' ? 'fail' : ''}">${t.result}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${result.data.failedCycles?.length > 0 ? `
                <h2>Failed Cycles</h2>
                <table>
                  <thead>
                    <tr><th>Cycle Number</th><th>Date</th><th>Reason</th></tr>
                  </thead>
                  <tbody>
                    ${result.data.failedCycles.map((c: { cycleNumber: string; date: string; reason: string }) => `
                      <tr>
                        <td>${c.cycleNumber}</td>
                        <td>${c.date}</td>
                        <td>${c.reason}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p>No failed cycles in this period.</p>'}
            ` : ''}

            ${reportType === 'validations' ? `
              <h2>Summary</h2>
              <div class="summary-grid">
                <div class="stat-box">
                  <div class="stat-value">${result.data.summary?.totalValidations || 0}</div>
                  <div class="stat-label">Total Validations</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value class="pass"">${result.data.summary?.passed || 0}</div>
                  <div class="stat-label">Passed</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value ${(result.data.summary?.overdueSchedules || 0) > 0 ? 'warning' : ''}">${result.data.summary?.overdueSchedules || 0}</div>
                  <div class="stat-label">Overdue</div>
                </div>
              </div>

              ${result.data.validations?.length > 0 ? `
                <h2>Validation Records</h2>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Equipment</th><th>Result</th><th>Performed By</th></tr>
                  </thead>
                  <tbody>
                    ${result.data.validations.map((v: { date: string; type: string; equipment: string; result: string; performedBy: string }) => `
                      <tr>
                        <td>${v.date}</td>
                        <td>${v.type}</td>
                        <td>${v.equipment}</td>
                        <td class="${v.result === 'PASS' ? 'pass' : v.result === 'FAIL' ? 'fail' : 'warning'}">${v.result}</td>
                        <td>${v.performedBy}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}
            ` : ''}

            <div class="no-print" style="margin-top: 40px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                Print / Save as PDF
              </button>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setExporting(false);
    }
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={loading || exporting}>
              {exporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
              <TabsTrigger value="validations">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Validations
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

            {/* Validations Report */}
            <TabsContent value="validations" className="mt-6">
              {loading ? (
                <ReportSkeleton />
              ) : validationData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <StatsRow>
                    <StatCard accentColor="primary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Validations</p>
                          <p className="text-xl font-bold">{validationData.summary.totalValidations}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                          <ShieldCheck className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor="success">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Passed</p>
                          <p className="text-xl font-bold">{validationData.summary.passed}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={validationData.summary.failed > 0 ? 'error' : 'secondary'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Failed</p>
                          <p className="text-xl font-bold">{validationData.summary.failed}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                          <XCircle className="h-5 w-5 text-error-600" />
                        </div>
                      </div>
                    </StatCard>
                    <StatCard accentColor={validationData.summary.overdueSchedules > 0 ? 'warning' : 'success'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Overdue Schedules</p>
                          <p className="text-xl font-bold">{validationData.summary.overdueSchedules}</p>
                        </div>
                        <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                          <AlertTriangle className="h-5 w-5 text-warning-600" />
                        </div>
                      </div>
                    </StatCard>
                  </StatsRow>

                  {/* Overdue Alert */}
                  {validationData.overdueSchedules.length > 0 && (
                    <div className="rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 p-4">
                      <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400">
                        <AlertTriangle className="h-5 w-5" />
                        <p>
                          <strong>Attention:</strong> {validationData.overdueSchedules.length} validation(s) are overdue.
                        </p>
                      </div>
                    </div>
                  )}

                  <DashboardGrid>
                    <DashboardGrid.TwoThirds>
                      {/* Recent Validations */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Recent Validations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {validationData.validations.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No validations in this period
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {validationData.validations.slice(0, 10).map((v, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{v.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {v.equipment} • {v.performedBy}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        v.result === 'PASS'
                                          ? 'success'
                                          : v.result === 'FAIL'
                                          ? 'error'
                                          : 'warning'
                                      }
                                    >
                                      {v.result}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{v.date}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DashboardGrid.TwoThirds>

                    <DashboardGrid.OneThird>
                      {/* Overdue Schedules */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Overdue Schedules
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {validationData.overdueSchedules.length === 0 ? (
                            <div className="text-center py-4">
                              <CheckCircle className="h-8 w-8 mx-auto text-success-500 mb-2" />
                              <p className="text-sm text-muted-foreground">All up to date!</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {validationData.overdueSchedules.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                                >
                                  <p className="font-medium text-sm">{s.type}</p>
                                  <p className="text-xs text-muted-foreground">{s.equipment}</p>
                                  <Badge variant="warning" className="mt-1">
                                    {s.daysOverdue} days overdue
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle size="sm">Results Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Passed</span>
                            <Badge variant="success">{validationData.summary.passed}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Failed</span>
                            <Badge variant="error">{validationData.summary.failed}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Conditional</span>
                            <Badge variant="warning">{validationData.summary.conditional}</Badge>
                          </div>
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
