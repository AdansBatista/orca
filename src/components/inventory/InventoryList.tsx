'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, Package, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItemCard } from './InventoryItemCard';
import type { InventoryItem, Supplier } from '@prisma/client';

type InventoryItemWithRelations = InventoryItem & {
  supplier?: Pick<Supplier, 'id' | 'name' | 'code'> | null;
  _count?: {
    lots: number;
    stockMovements: number;
    reorderAlerts: number;
  };
};

interface PaginatedResponse {
  items: InventoryItemWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: {
    totalItems: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// Note: Select.Item cannot have empty string values. Use '__all__' for "all" options
// and convert to empty string when building API queries.
const categories = [
  { value: '__all__', label: 'All Categories' },
  { value: 'BRACKETS', label: 'Brackets' },
  { value: 'WIRES', label: 'Wires' },
  { value: 'ELASTICS', label: 'Elastics' },
  { value: 'BANDS', label: 'Bands' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'IMPRESSION', label: 'Impression' },
  { value: 'RETAINERS', label: 'Retainers' },
  { value: 'INSTRUMENTS', label: 'Instruments' },
  { value: 'DISPOSABLES', label: 'Disposables' },
  { value: 'PPE', label: 'PPE' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
];

const statuses = [
  { value: '__all__', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'BACKORDERED', label: 'Backordered' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function InventoryList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  // Use '__all__' as default for Select components (they can't have empty string values)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '__all__');
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
    if (category && category !== '__all__') params.set('category', category);
    if (status && status !== '__all__') params.set('status', status);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/resources/inventory?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch inventory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    // Don't include '__all__' in URL - it's the default
    if (category && category !== '__all__') params.set('category', category);
    if (status && status !== '__all__') params.set('status', status);
    if (page > 1) params.set('page', String(page));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, category, status, page, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handleFilterChange = (newCategory: string, newStatus: string) => {
    setCategory(newCategory);
    setStatus(newStatus);
    setPage(1); // Reset to first page on filter change
  };

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-xl font-bold">{loading ? '-' : (data?.stats?.totalItems || 0)}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
              <Package className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">In Stock</p>
              <p className="text-xl font-bold">{loading ? '-' : ((data?.stats?.totalItems || 0) - (data?.stats?.outOfStockCount || 0) - (data?.stats?.lowStockCount || 0))}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
              <Package className="h-4 w-4 text-success-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-xl font-bold">{loading ? '-' : (data?.stats?.lowStockCount || 0)}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="error">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-xl font-bold">{loading ? '-' : (data?.stats?.outOfStockCount || 0)}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
              <AlertCircle className="h-4 w-4 text-error-600" />
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
                placeholder="Search items, SKU, barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={(val) => handleFilterChange(val, status)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(val) => handleFilterChange(category, val)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/resources/inventory/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || category || status
                ? 'Try adjusting your filters'
                : 'Get started by adding your first inventory item'}
            </p>
            <Button onClick={() => router.push('/resources/inventory/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.items.map((item) => (
              <InventoryItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} items
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
