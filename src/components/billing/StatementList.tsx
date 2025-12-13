'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Wallet,
  ChevronRight,
  Calendar,
  Mail,
  Printer,
  Download,
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

interface Statement {
  id: string;
  statementNumber: string;
  statementDate: string;
  periodStart: string;
  periodEnd: string;
  previousBalance: number;
  newCharges: number;
  payments: number;
  adjustments: number;
  currentBalance: number;
  amountDue: number;
  dueDate: string;
  status: string;
  deliveryMethod: string;
  sentAt: string | null;
  account: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
}

interface PaginatedResponse {
  items: Statement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: {
    totalStatements: number;
    totalAmountDue: number;
    statusCounts: Record<string, number>;
  };
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'GENERATED', label: 'Generated' },
  { value: 'SENT', label: 'Sent' },
  { value: 'VIEWED', label: 'Viewed' },
  { value: 'PAID', label: 'Paid' },
];

const deliveryOptions = [
  { value: '', label: 'All Delivery' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MAIL', label: 'Mail' },
  { value: 'PORTAL', label: 'Portal' },
  { value: 'PRINT', label: 'Print' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  GENERATED: 'info',
  SENT: 'warning',
  VIEWED: 'info',
  PAID: 'success',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  GENERATED: 'Generated',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  PAID: 'Paid',
};

const deliveryIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3 w-3" />,
  MAIL: <Wallet className="h-3 w-3" />,
  PORTAL: <Download className="h-3 w-3" />,
  PRINT: <Printer className="h-3 w-3" />,
};

export function StatementList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [delivery, setDelivery] = useState(searchParams.get('delivery') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch statements data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (delivery) params.set('deliveryMethod', delivery);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/billing/statements?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch statements');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, delivery, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (delivery) params.set('delivery', delivery);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/billing/statements?${query}` : '/billing/statements', { scroll: false });
  }, [search, status, delivery, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDelivery('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Statements</h1>
          <p className="text-muted-foreground">
            Generate and send patient account statements
          </p>
        </div>
        <Link href="/billing/statements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Statement
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Total Statements</p>
            <p className="text-lg font-semibold">{data.stats.totalStatements}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-lg font-semibold">{formatCurrency(data.stats.totalAmountDue)}</p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="text-lg font-semibold text-info-600">
              {data.stats.statusCounts?.SENT || 0}
            </p>
          </Card>
          <Card variant="ghost" className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-warning-600">
              {(data.stats.statusCounts?.DRAFT || 0) + (data.stats.statusCounts?.GENERATED || 0)}
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
                placeholder="Search by statement #, patient name..."
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

            {/* Delivery Filter */}
            <Select value={delivery} onValueChange={(v) => { setDelivery(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent>
                {deliveryOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || status || delivery) && (
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
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No statements found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || delivery
                ? 'Try adjusting your filters'
                : 'Get started by generating your first statement'}
            </p>
            <Link href="/billing/statements/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Statement
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} statement{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statement #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((statement) => (
                  <TableRow
                    key={statement.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/billing/statements/${statement.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{statement.statementNumber}</span>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {statement.account.patient.firstName} {statement.account.patient.lastName}
                        </span>
                      </PhiProtected>
                      <p className="text-xs text-muted-foreground">{statement.account.accountNumber}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {format(new Date(statement.periodStart), 'MMM d')} - {format(new Date(statement.periodEnd), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatCurrency(statement.previousBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={statement.amountDue > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(statement.amountDue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {deliveryIcons[statement.deliveryMethod]}
                        {statement.deliveryMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[statement.status] || 'default'}>
                        {statusLabels[statement.status] || statement.status}
                      </Badge>
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
