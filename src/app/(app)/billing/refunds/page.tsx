'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  Filter,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface Refund {
  id: string;
  refundNumber: string;
  amount: number;
  refundType: string;
  reason?: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  payment: {
    id: string;
    paymentNumber: string;
    amount: number;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  requestedByUser?: {
    firstName: string;
    lastName: string;
  };
  approvedByUser?: {
    firstName: string;
    lastName: string;
  };
}

interface RefundStats {
  pendingApproval: number;
  todayCount: number;
  todayAmount: number;
}

const refundStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  APPROVED: 'info',
  PROCESSING: 'info',
  COMPLETED: 'success',
  REJECTED: 'destructive',
  FAILED: 'destructive',
};

const refundStatusLabels: Record<string, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  FAILED: 'Failed',
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'requestedAt',
        sortOrder: 'desc',
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/refunds?${params}`);
      const data = await response.json();

      if (data.success) {
        setRefunds(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Refunds"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Refunds' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{stats?.pendingApproval || 0}</p>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Refunds</p>
                  <p className="text-2xl font-bold">{stats?.todayCount || 0}</p>
                  <p className="text-xs text-success-600">
                    {formatCurrency(stats?.todayAmount || 0)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Refunds</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DataTableLayout>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search refunds..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
            ) : refunds.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No refunds found</h3>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Refunds will appear here when processed'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Original Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{refund.refundNumber}</p>
                          <Badge variant="outline" className="text-xs">
                            {refund.refundType === 'FULL' ? 'Full' : 'Partial'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {refund.payment.patient ? (
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="text-sm">
                              {refund.payment.patient.firstName} {refund.payment.patient.lastName}
                            </p>
                          </PhiProtected>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{refund.payment.paymentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(refund.payment.amount)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(refund.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {refund.reason || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={refundStatusVariant[refund.status] || 'default'}>
                          {refundStatusLabels[refund.status] || refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(refund.requestedAt)}</p>
                        {refund.requestedByUser && (
                          <p className="text-xs text-muted-foreground">
                            by {refund.requestedByUser.firstName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/billing/refunds/${refund.id}`}>
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
