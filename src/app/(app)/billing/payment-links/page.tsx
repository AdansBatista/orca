'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Link2,
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ExternalLink,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DataTableLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface PaymentLink {
  id: string;
  code: string;
  amount: number;
  description?: string;
  status: string;
  expiresAt?: string;
  sentAt?: string;
  sentVia?: string;
  completedAt?: string;
  paymentUrl?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  account: {
    id: string;
    accountNumber: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    balance: number;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface PaymentLinkStats {
  statusCounts: Record<string, number>;
}

const linkStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'secondary',
  SENT: 'info',
  VIEWED: 'warning',
  COMPLETED: 'success',
  EXPIRED: 'secondary',
  CANCELLED: 'destructive',
};

const linkStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<PaymentLinkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const { toast } = useToast();

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/payment-links?${params}`);
      const data = await response.json();

      if (data.success) {
        setLinks(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopyLink = async (link: PaymentLink) => {
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${link.code}`;

    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast({
        title: 'Link copied',
        description: 'Payment link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSendLink = async (linkId: string, method: 'EMAIL' | 'SMS') => {
    try {
      const response = await fetch(`/api/payment-links/${linkId}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Link sent',
          description: `Payment link sent via ${method.toLowerCase()}`,
        });
        fetchLinks();
      } else {
        toast({
          title: 'Failed to send',
          description: data.error?.message || 'Could not send payment link',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send payment link',
        variant: 'destructive',
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const isExpired = (link: PaymentLink) => {
    return link.expiresAt && new Date(link.expiresAt) < new Date();
  };

  return (
    <>
      <PageHeader
        title="Payment Links"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Payment Links' },
        ]}
        actions={
          <Link href="/billing/payment-links/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <Link2 className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="info">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{stats?.statusCounts?.SENT || 0}</p>
                </div>
                <Send className="h-8 w-8 text-info-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats?.statusCounts?.PENDING || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.statusCounts?.COMPLETED || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DataTableLayout>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search links..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="VIEWED">Viewed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payment links found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create a payment link to get started'}
                </p>
                <Link href="/billing/payment-links/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Link
                  </Button>
                </Link>
              </div>
            ) : (
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{link.code}</p>
                            {link.invoice && (
                              <p className="text-xs text-muted-foreground">
                                {link.invoice.invoiceNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="text-sm">
                              {link.patient.firstName} {link.patient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-xs text-muted-foreground">
                            {link.account.accountNumber}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(link.amount)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isExpired(link) && link.status !== 'COMPLETED'
                                ? 'secondary'
                                : linkStatusVariant[link.status] || 'default'
                            }
                          >
                            {isExpired(link) && link.status !== 'COMPLETED'
                              ? 'Expired'
                              : linkStatusLabels[link.status] || link.status}
                          </Badge>
                          {link.sentVia && (
                            <p className="text-xs text-muted-foreground mt-1">
                              via {link.sentVia}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {link.expiresAt ? (
                            <span className={isExpired(link) ? 'text-destructive' : ''}>
                              {formatDate(link.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(link.createdAt)}</p>
                          {link.createdByUser && (
                            <p className="text-xs text-muted-foreground">
                              by {link.createdByUser.firstName}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyLink(link)}
                                  disabled={link.status === 'COMPLETED' || link.status === 'CANCELLED'}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy link</TooltipContent>
                            </Tooltip>

                            {link.status === 'PENDING' && !isExpired(link) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendLink(link.id, 'EMAIL')}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send via email</TooltipContent>
                              </Tooltip>
                            )}

                            <Link href={`/billing/payment-links/${link.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
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
          </DataTableLayout>
        </div>
      </PageContent>
    </>
  );
}
