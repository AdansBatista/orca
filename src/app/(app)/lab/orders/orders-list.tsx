'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Package,
  ChevronRight,
  Calendar,
  Truck,
  AlertCircle,
} from 'lucide-react';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface LabOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  isRush: boolean;
  orderDate: string;
  neededByDate: string | null;
  totalCost: number;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vendor: {
    id: string;
    name: string;
    code: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    status: string;
  }>;
  _count: {
    items: number;
    attachments: number;
    shipments: number;
  };
}

interface PaginatedResponse {
  items: LabOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PATIENT_PICKUP', label: 'Patient Pickup' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions = [
  { value: '', label: 'All Priority' },
  { value: 'LOW', label: 'Low' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'secondary' | 'soft-primary'> = {
  DRAFT: 'soft-primary',
  SUBMITTED: 'info',
  ACKNOWLEDGED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  SHIPPED: 'info',
  DELIVERED: 'success',
  RECEIVED: 'success',
  PATIENT_PICKUP: 'success',
  PICKED_UP: 'secondary',
  CANCELLED: 'destructive',
  REMAKE_REQUESTED: 'destructive',
  ON_HOLD: 'warning',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  RECEIVED: 'Received',
  PATIENT_PICKUP: 'Ready for Pickup',
  PICKED_UP: 'Picked Up',
  CANCELLED: 'Cancelled',
  REMAKE_REQUESTED: 'Remake Requested',
  ON_HOLD: 'On Hold',
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(neededByDate: string | null, status: string): boolean {
  if (!neededByDate) return false;
  const completedStatuses = ['DELIVERED', 'RECEIVED', 'PATIENT_PICKUP', 'PICKED_UP', 'CANCELLED'];
  if (completedStatuses.includes(status)) return false;
  return new Date(neededByDate) < new Date();
}

function isDueSoon(neededByDate: string | null, status: string): boolean {
  if (!neededByDate) return false;
  const completedStatuses = ['DELIVERED', 'RECEIVED', 'PATIENT_PICKUP', 'PICKED_UP', 'CANCELLED'];
  if (completedStatuses.includes(status)) return false;
  const dueDate = new Date(neededByDate);
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  return dueDate <= threeDaysFromNow && dueDate >= new Date();
}

export function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [isRush, setIsRush] = useState(searchParams.get('isRush') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch orders data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (isRush) params.set('isRush', isRush);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/lab/orders?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch orders');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, priority, isRush, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (isRush) params.set('isRush', isRush);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/lab/orders?${query}` : '/lab/orders', { scroll: false });
  }, [search, status, priority, isRush, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setIsRush('');
    setPage(1);
  };

  const hasFilters = search || status || priority || isRush;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Link href="/lab/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, patient..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priority} onValueChange={(v) => { setPriority(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rush Filter */}
            <Select value={isRush} onValueChange={(v) => { setIsRush(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Rush" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="true">Rush Only</SelectItem>
                <SelectItem value="false">Non-Rush</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-20" />
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
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Get started by creating your first lab order'}
            </p>
            <Link href="/lab/orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} order{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Needed By</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((order) => {
                  const overdue = isOverdue(order.neededByDate, order.status);
                  const dueSoon = isDueSoon(order.neededByDate, order.status);

                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/lab/orders/${order.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-primary-600">
                            {order.orderNumber}
                          </span>
                          {order.isRush && (
                            <Badge variant="destructive" size="sm">Rush</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.orderDate)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[10px] bg-gradient-primary text-white">
                              {getInitials(order.patient.firstName, order.patient.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <PhiProtected fakeData={getFakeName()}>
                            <span className="text-sm font-medium">
                              {order.patient.firstName} {order.patient.lastName}
                            </span>
                          </PhiProtected>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.length > 0 ? (
                            <>
                              <p className="font-medium truncate max-w-[150px]">
                                {order.items[0].productName}
                              </p>
                              {order._count.items > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order._count.items - 1} more item{order._count.items > 2 ? 's' : ''}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">No items</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.vendor ? (
                          <Badge variant="outline" size="sm">
                            {order.vendor.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[order.status] || 'secondary'} dot>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.neededByDate ? (
                          <div className="flex items-center gap-1.5">
                            {overdue ? (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            ) : dueSoon ? (
                              <AlertCircle className="h-3.5 w-3.5 text-warning-600" />
                            ) : (
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={`text-sm ${overdue ? 'text-destructive font-medium' : dueSoon ? 'text-warning-600 font-medium' : ''}`}>
                              {formatDate(order.neededByDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          ${order.totalCost.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order._count.shipments > 0 && (
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
