'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Package, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import type { Equipment, EquipmentType, Supplier } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { EquipmentCard } from './EquipmentCard';

type EquipmentWithRelations = Equipment & {
  type: Pick<EquipmentType, 'id' | 'name' | 'code'>;
  vendor?: Pick<Supplier, 'id' | 'name'> | null;
};

interface PaginatedResponse {
  items: EquipmentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'RETIRED', label: 'Retired' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'CHAIR', label: 'Chair' },
  { value: 'STERILIZATION', label: 'Sterilization' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function EquipmentList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inRepair: number;
    maintenanceDue: number;
  } | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch equipment data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (condition) params.set('condition', condition);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/resources/equipment?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch equipment');
        }

        setData(result.data);

        // Calculate stats from data (ideally this would be a separate API call)
        if (!stats) {
          // Fetch all equipment for stats (simplified - in production use a dedicated stats endpoint)
          const allResponse = await fetch('/api/resources/equipment?pageSize=1000');
          const allResult = await allResponse.json();
          if (allResult.success) {
            const allItems = allResult.data.items as EquipmentWithRelations[];
            const now = new Date();
            setStats({
              total: allResult.data.total,
              active: allItems.filter(e => e.status === 'ACTIVE').length,
              inRepair: allItems.filter(e => e.status === 'IN_REPAIR').length,
              maintenanceDue: allItems.filter(e =>
                e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) < now
              ).length,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, category, condition, page, stats]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/resources/equipment?${query}` : '/resources/equipment', { scroll: false });
  }, [search, status, category, condition, page, router]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipment Catalog</h1>
          <p className="text-muted-foreground">
            Manage clinic equipment, maintenance schedules, and repairs
          </p>
        </div>
        <Link href="/resources/equipment/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Equipment</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                <Package className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Repair</p>
                <p className="text-xl font-bold">{stats.inRepair}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                <Wrench className="h-4 w-4 text-warning-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="error">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Maintenance Due</p>
                <p className="text-xl font-bold">{stats.maintenanceDue}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                <AlertTriangle className="h-4 w-4 text-error-600" />
              </div>
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, number, serial..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
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

            {/* Category filter */}
            <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition filter */}
            <Select value={condition} onValueChange={(v) => { setCondition(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
            <p className="text-error-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No equipment found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || category || condition
                ? 'Try adjusting your filters'
                : 'Get started by adding your first piece of equipment'}
            </p>
            {!search && !status && !category && !condition && (
              <Link href="/resources/equipment/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Equipment grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((equipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} equipment
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
        </>
      )}
    </div>
  );
}
