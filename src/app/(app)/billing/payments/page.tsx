'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Plus,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DataTableLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentMethodType: string;
  status: string;
  cardBrand?: string;
  cardLast4?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  account: {
    id: string;
    accountNumber: string;
  };
  allocations: Array<{
    id: string;
    amount: number;
    invoice?: {
      invoiceNumber: string;
    };
  }>;
  processedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  todayPayments: number;
  todayAmount: number;
}

const paymentStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
  REFUNDED: 'secondary',
  PARTIALLY_REFUNDED: 'warning',
  DISPUTED: 'destructive',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partial Refund',
  DISPUTED: 'Disputed',
};

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  ACH: 'Bank Transfer',
  CASH: 'Cash',
  CHECK: 'Check',
  E_TRANSFER: 'E-Transfer',
  WIRE: 'Wire Transfer',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'paymentDate',
        sortOrder: 'desc',
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('paymentMethodType', methodFilter);

      const response = await fetch(`/api/payments?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (type: 'status' | 'method', value: string) => {
    if (type === 'status') setStatusFilter(value);
    if (type === 'method') setMethodFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setMethodFilter('all');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Payments' },
        ]}
        actions={
          <Link href="/billing/payments/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{stats?.totalPayments || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats?.totalAmount || 0)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Payments</p>
                  <p className="text-2xl font-bold">{stats?.todayPayments || 0}</p>
                  <p className="text-xs text-success-600">
                    {formatCurrency(stats?.todayAmount || 0)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {payments.filter((p) => p.status === 'PENDING').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Average Payment</p>
                  <p className="text-2xl font-bold">
                    {stats?.totalPayments
                      ? formatCurrency((stats.totalAmount || 0) / stats.totalPayments)
                      : '$0.00'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-accent-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DataTableLayout>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={(v) => handleFilterChange('method', v)}>
                <SelectTrigger className="w-[150px]">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="ACH">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || statusFilter !== 'all' || methodFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by processing a payment'}
                </p>
                <Link href="/billing/payments/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.paymentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.account.accountNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PhiProtected fakeData={getFakeName()}>
                          <p className="text-sm">
                            {payment.patient.firstName} {payment.patient.lastName}
                          </p>
                        </PhiProtected>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {paymentMethodLabels[payment.paymentMethodType] || payment.paymentMethodType}
                          </span>
                          {payment.cardLast4 && (
                            <span className="text-xs text-muted-foreground">
                              ••••{payment.cardLast4}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant[payment.status] || 'default'}>
                          {paymentStatusLabels[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(payment.paymentDate)}</p>
                        {payment.processedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {payment.processedBy.firstName} {payment.processedBy.lastName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/billing/payments/${payment.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </DataTableLayout>
        </div>
      </PageContent>
    </>
  );
}
