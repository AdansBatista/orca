'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  ArrowLeft,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface DeniedClaim {
  id: string;
  claimNumber: string;
  status: string;
  serviceDate: string;
  deniedAt: string | null;
  billedAmount: number;
  denialCode: string | null;
  denialReason: string | null;
  appealDeadline: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  insuranceCompany: {
    id: string;
    name: string;
    payerId: string | null;
  };
  _count?: {
    items: number;
  };
}

interface DenialStats {
  urgentCount: number;
  denialCodeCounts: Array<{
    code: string;
    count: number;
    totalAmount: number;
  }>;
}

export default function DenialsPage() {
  const router = useRouter();
  const [denials, setDenials] = useState<DeniedClaim[]>([]);
  const [stats, setStats] = useState<DenialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDenials();
  }, [search, urgentOnly, page]);

  async function fetchDenials() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (search) params.set('search', search);
      if (urgentOnly) params.set('appealDeadlineApproaching', 'true');

      const res = await fetch(`/api/insurance/denials?${params}`);
      const data = await res.json();

      if (data.success) {
        setDenials(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch denials:', error);
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

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const totalDeniedAmount = denials.reduce((sum, d) => sum + d.billedAmount, 0);

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
            <h1 className="text-2xl font-bold tracking-tight">Denial Management</h1>
            <p className="text-muted-foreground">
              {total} denied claims requiring action
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="error">
          <p className="text-xs text-muted-foreground">Total Denied</p>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Claims pending appeal</p>
        </StatCard>
        <StatCard accentColor="warning">
          <p className="text-xs text-muted-foreground">Urgent</p>
          <p className="text-2xl font-bold">{stats?.urgentCount || 0}</p>
          <p className="text-xs text-muted-foreground">Deadline within 14 days</p>
        </StatCard>
        <StatCard accentColor="primary">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(totalDeniedAmount)}</p>
          <p className="text-xs text-muted-foreground">At risk</p>
        </StatCard>
        <StatCard accentColor="accent">
          <p className="text-xs text-muted-foreground">Top Denial Code</p>
          <p className="text-2xl font-bold">{stats?.denialCodeCounts?.[0]?.code || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{stats?.denialCodeCounts?.[0]?.count || 0} occurrences</p>
        </StatCard>
      </StatsRow>

      {/* Denial Code Distribution */}
      {stats?.denialCodeCounts && stats.denialCodeCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Denial Code Distribution</CardTitle>
            <CardDescription>Most common denial reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.denialCodeCounts.slice(0, 6).map((code) => (
                <div
                  key={code.code}
                  className="rounded-lg border p-4 text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSearch(code.code);
                    setPage(1);
                  }}
                >
                  <p className="font-mono text-lg font-bold">{code.code}</p>
                  <p className="text-2xl font-bold">{code.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(code.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by claim #, patient, denial code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant={urgentOnly ? 'default' : 'outline'}
              onClick={() => {
                setUrgentOnly(!urgentOnly);
                setPage(1);
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Urgent Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Denials Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : denials.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <XCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No denied claims found</p>
              <p className="text-sm text-muted-foreground">
                Great! All claims are being processed successfully.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Denial Code</TableHead>
                  <TableHead>Appeal Deadline</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {denials.map((denial) => {
                  const daysUntil = getDaysUntilDeadline(denial.appealDeadline);
                  const isUrgent = daysUntil !== null && daysUntil <= 14;

                  return (
                    <TableRow
                      key={denial.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/billing/insurance/claims/${denial.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                            {denial.claimNumber}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PhiProtected fakeData={getFakeName()}>
                          {denial.patient.firstName} {denial.patient.lastName}
                        </PhiProtected>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{denial.insuranceCompany.name}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="destructive" className="font-mono">
                            {denial.denialCode || 'N/A'}
                          </Badge>
                          {denial.denialReason && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-48 truncate">
                              {denial.denialReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {denial.appealDeadline ? (
                          <div className="flex items-center gap-2">
                            {isUrgent ? (
                              <Badge variant="destructive">
                                <Clock className="mr-1 h-3 w-3" />
                                {daysUntil} days
                              </Badge>
                            ) : (
                              <span className="text-sm">
                                {formatDate(denial.appealDeadline)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(denial.billedAmount)}
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
                                router.push(`/billing/insurance/claims/${denial.id}`);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Claim
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/billing/insurance/claims/${denial.id}?action=appeal`);
                              }}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              File Appeal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
