'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface Preauthorization {
  id: string;
  authorizationNumber: string | null;
  status: string;
  requestDate: string;
  responseDate: string | null;
  expirationDate: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  procedureCodes: string[];
  patientInsurance: {
    id: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
    company: {
      id: string;
      name: string;
    };
  };
}

const PREAUTH_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'secondary' },
  { value: 'SUBMITTED', label: 'Submitted', color: 'info' },
  { value: 'APPROVED', label: 'Approved', color: 'success' },
  { value: 'DENIED', label: 'Denied', color: 'destructive' },
  { value: 'EXPIRED', label: 'Expired', color: 'warning' },
];

export default function PreauthorizationsPage() {
  const router = useRouter();
  const [preauths, setPreauths] = useState<Preauthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPreauths();
  }, [search, statusFilter, page]);

  async function fetchPreauths() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/insurance/preauthorizations?${params}`);
      const data = await res.json();

      if (data.success) {
        setPreauths(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch preauthorizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(preauthId: string, action: string) {
    try {
      const res = await fetch(`/api/insurance/preauthorizations/${preauthId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPreauths();
      }
    } catch (error) {
      console.error(`Failed to ${action} preauthorization:`, error);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PREAUTH_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant={statusConfig?.color as 'default' | 'secondary' | 'destructive' | 'outline'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'SUBMITTED':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DENIED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pre-Authorizations</h1>
            <p className="text-muted-foreground">
              {total} total pre-authorization requests
            </p>
          </div>
        </div>
        <Link href="/billing/insurance/preauthorizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Pre-Auth
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by auth #, patient..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PREAUTH_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preauths Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : preauths.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No pre-authorizations found</p>
              <Link href="/billing/insurance/preauthorizations/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Pre-Auth
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auth #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Procedures</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preauths.map((preauth) => (
                  <TableRow
                    key={preauth.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/billing/insurance/preauthorizations/${preauth.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(preauth.status)}
                        <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                          {preauth.authorizationNumber || 'Pending'}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        {preauth.patientInsurance.patient.firstName}{' '}
                        {preauth.patientInsurance.patient.lastName}
                      </PhiProtected>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{preauth.patientInsurance.company.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {preauth.procedureCodes.slice(0, 3).map((code) => (
                          <Badge key={code} variant="outline" className="font-mono text-xs">
                            {code}
                          </Badge>
                        ))}
                        {preauth.procedureCodes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{preauth.procedureCodes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(preauth.requestDate)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(preauth.status)}
                      {preauth.expirationDate && preauth.status === 'APPROVED' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {formatDate(preauth.expirationDate)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(preauth.requestedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {preauth.approvedAmount !== null ? (
                        <span className="font-medium text-green-600">
                          {formatCurrency(preauth.approvedAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/billing/insurance/preauthorizations/${preauth.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          {preauth.status === 'PENDING' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(preauth.id, 'submit');
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Submit Request
                            </DropdownMenuItem>
                          )}
                          {preauth.status === 'SUBMITTED' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(preauth.id, 'check-status');
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Check Status
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
