'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Package,
  Clock,
  Zap,
  DollarSign,
  Building2,
  ChevronRight,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LabProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string;
  standardTurnaround: number;
  rushTurnaround: number | null;
  isActive: boolean;
  vendor: {
    id: string;
    name: string;
    code: string;
  } | null;
  feeSchedules: Array<{
    id: string;
    basePrice: number;
    rushUpchargePercent: number | null;
  }>;
  _count: {
    orderItems: number;
  };
}

interface PaginatedResponse {
  items: LabProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'RETAINER', label: 'Retainers' },
  { value: 'APPLIANCE', label: 'Appliances' },
  { value: 'ALIGNER', label: 'Aligners' },
  { value: 'INDIRECT_BONDING', label: 'Indirect Bonding' },
  { value: 'ARCHWIRE', label: 'Archwires' },
  { value: 'MODEL', label: 'Models' },
  { value: 'SURGICAL', label: 'Surgical' },
  { value: 'OTHER', label: 'Other' },
];

const categoryLabels: Record<string, string> = {
  RETAINER: 'Retainer',
  APPLIANCE: 'Appliance',
  ALIGNER: 'Aligner',
  INDIRECT_BONDING: 'Indirect Bonding',
  ARCHWIRE: 'Archwire',
  MODEL: 'Model',
  SURGICAL: 'Surgical',
  OTHER: 'Other',
};

const categoryBadgeVariants: Record<string, 'default' | 'soft-primary' | 'soft-accent' | 'info' | 'warning'> = {
  RETAINER: 'default',
  APPLIANCE: 'soft-primary',
  ALIGNER: 'soft-accent',
  INDIRECT_BONDING: 'info',
  ARCHWIRE: 'warning',
  MODEL: 'secondary' as 'default',
  SURGICAL: 'destructive' as 'default',
  OTHER: 'outline' as 'default',
};

export function ProductsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch products data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (isActive) params.set('isActive', isActive);
      params.set('page', String(page));
      params.set('pageSize', '24');

      try {
        const response = await fetch(`/api/lab/products?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch products');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, category, isActive, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (isActive) params.set('isActive', isActive);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/lab/products?${query}` : '/lab/products', { scroll: false });
  }, [search, category, isActive, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setIsActive('');
    setPage(1);
  };

  const hasFilters = search || category || isActive;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Link href="/lab/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
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
                placeholder="Search products..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active Filter */}
            <Select value={isActive} onValueChange={(v) => { setIsActive(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Get started by adding your first lab product'}
            </p>
            <Link href="/lab/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {data?.total} product{data?.total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((product) => (
              <Card
                key={product.id}
                variant="bento"
                interactive
                className={`cursor-pointer ${!product.isActive ? 'opacity-60' : ''}`}
                onClick={() => router.push(`/lab/products/${product.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      {product.sku && (
                        <p className="text-xs font-mono text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={categoryBadgeVariants[product.category] || 'default'}>
                      {categoryLabels[product.category] || product.category}
                    </Badge>
                    {!product.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{product.standardTurnaround} days</span>
                    </div>
                    {product.rushTurnaround && (
                      <div className="flex items-center gap-1.5 text-warning-600">
                        <Zap className="h-3.5 w-3.5" />
                        <span>{product.rushTurnaround} days rush</span>
                      </div>
                    )}
                    {product.feeSchedules[0] && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${product.feeSchedules[0].basePrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span>{product._count.orderItems} orders</span>
                    </div>
                  </div>

                  {product.vendor && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[8px] bg-gradient-accent text-white">
                          {product.vendor.code}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{product.vendor.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 24 + 1} to {Math.min(page * 24, data.total)} of {data.total}
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
