'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { BarChart3, RefreshCw, Calendar } from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
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
import { toast } from '@/components/ui/use-toast';

interface PerformanceReview {
  id: string;
  reviewType: string;
  status: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewDate: string | null;
  overallRating: number | null;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const reviewTypes = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'PROBATIONARY', label: 'Probationary' },
  { value: 'PERFORMANCE_IMPROVEMENT', label: 'Performance Improvement' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'SPECIAL', label: 'Special' },
];

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('reviewType', typeFilter);

      const response = await fetch(`/api/staff/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.items);
        setTotal(data.data.total);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const totalPages = Math.ceil(total / pageSize);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'SCHEDULED': return 'secondary';
      case 'PENDING_APPROVAL': return 'warning';
      case 'CANCELLED': return 'destructive';
      default: return 'default';
    }
  };

  const scheduledCount = reviews.filter((r) => r.status === 'SCHEDULED').length;
  const completedCount = reviews.filter((r) => r.status === 'COMPLETED').length;

  return (
    <>
      <PageHeader
        title="Performance Reviews"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff' },
          { label: 'Performance', href: '/staff/performance' },
          { label: 'Reviews' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                  <p className="text-lg font-bold">{total}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-lg font-bold">{scheduledCount}</p>
                </div>
                <Calendar className="h-5 w-5 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold">{completedCount}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Status">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Review Type">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {reviewTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <Button variant="outline" onClick={fetchReviews}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader compact>
              <CardTitle size="sm">{total} Reviews</CardTitle>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Review Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reviews found</TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.staffProfile?.firstName} {r.staffProfile?.lastName}
                          {r.staffProfile?.title && (
                            <span className="text-xs text-muted-foreground block">{r.staffProfile.title}</span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.reviewType.replace('_', ' ')}</Badge></TableCell>
                        <TableCell>
                          {format(new Date(r.reviewPeriodStart), 'MMM d')} - {format(new Date(r.reviewPeriodEnd), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{r.reviewDate ? format(new Date(r.reviewDate), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell>
                          {r.overallRating ? (
                            <span className="font-bold">{r.overallRating}/5</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell><Badge variant={statusVariant(r.status)}>{r.status.replace('_', ' ')}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
