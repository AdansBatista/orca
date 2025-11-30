'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, Users } from 'lucide-react';
import type { StaffProfile, Credential, Certification } from '@prisma/client';

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
import { Skeleton } from '@/components/ui/skeleton';
import { StaffCard } from './StaffCard';

type StaffWithRelations = StaffProfile & {
  credentials?: Pick<Credential, 'id' | 'type' | 'name' | 'expirationDate' | 'status'>[];
  certifications?: Pick<Certification, 'id' | 'type' | 'name' | 'expirationDate' | 'status'>[];
};

interface PaginatedResponse {
  items: StaffWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const employmentTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PRN', label: 'PRN' },
  { value: 'TEMP', label: 'Temporary' },
];

const providerFilterOptions = [
  { value: '', label: 'All Staff' },
  { value: 'true', label: 'Providers Only' },
  { value: 'false', label: 'Non-Providers' },
];

export function StaffList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || '');
  const [isProvider, setIsProvider] = useState(searchParams.get('isProvider') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch staff data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (employmentType) params.set('employmentType', employmentType);
      if (isProvider) params.set('isProvider', isProvider);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/staff?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch staff');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, employmentType, isProvider, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (employmentType) params.set('employmentType', employmentType);
    if (isProvider) params.set('isProvider', isProvider);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/staff?${query}` : '/staff', { scroll: false });
  }, [search, status, employmentType, isProvider, page, router]);

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
          <h1 className="text-2xl font-bold text-foreground">Staff Directory</h1>
          <p className="text-muted-foreground">
            Manage staff profiles, credentials, and certifications
          </p>
        </div>
        <Link href="/staff/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
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
                placeholder="Search by name, email, or employee #..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
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

            {/* Employment type filter */}
            <Select value={employmentType} onValueChange={(v) => { setEmploymentType(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Provider filter */}
            <Select value={isProvider} onValueChange={(v) => { setIsProvider(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providerFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
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
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
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
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No staff found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || employmentType || isProvider
                ? 'Try adjusting your filters'
                : 'Get started by adding your first staff member'}
            </p>
            {!search && !status && !employmentType && !isProvider && (
              <Link href="/staff/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Staff grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((staff) => (
              <StaffCard key={staff.id} staff={staff} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} staff
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
