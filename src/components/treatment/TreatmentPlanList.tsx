'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  ChevronRight,
  Calendar,
  User,
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

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  planType: string | null;
  status: string;
  chiefComplaint: string | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  primaryProvider?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  phases: {
    id: string;
    phaseName: string;
    status: string;
    progressPercent: number;
  }[];
  _count: {
    milestones: number;
    progressNotes: number;
  };
}

interface PaginatedResponse {
  items: TreatmentPlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PRESENTED', label: 'Presented' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'TRANSFERRED', label: 'Transferred' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary'> = {
  DRAFT: 'secondary',
  PRESENTED: 'info',
  ACCEPTED: 'soft-primary',
  ACTIVE: 'default',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'destructive',
  TRANSFERRED: 'secondary',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PRESENTED: 'Presented',
  ACCEPTED: 'Accepted',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  DISCONTINUED: 'Discontinued',
  TRANSFERRED: 'Transferred',
};

export function TreatmentPlanList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch treatment plans data
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
        const response = await fetch(`/api/treatment-plans?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment plans');
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
    router.replace(query ? `/treatment/plans?${query}` : '/treatment/plans', { scroll: false });
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

  // Calculate overall progress from phases
  const calculateProgress = (phases: TreatmentPlan['phases']) => {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + (phase.progressPercent || 0), 0);
    return Math.round(totalProgress / phases.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treatment Plans</h1>
          <p className="text-muted-foreground">
            Manage patient treatment plans and track progress
          </p>
        </div>
        <Link href="/treatment/plans/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
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
                placeholder="Search by plan name, number, complaint..."
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
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
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
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No treatment plans found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status
                ? 'Try adjusting your filters'
                : 'Get started by creating your first treatment plan'}
            </p>
            <Link href="/treatment/plans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Treatment Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} treatment plan{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/treatment/plans/${plan.id}`)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{plan.planNumber}</span>
                        {plan.planName && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {plan.planName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {plan.patient.firstName} {plan.patient.lastName}
                        </span>
                      </PhiProtected>
                      {plan.chiefComplaint && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {plan.chiefComplaint}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.primaryProvider ? (
                        <span className="text-sm">
                          Dr. {plan.primaryProvider.firstName} {plan.primaryProvider.lastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[plan.status] || 'secondary'}>
                        {statusLabels[plan.status] || plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${calculateProgress(plan.phases)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {calculateProgress(plan.phases)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                      </span>
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
