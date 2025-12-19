'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  DollarSign,
  Eye,
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

interface EOB {
  id: string;
  eobNumber: string | null;
  checkNumber: string | null;
  receivedDate: string;
  status: string;
  receiptMethod: string;
  totalPaid: number;
  totalAdjusted: number;
  patientResponsibility: number;
  needsReview: boolean;
  claim: {
    id: string;
    claimNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
    insuranceCompany: {
      id: string;
      name: string;
    };
  };
}

const EOB_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'secondary' },
  { value: 'REVIEWING', label: 'Reviewing', color: 'warning' },
  { value: 'PROCESSED', label: 'Processed', color: 'success' },
  { value: 'POSTED', label: 'Posted', color: 'default' },
];

function EOBsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eobs, setEobs] = useState<EOB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [needsReviewFilter, setNeedsReviewFilter] = useState<boolean>(
    searchParams.get('needsReview') === 'true'
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEOBs();
  }, [search, statusFilter, needsReviewFilter, page]);

  async function fetchEOBs() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (needsReviewFilter) params.set('needsReview', 'true');

      const res = await fetch(`/api/insurance/eobs?${params}`);
      const data = await res.json();

      if (data.success) {
        setEobs(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch EOBs:', error);
    } finally {
      setLoading(false);
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
    const statusConfig = EOB_STATUSES.find((s) => s.value === status);
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
      case 'REVIEWING':
        return <Eye className="h-4 w-4 text-amber-500" />;
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'POSTED':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <FileCheck className="h-4 w-4 text-muted-foreground" />;
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
            <h1 className="text-2xl font-bold tracking-tight">EOB Processing</h1>
            <p className="text-muted-foreground">
              {total} total EOBs
              {needsReviewFilter && ' (needs review)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload EOB
          </Button>
          <Link href="/billing/insurance/eobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Enter EOB
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by EOB #, check #, claim..."
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
                {EOB_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={needsReviewFilter ? 'default' : 'outline'}
              onClick={() => {
                setNeedsReviewFilter(!needsReviewFilter);
                setPage(1);
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Needs Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* EOBs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : eobs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <FileCheck className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No EOBs found</p>
              <Link href="/billing/insurance/eobs/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Enter First EOB
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EOB / Check #</TableHead>
                  <TableHead>Claim</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eobs.map((eob) => (
                  <TableRow
                    key={eob.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/billing/insurance/eobs/${eob.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(eob.status)}
                        <div>
                          <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                            {eob.eobNumber || eob.checkNumber || 'N/A'}
                          </code>
                          {eob.needsReview && (
                            <Badge variant="warning" className="ml-2">
                              Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/billing/insurance/claims/${eob.claim.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline"
                      >
                        {eob.claim.claimNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        {eob.claim.patient.firstName} {eob.claim.patient.lastName}
                      </PhiProtected>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{eob.claim.insuranceCompany.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(eob.receivedDate)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(eob.status)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600">
                        {formatCurrency(eob.totalPaid)}
                      </span>
                      {eob.totalAdjusted > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          -{formatCurrency(eob.totalAdjusted)} adj
                        </span>
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
                              router.push(`/billing/insurance/eobs/${eob.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          {eob.status === 'PENDING' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/billing/insurance/eobs/${eob.id}?action=process`);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Process EOB
                            </DropdownMenuItem>
                          )}
                          {eob.status === 'PROCESSED' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/billing/insurance/eobs/${eob.id}?action=post`);
                              }}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Post Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/billing/insurance/claims/${eob.claim.id}`);
                            }}
                          >
                            View Claim
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

export default function EOBsPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <EOBsPageContent />
    </Suspense>
  );
}
