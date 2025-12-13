'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  ChevronRight,
  Calendar,
  Repeat,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { formatCurrency } from '@/lib/utils';

interface PaymentPlan {
  id: string;
  planNumber: string;
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  numberOfPayments: number;
  monthlyPayment: number;
  completedPayments: number;
  remainingBalance: number;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  status: string;
  autoPayEnabled: boolean;
  account: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  paymentMethod?: {
    id: string;
    type: string;
    cardBrand?: string;
    cardLast4?: string;
    nickname?: string;
  } | null;
  _count?: {
    scheduledPayments: number;
  };
}

interface PaginatedResponse {
  items: PaymentPlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: {
    totalPlans: number;
    totalAmount: number;
    totalRemaining: number;
    statusCounts: Record<string, { count: number; remaining: number }>;
  };
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DEFAULTED', label: 'Defaulted' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'secondary',
  DEFAULTED: 'destructive',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DEFAULTED: 'Defaulted',
};

export function PaymentPlanList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch payment plans data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/billing/payment-plans?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch payment plans');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/billing/payment-plans?${query}` : '/billing/payment-plans', { scroll: false });
  }, [search, status, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  const getProgressPercent = (plan: PaymentPlan) => {
    if (plan.numberOfPayments === 0) return 0;
    return Math.round((plan.completedPayments / plan.numberOfPayments) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Plans</h1>
          <p className="text-muted-foreground">
            Manage patient payment arrangements
          </p>
        </div>
        <Link href="/billing/payment-plans/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Total Plans</p>
            <p className="text-lg font-semibold">{data.stats.totalPlans}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-lg font-semibold text-success-600">
              {data.stats.statusCounts?.ACTIVE?.count || 0}
            </p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(data.stats.totalAmount)}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold">{formatCurrency(data.stats.totalRemaining)}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plan #, patient name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || status) && (
              <Button variant="ghost" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payment plans found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status
                ? 'Try adjusting your filters'
                : 'Get started by creating your first payment plan'}
            </p>
            <Link href="/billing/payment-plans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} plan{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/billing/payment-plans/${plan.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{plan.planNumber}</span>
                      {plan.autoPayEnabled && (
                        <Badge variant="soft-primary" className="ml-2 text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {plan.account.patient.firstName} {plan.account.patient.lastName}
                        </span>
                      </PhiProtected>
                      <p className="text-xs text-muted-foreground">{plan.account.accountNumber}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={getProgressPercent(plan)} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {plan.completedPayments}/{plan.numberOfPayments}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(plan.monthlyPayment)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={plan.remainingBalance > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(plan.remainingBalance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {plan.nextPaymentDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(plan.nextPaymentDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : plan.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-1 text-success-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-sm">Complete</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[plan.status] || 'default'}>
                        {statusLabels[plan.status] || plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
