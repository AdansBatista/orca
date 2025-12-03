'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, ArrowRightLeft, AlertCircle, RefreshCw, Clock, CheckCircle, XCircle, Truck, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { InventoryTransfer, Clinic } from '@prisma/client';

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

type TransferWithRelations = InventoryTransfer & {
  fromClinic: Pick<Clinic, 'id' | 'name'>;
  toClinic: Pick<Clinic, 'id' | 'name'>;
  items?: Array<{
    id: string;
    requestedQuantity: number;
    item: { name: string; sku: string };
  }>;
};

interface PaginatedResponse {
  items: TransferWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Note: Select.Item cannot have empty string values. Use '__all__' for "all" options
// and convert to empty string when building API queries.
const statusOptions = [
  { value: '__all__', label: 'All Status' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const directionOptions = [
  { value: '__all__', label: 'All Transfers' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: typeof Clock }> = {
  REQUESTED: { label: 'Requested', variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error', icon: XCircle },
  PREPARING: { label: 'Preparing', variant: 'info', icon: Clock },
  IN_TRANSIT: { label: 'In Transit', variant: 'info', icon: Truck },
  RECEIVED: { label: 'Received', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function TransferList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  // Use '__all__' as default for Select components (they can't have empty string values)
  const [status, setStatus] = useState(searchParams.get('status') || '__all__');
  const [direction, setDirection] = useState(searchParams.get('direction') || '__all__');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    // Convert '__all__' back to empty (don't send filter) for API calls
    if (status && status !== '__all__') params.set('status', status);
    if (direction && direction !== '__all__') params.set('direction', direction);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/resources/transfers?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch transfers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [status, direction, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    // Don't include '__all__' in URL - it's the default
    if (status && status !== '__all__') params.set('status', status);
    if (direction && direction !== '__all__') params.set('direction', direction);
    if (page > 1) params.set('page', String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [status, direction, page, router]);

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
    (acc, transfer) => {
      if (transfer.status === 'REQUESTED') acc.pending++;
      else if (transfer.status === 'IN_TRANSIT') acc.inTransit++;
      else if (transfer.status === 'RECEIVED') acc.completed++;
      if (transfer.isUrgent) acc.urgent++;
      return acc;
    },
    { pending: 0, inTransit: 0, completed: 0, urgent: 0 }
  ) || { pending: 0, inTransit: 0, completed: 0, urgent: 0 };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Transfers</p>
              <p className="text-xl font-bold">{loading ? '-' : (data?.total || 0)}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
              <ArrowRightLeft className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.pending}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
              <Clock className="h-4 w-4 text-warning-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">In Transit</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.inTransit}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
              <Truck className="h-4 w-4 text-secondary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="error">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Urgent</p>
              <p className="text-xl font-bold">{loading ? '-' : stats.urgent}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
              <AlertTriangle className="h-4 w-4 text-error-600" />
            </div>
          </div>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={direction} onValueChange={(val) => { setDirection(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                {directionOptions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
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
            <div className="flex-1" />
            <Button onClick={() => router.push('/resources/transfers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfers List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-12 text-center">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No transfers found</h3>
            <p className="text-muted-foreground mb-4">
              {status || direction !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first transfer request'}
            </p>
            <Button onClick={() => router.push('/resources/transfers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data?.items.map((transfer) => {
              const statusInfo = statusConfig[transfer.status] || statusConfig.REQUESTED;
              const StatusIcon = statusInfo.icon;
              const itemCount = transfer.items?.length || 0;
              const totalQty = transfer.items?.reduce((sum, i) => sum + i.requestedQuantity, 0) || 0;

              return (
                <Link key={transfer.id} href={`/resources/transfers/${transfer.id}`}>
                  <Card className={cn(
                    "hover:border-primary-300 transition-colors cursor-pointer",
                    transfer.isUrgent && "border-error-300"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold">{transfer.transferNumber}</span>
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            {transfer.isUrgent && (
                              <Badge variant="error" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Urgent
                              </Badge>
                            )}
                          </div>

                          {/* Direction display */}
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <span className="text-muted-foreground">{transfer.fromClinic.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{transfer.toClinic.name}</span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Requested: {new Date(transfer.requestedDate).toLocaleDateString()}</span>
                            <span>{itemCount} items ({totalQty} units)</span>
                          </div>
                        </div>

                        <div className="text-right">
                          {transfer.trackingNumber && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {transfer.trackingNumber}
                            </p>
                          )}
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
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} transfers
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
