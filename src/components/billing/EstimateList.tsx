'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Calculator,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
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
import { formatCurrency } from '@/lib/utils';

interface TreatmentEstimate {
  id: string;
  estimateNumber: string;
  estimateDate: string;
  expirationDate: string;
  treatmentDescription: string;
  totalEstimatedCost: number;
  insuranceEstimate: number;
  patientEstimate: number;
  status: string;
  presentedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  account: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  scenarios?: {
    id: string;
    name: string;
    totalCost: number;
    patientCost: number;
  }[];
  createdAt: string;
}

interface PaginatedResponse {
  items: TreatmentEstimate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: {
    totalEstimates: number;
    totalValue: number;
    statusCounts: Record<string, { count: number; value: number }>;
  };
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PRESENTED', label: 'Presented' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONVERTED', label: 'Converted' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  PENDING: 'info',
  PRESENTED: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'destructive',
  EXPIRED: 'secondary',
  CONVERTED: 'success',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PRESENTED: 'Presented',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  CONVERTED: 'Converted',
};

export function EstimateList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch estimates data
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
        const response = await fetch(`/api/billing/estimates?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch estimates');
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
    router.replace(query ? `/billing/estimates?${query}` : '/billing/estimates', { scroll: false });
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

  const isExpiringSoon = (estimate: TreatmentEstimate) => {
    if (estimate.status !== 'PENDING' && estimate.status !== 'PRESENTED') return false;
    const daysUntilExpiration = Math.ceil(
      (new Date(estimate.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'CONVERTED':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'DECLINED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PRESENTED':
        return <Clock className="h-4 w-4 text-warning-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treatment Estimates</h1>
          <p className="text-muted-foreground">
            Create and track treatment cost estimates for patients
          </p>
        </div>
        <Link href="/billing/estimates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{data.stats.totalEstimates}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold">{formatCurrency(data.stats.totalValue)}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-info-600">
              {data.stats.statusCounts?.PENDING?.count || 0}
            </p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Presented</p>
            <p className="text-lg font-semibold text-warning-600">
              {data.stats.statusCounts?.PRESENTED?.count || 0}
            </p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Accepted</p>
            <p className="text-lg font-semibold text-success-600">
              {data.stats.statusCounts?.ACCEPTED?.count || 0}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by estimate #, patient name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
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
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
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
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No estimates found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status
                ? 'Try adjusting your filters'
                : 'Get started by creating your first treatment estimate'}
            </p>
            <Link href="/billing/estimates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Estimate
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} estimate{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Patient Cost</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((estimate) => (
                  <TableRow
                    key={estimate.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/billing/estimates/${estimate.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{estimate.estimateNumber}</span>
                      {estimate.scenarios && estimate.scenarios.length > 1 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {estimate.scenarios.length} scenarios
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {estimate.account.patient.firstName} {estimate.account.patient.lastName}
                        </span>
                      </PhiProtected>
                      <p className="text-xs text-muted-foreground">{estimate.account.accountNumber}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[200px] block">
                        {estimate.treatmentDescription || 'Treatment estimate'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(estimate.totalEstimatedCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {formatCurrency(estimate.patientEstimate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-sm ${isExpiringSoon(estimate) ? 'text-warning-600 font-medium' : ''}`}>
                          {format(new Date(estimate.expirationDate), 'MMM d, yyyy')}
                        </span>
                        {isExpiringSoon(estimate) && (
                          <Badge variant="warning" className="text-xs ml-1">Soon</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(estimate.status)}
                        <Badge variant={statusBadgeVariant[estimate.status] || 'default'}>
                          {statusLabels[estimate.status] || estimate.status}
                        </Badge>
                      </div>
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
