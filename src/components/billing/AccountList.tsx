'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  Clock,
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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';
import { formatCurrency } from '@/lib/utils';

interface PatientAccount {
  id: string;
  accountNumber: string;
  currentBalance: number;
  insuranceBalance: number;
  patientBalance: number;
  creditBalance: number;
  aging30: number;
  aging60: number;
  aging90: number;
  aging120Plus: number;
  status: string;
  autoPayEnabled: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: PatientAccount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: {
    totalBalance: number;
    insuranceBalance: number;
    patientBalance: number;
    accountsWithBalance: number;
  };
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'COLLECTIONS', label: 'Collections' },
  { value: 'CLOSED', label: 'Closed' },
];

const balanceOptions = [
  { value: '', label: 'All Balances' },
  { value: 'with_balance', label: 'Has Balance' },
  { value: 'no_balance', label: 'No Balance' },
  { value: 'credit', label: 'Credit Balance' },
  { value: 'overdue', label: 'Overdue' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  COLLECTIONS: 'destructive',
  CLOSED: 'secondary',
};

export function AccountList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [balanceFilter, setBalanceFilter] = useState(searchParams.get('balance') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch accounts data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (balanceFilter) params.set('balance', balanceFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/billing/accounts?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch accounts');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, balanceFilter, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (balanceFilter) params.set('balance', balanceFilter);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/billing/accounts?${query}` : '/billing/accounts', { scroll: false });
  }, [search, status, balanceFilter, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setBalanceFilter('');
    setPage(1);
  };

  const getAgingStatus = (account: PatientAccount) => {
    if (account.aging120Plus > 0) return { label: '120+ days', variant: 'destructive' as const };
    if (account.aging90 > 0) return { label: '90+ days', variant: 'destructive' as const };
    if (account.aging60 > 0) return { label: '60+ days', variant: 'warning' as const };
    if (account.aging30 > 0) return { label: '30+ days', variant: 'warning' as const };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Accounts</h1>
          <p className="text-muted-foreground">
            Manage patient billing accounts and balances
          </p>
        </div>
        <Link href="/billing/accounts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="ghost" className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(data.stats.totalBalance)}</p>
              </div>
            </div>
          </Card>
          <Card variant="ghost" className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-info-500" />
              <div>
                <p className="text-xs text-muted-foreground">Patient Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(data.stats.patientBalance)}</p>
              </div>
            </div>
          </Card>
          <Card variant="ghost" className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning-500" />
              <div>
                <p className="text-xs text-muted-foreground">Insurance Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(data.stats.insuranceBalance)}</p>
              </div>
            </div>
          </Card>
          <Card variant="ghost" className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Accounts with Balance</p>
                <p className="text-lg font-semibold">{data.stats.accountsWithBalance}</p>
              </div>
            </div>
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
                placeholder="Search by name, account #, email..."
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

            {/* Balance Filter */}
            <Select value={balanceFilter} onValueChange={(v) => { setBalanceFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Balance" />
              </SelectTrigger>
              <SelectContent>
                {balanceOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || status || balanceFilter) && (
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
                  <Skeleton className="h-6 w-24" />
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
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || balanceFilter
                ? 'Try adjusting your filters'
                : 'Get started by creating a patient account'}
            </p>
            <Link href="/billing/accounts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} account{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Patient Due</TableHead>
                  <TableHead className="text-right">Insurance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((account) => {
                  const aging = getAgingStatus(account);
                  return (
                    <TableRow
                      key={account.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/billing/accounts/${account.id}`)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm">{account.accountNumber}</span>
                        {account.creditBalance > 0 && (
                          <Badge variant="info" className="ml-2 text-xs">Credit</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <PhiProtected fakeData={getFakeName()}>
                          <span className="font-medium">
                            {account.patient.firstName} {account.patient.lastName}
                          </span>
                        </PhiProtected>
                        {account.patient.email && (
                          <PhiProtected fakeData={getFakeEmail()}>
                            <p className="text-xs text-muted-foreground">{account.patient.email}</p>
                          </PhiProtected>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={account.currentBalance > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {formatCurrency(account.currentBalance)}
                        </span>
                        {aging && (
                          <Badge variant={aging.variant} className="ml-2 text-xs">
                            {aging.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.patientBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.insuranceBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[account.status] || 'default'}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
