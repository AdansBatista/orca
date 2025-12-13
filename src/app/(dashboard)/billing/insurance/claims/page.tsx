'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  DollarSign,
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
  DropdownMenuSeparator,
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

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  status: string;
  claimType: string;
  serviceDate: string;
  filingDate: string | null;
  billedAmount: number;
  allowedAmount: number | null;
  paidAmount: number;
  patientResponsibility: number;
  denialCode: string | null;
  denialReason: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  insuranceCompany: {
    id: string;
    name: string;
  };
  _count?: {
    items: number;
  };
}

const CLAIM_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'secondary' },
  { value: 'READY', label: 'Ready', color: 'default' },
  { value: 'SUBMITTED', label: 'Submitted', color: 'info' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'success' },
  { value: 'IN_PROCESS', label: 'In Process', color: 'warning' },
  { value: 'PAID', label: 'Paid', color: 'success' },
  { value: 'DENIED', label: 'Denied', color: 'destructive' },
  { value: 'APPEALED', label: 'Appealed', color: 'warning' },
  { value: 'VOID', label: 'Void', color: 'secondary' },
];

export default function InsuranceClaimsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchClaims();
  }, [search, statusFilter, page]);

  async function fetchClaims() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const insuranceCompanyId = searchParams.get('insuranceCompanyId');
      if (insuranceCompanyId) params.set('insuranceCompanyId', insuranceCompanyId);

      const res = await fetch(`/api/insurance/claims?${params}`);
      const data = await res.json();

      if (data.success) {
        setClaims(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitClaim(claimId: string) {
    try {
      const res = await fetch(`/api/insurance/claims/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchClaims();
      }
    } catch (error) {
      console.error('Failed to submit claim:', error);
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
    const statusConfig = CLAIM_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant={statusConfig?.color as 'default' | 'secondary' | 'destructive' | 'outline'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'READY':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'SUBMITTED':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'ACCEPTED':
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DENIED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'APPEALED':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
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
            <h1 className="text-2xl font-bold tracking-tight">Insurance Claims</h1>
            <p className="text-muted-foreground">
              {total} total claims
            </p>
          </div>
        </div>
        <Link href="/billing/insurance/claims/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
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
                placeholder="Search by claim #, patient..."
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
              <SelectTrigger className="w-44">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CLAIM_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : claims.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No claims found</p>
              <Link href="/billing/insurance/claims/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Claim
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/billing/insurance/claims/${claim.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(claim.status)}
                        <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                          {claim.claimNumber}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        {claim.patient.firstName} {claim.patient.lastName}
                      </PhiProtected>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{claim.insuranceCompany.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(claim.serviceDate)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(claim.status)}
                      {claim.denialCode && (
                        <p className="text-xs text-destructive mt-1">
                          {claim.denialCode}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(claim.billedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {claim.paidAmount > 0 ? (
                        <span className="font-medium text-green-600">
                          {formatCurrency(claim.paidAmount)}
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
                              router.push(`/billing/insurance/claims/${claim.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          {(claim.status === 'DRAFT' || claim.status === 'READY') && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitClaim(claim.id);
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Submit Claim
                            </DropdownMenuItem>
                          )}
                          {claim.status === 'DENIED' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/billing/insurance/claims/${claim.id}?action=appeal`);
                              }}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              File Appeal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/patients/${claim.patient.id}`);
                            }}
                          >
                            View Patient
                          </DropdownMenuItem>
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
