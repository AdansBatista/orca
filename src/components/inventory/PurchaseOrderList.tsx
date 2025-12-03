'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, ShoppingCart, AlertCircle, RefreshCw, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import type { PurchaseOrder, Supplier } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PurchaseOrderWithRelations = PurchaseOrder & {
  supplier: Pick<Supplier, 'id' | 'name' | 'code'>;
  _count?: {
    items: number;
  };
};

interface PaginatedResponse {
  items: PurchaseOrderWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Note: Select.Item cannot have empty string values. Use '__all__' for "all" options
// and convert to empty string when building API queries.
const statusOptions = [
  { value: '__all__', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', variant: 'default', icon: Clock },
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error', icon: XCircle },
  SUBMITTED: { label: 'Submitted', variant: 'info', icon: Truck },
  ACKNOWLEDGED: { label: 'Acknowledged', variant: 'info', icon: CheckCircle },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'warning', icon: Truck },
  RECEIVED: { label: 'Received', variant: 'success', icon: CheckCircle },
  CLOSED: { label: 'Closed', variant: 'default', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function PurchaseOrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  // Use '__all__' as default for Select components (they can't have empty string values)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '__all__');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    // Convert '__all__' back to empty (don't send filter) for API calls
    if (status && status !== '__all__') params.set('status', status);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/resources/purchase-orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch purchase orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    // Don't include '__all__' in URL - it's the default
    if (status && status !== '__all__') params.set('status', status);
    if (page > 1) params.set('page', String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, status, page, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  if (error) {
    return (
      <Card variant="ghost">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-error-500 mx-auto mb-2" />
          <p className="text-error-600">{error}</p>
          <Button variant="outline" onClick={fetchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats from data
  const stats = data?.items.reduce(
    (acc, po) => {
      if (po.status === 'DRAFT') acc.draft++;
      else if (['PENDING_APPROVAL', 'APPROVED', 'SUBMITTED', 'ACKNOWLEDGED'].includes(po.status)) acc.pending++;
      else if (po.status === 'RECEIVED' || po.status === 'CLOSED') acc.completed++;
      return acc;
    },
    { draft: 0, pending: 0, completed: 0 }
  ) || { draft: 0, pending: 0, completed: 0 };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">{loading ? '-' : (data?.total || 0)}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
              <ShoppingCart className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Draft</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.draft}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
              <Clock className="h-4 w-4 text-warning-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.pending}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
              <Truck className="h-4 w-4 text-secondary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.completed}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
            </div>
          </div>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO number, supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/resources/purchase-orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No purchase orders found</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || status
                ? 'Try adjusting your filters'
                : 'Get started by creating your first purchase order'}
            </p>
            <Button onClick={() => router.push('/resources/purchase-orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data?.items.map((po) => {
              const statusInfo = statusConfig[po.status] || statusConfig.DRAFT;
              const StatusIcon = statusInfo.icon;
              return (
                <Link key={po.id} href={`/resources/purchase-orders/${po.id}`}>
                  <Card className="hover:border-primary-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{po.poNumber}</span>
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {po.supplier.name} ({po.supplier.code})
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {po.orderDate && (
                              <span>Ordered: {new Date(po.orderDate).toLocaleDateString()}</span>
                            )}
                            {po.expectedDate && (
                              <span>Expected: {new Date(po.expectedDate).toLocaleDateString()}</span>
                            )}
                            {po._count && (
                              <span>{po._count.items} items</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${Number(po.totalAmount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {po.paymentTerms || 'No terms'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} orders
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
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
