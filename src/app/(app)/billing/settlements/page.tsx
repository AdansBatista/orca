'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DataTableLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface Settlement {
  id: string;
  settlementNumber: string;
  settlementDate: string;
  grossAmount: number;
  fees: number;
  netAmount: number;
  transactionCount: number;
  status: string;
  externalId?: string;
  depositedAt?: string;
  reconciledAt?: string;
}

interface SettlementStats {
  today: {
    count: number;
    gross: number;
    fees: number;
    net: number;
  };
  week: {
    count: number;
    gross: number;
    fees: number;
    net: number;
  };
  pending: number;
}

const settlementStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  DEPOSITED: 'info',
  RECONCILED: 'success',
  DISCREPANCY: 'destructive',
};

const settlementStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  DEPOSITED: 'Deposited',
  RECONCILED: 'Reconciled',
  DISCREPANCY: 'Discrepancy',
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await fetch(`/api/settlements?${params}`);
      const data = await response.json();

      if (data.success) {
        setSettlements(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Settlements"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Settlements' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Deposits</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.today.net || 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.today.count || 0} settlements
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.week.net || 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    Fees: {formatCurrency(stats?.week.fees || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Awaiting deposit</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DataTableLayout>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DEPOSITED">Deposited</SelectItem>
                  <SelectItem value="RECONCILED">Reconciled</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-[150px]"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-[150px]"
                  placeholder="To"
                />
              </div>
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
            ) : settlements.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No settlements found</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== 'all' || dateFrom || dateTo
                    ? 'Try adjusting your filters'
                    : 'Settlements will appear here as payments are processed'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{settlement.settlementNumber}</p>
                          {settlement.externalId && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {settlement.externalId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(settlement.settlementDate)}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{settlement.transactionCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatCurrency(settlement.grossAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-destructive">
                          -{formatCurrency(settlement.fees)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(settlement.netAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={settlementStatusVariant[settlement.status] || 'default'}>
                          {settlement.status === 'DISCREPANCY' && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {settlementStatusLabels[settlement.status] || settlement.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/billing/settlements/${settlement.id}`}>
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
