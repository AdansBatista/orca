'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calculator,
  Receipt,
  ChevronRight,
  Wallet,
  CalendarDays,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { formatCurrency } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface BillingStats {
  accounts: {
    total: number;
    withBalance: number;
    totalBalance: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    totalPending: number;
    totalOverdue: number;
  };
  paymentPlans: {
    total: number;
    active: number;
    totalRemaining: number;
    nextDue: number;
  };
  estimates: {
    total: number;
    pending: number;
    totalValue: number;
  };
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    patientName: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
  agingBuckets: {
    current: number;
    aging30: number;
    aging60: number;
    aging90: number;
    aging120Plus: number;
  };
}

const invoiceStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  PENDING: 'info',
  SENT: 'info',
  PARTIAL: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
  VOID: 'secondary',
  WRITTEN_OFF: 'secondary',
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  SENT: 'Sent',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
  WRITTEN_OFF: 'Written Off',
};

export default function BillingDashboardPage() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch from multiple endpoints in parallel
        const [accountsRes, invoicesRes, plansRes, estimatesRes] = await Promise.all([
          fetch('/api/billing/accounts?pageSize=1'),
          fetch('/api/billing/invoices?pageSize=5'),
          fetch('/api/billing/payment-plans?pageSize=1'),
          fetch('/api/billing/estimates?pageSize=1'),
        ]);

        const [accounts, invoices, plans, estimates] = await Promise.all([
          accountsRes.json(),
          invoicesRes.json(),
          plansRes.json(),
          estimatesRes.json(),
        ]);

        // Aggregate stats from responses
        const billingStats: BillingStats = {
          accounts: {
            total: accounts.data?.total || 0,
            withBalance: accounts.data?.stats?.accountsWithBalance || 0,
            totalBalance: accounts.data?.stats?.totalBalance || 0,
          },
          invoices: {
            total: invoices.data?.total || 0,
            pending: invoices.data?.stats?.statusCounts?.PENDING?.count || 0,
            overdue: invoices.data?.stats?.statusCounts?.OVERDUE?.count || 0,
            totalPending: invoices.data?.stats?.statusCounts?.PENDING?.balance || 0,
            totalOverdue: invoices.data?.stats?.statusCounts?.OVERDUE?.balance || 0,
          },
          paymentPlans: {
            total: plans.data?.stats?.totalPlans || 0,
            active: plans.data?.stats?.statusCounts?.ACTIVE?.count || 0,
            totalRemaining: plans.data?.stats?.totalRemaining || 0,
            nextDue: plans.data?.stats?.statusCounts?.ACTIVE?.remaining || 0,
          },
          estimates: {
            total: estimates.data?.total || 0,
            pending: estimates.data?.stats?.statusCounts?.PENDING?.count || 0,
            totalValue: estimates.data?.stats?.totalValue || 0,
          },
          recentInvoices: (invoices.data?.items || []).slice(0, 5).map((inv: {
            id: string;
            invoiceNumber: string;
            patient?: { firstName?: string; lastName?: string };
            patientAmount: number;
            status: string;
            dueDate: string;
          }) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            patientName: inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Unknown',
            amount: inv.patientAmount,
            status: inv.status,
            dueDate: inv.dueDate,
          })),
          agingBuckets: {
            current: accounts.data?.stats?.totalBalance || 0,
            aging30: 0,
            aging60: 0,
            aging90: 0,
            aging120Plus: 0,
          },
        };

        setStats(billingStats);
      } catch (error) {
        console.error('Failed to fetch billing stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Billing"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing' },
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
        title="Billing"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/billing/invoices/new">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                New Invoice
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
                  <p className="text-xs text-muted-foreground">Total Receivables</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.accounts.totalBalance || 0)}</p>
                  <p className="text-xs text-muted-foreground">{stats?.accounts.withBalance || 0} accounts</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold">{stats?.invoices.pending || 0}</p>
                  <p className="text-xs text-warning-600">
                    {formatCurrency(stats?.invoices.totalPending || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{stats?.invoices.overdue || 0}</p>
                  <p className="text-xs text-destructive">
                    {formatCurrency(stats?.invoices.totalOverdue || 0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Plans</p>
                  <p className="text-2xl font-bold">{stats?.paymentPlans.active || 0}</p>
                  <p className="text-xs text-success-600">
                    {formatCurrency(stats?.paymentPlans.totalRemaining || 0)} remaining
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              {/* Recent Invoices */}
              <Card>
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Recent Invoices
                      </CardTitle>
                      <CardDescription>Latest billing activity</CardDescription>
                    </div>
                    <Link href="/billing/invoices">
                      <Button variant="ghost" size="sm">
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent compact>
                  {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentInvoices.map((invoice) => (
                        <Link
                          key={invoice.id}
                          href={`/billing/invoices/${invoice.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
                              <Receipt className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                              <PhiProtected fakeData={getFakeName()}>
                                <p className="text-xs text-muted-foreground">{invoice.patientName}</p>
                              </PhiProtected>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                            <Badge variant={invoiceStatusVariant[invoice.status] || 'default'} className="text-xs">
                              {invoiceStatusLabels[invoice.status] || invoice.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent invoices</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* A/R Aging Summary */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Accounts Receivable Aging
                  </CardTitle>
                  <CardDescription>Outstanding balances by age</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-muted-foreground">Current</div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full transition-all"
                          style={{ width: '60%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatCurrency(stats?.agingBuckets.current || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-muted-foreground">31-60 days</div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning-500 rounded-full transition-all"
                          style={{ width: '25%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatCurrency(stats?.agingBuckets.aging30 || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-muted-foreground">61-90 days</div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning-600 rounded-full transition-all"
                          style={{ width: '10%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatCurrency(stats?.agingBuckets.aging60 || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-muted-foreground">90+ days</div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive rounded-full transition-all"
                          style={{ width: '5%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatCurrency(stats?.agingBuckets.aging90 || 0)}
                      </span>
                    </div>
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
                  <Link href="/billing/accounts" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Patient Accounts
                    </Button>
                  </Link>
                  <Link href="/billing/invoices" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Invoices
                    </Button>
                  </Link>
                  <Link href="/billing/payments" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payments
                    </Button>
                  </Link>
                  <Link href="/billing/payment-plans" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Payment Plans
                    </Button>
                  </Link>
                  <Link href="/billing/estimates" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Calculator className="h-4 w-4 mr-2" />
                      Treatment Estimates
                    </Button>
                  </Link>
                  <Link href="/billing/statements" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Wallet className="h-4 w-4 mr-2" />
                      Statements
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Payment Plans Summary */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Plans
                  </CardTitle>
                  <CardDescription>Active payment arrangements</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Plans</span>
                      <Badge variant="success">{stats?.paymentPlans.active || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Plans</span>
                      <span className="text-sm font-medium">{stats?.paymentPlans.total || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Remaining Balance</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(stats?.paymentPlans.totalRemaining || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/billing/payment-plans">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Estimates Summary */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Treatment Estimates
                  </CardTitle>
                  <CardDescription>Pending approvals</CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending Estimates</span>
                      <Badge variant="warning">{stats?.estimates.pending || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(stats?.estimates.totalValue || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/billing/estimates">
                      <Button variant="outline" size="sm" className="w-full">
                        View Estimates
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
