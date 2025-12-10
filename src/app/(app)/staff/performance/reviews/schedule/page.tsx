'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import {
  Calendar,
  Users,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  hireDate: string;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
}

interface ReviewCycleConfig {
  reviewType: string;
  frequency: string;
  startDate: string;
  selectedStaff: string[];
}

const REVIEW_TYPES = [
  { value: 'ANNUAL', label: 'Annual Review', months: 12 },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual Review', months: 6 },
  { value: 'QUARTERLY', label: 'Quarterly Review', months: 3 },
  { value: 'PROBATIONARY', label: 'Probationary Review', months: 3 },
];

export default function ReviewSchedulePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [config, setConfig] = useState<ReviewCycleConfig>({
    reviewType: 'ANNUAL',
    frequency: '12',
    startDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    selectedStaff: [],
  });

  // Stats
  const [stats, setStats] = useState({
    totalStaff: 0,
    reviewsDue: 0,
    reviewsOverdue: 0,
    upcomingReviews: 0,
  });

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch staff and their review status
      const [staffRes, reviewsRes] = await Promise.all([
        fetch('/api/staff?status=ACTIVE&pageSize=100'),
        fetch('/api/staff/reviews?pageSize=100'),
      ]);

      const staffData = await staffRes.json();
      const reviewsData = await reviewsRes.json();

      if (staffData.success) {
        const staffList = staffData.data.items;
        const reviews = reviewsData.success ? reviewsData.data.items : [];

        // Enrich staff with review info
        const enrichedStaff = staffList.map((s: StaffMember) => {
          const staffReviews = reviews.filter(
            (r: { staffProfileId: string }) => r.staffProfileId === s.id
          );
          const lastReview = staffReviews
            .filter((r: { status: string }) => r.status === 'COMPLETED')
            .sort(
              (a: { reviewDate: string }, b: { reviewDate: string }) =>
                new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
            )[0];

          const lastReviewDate = lastReview?.reviewDate || null;
          const nextReviewDue = lastReviewDate
            ? format(addMonths(new Date(lastReviewDate), 12), 'yyyy-MM-dd')
            : format(addMonths(new Date(s.hireDate), 12), 'yyyy-MM-dd');

          return {
            ...s,
            lastReviewDate,
            nextReviewDue,
          };
        });

        setStaff(enrichedStaff);

        // Calculate stats
        const now = new Date();
        const reviewsDue = enrichedStaff.filter(
          (s: StaffMember) =>
            s.nextReviewDue && new Date(s.nextReviewDue) <= addMonths(now, 1)
        ).length;
        const reviewsOverdue = enrichedStaff.filter(
          (s: StaffMember) => s.nextReviewDue && new Date(s.nextReviewDue) < now
        ).length;
        const upcomingReviews = reviews.filter(
          (r: { status: string }) => r.status === 'SCHEDULED'
        ).length;

        setStats({
          totalStaff: enrichedStaff.length,
          reviewsDue,
          reviewsOverdue,
          upcomingReviews,
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load staff data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const toggleStaffSelection = (staffId: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedStaff: prev.selectedStaff.includes(staffId)
        ? prev.selectedStaff.filter((id) => id !== staffId)
        : [...prev.selectedStaff, staffId],
    }));
  };

  const selectAll = () => {
    setConfig((prev) => ({
      ...prev,
      selectedStaff: staff.map((s) => s.id),
    }));
  };

  const selectNone = () => {
    setConfig((prev) => ({
      ...prev,
      selectedStaff: [],
    }));
  };

  const selectDue = () => {
    const now = new Date();
    const dueStaff = staff.filter(
      (s) => s.nextReviewDue && new Date(s.nextReviewDue) <= addMonths(now, 1)
    );
    setConfig((prev) => ({
      ...prev,
      selectedStaff: dueStaff.map((s) => s.id),
    }));
  };

  const handleScheduleReviews = async () => {
    if (config.selectedStaff.length === 0) {
      toast({
        title: 'No Staff Selected',
        description: 'Please select at least one staff member to schedule reviews.',
        variant: 'destructive',
      });
      return;
    }

    setIsScheduling(true);
    try {
      // Create reviews for each selected staff member
      const reviewPromises = config.selectedStaff.map((staffId) => {
        const reviewPeriodStart = startOfMonth(new Date(config.startDate));
        const reviewPeriodEnd = endOfMonth(
          addMonths(reviewPeriodStart, parseInt(config.frequency) - 1)
        );
        const reviewDate = addDays(reviewPeriodEnd, 14); // Schedule 2 weeks after period ends

        return fetch('/api/staff/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffProfileId: staffId,
            reviewType: config.reviewType,
            reviewPeriodStart: format(reviewPeriodStart, 'yyyy-MM-dd'),
            reviewPeriodEnd: format(reviewPeriodEnd, 'yyyy-MM-dd'),
            reviewDate: format(reviewDate, 'yyyy-MM-dd'),
            status: 'SCHEDULED',
          }),
        });
      });

      const results = await Promise.all(reviewPromises);
      const successCount = results.filter((r) => r.ok).length;

      toast({
        title: 'Reviews Scheduled',
        description: `Successfully scheduled ${successCount} of ${config.selectedStaff.length} reviews.`,
      });

      setDialogOpen(false);
      setConfig((prev) => ({ ...prev, selectedStaff: [] }));
      fetchStaff();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to schedule reviews',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const getReviewStatus = (staff: StaffMember) => {
    if (!staff.nextReviewDue) return { label: 'Never Reviewed', variant: 'secondary' as const };
    const now = new Date();
    const dueDate = new Date(staff.nextReviewDue);
    if (dueDate < now) return { label: 'Overdue', variant: 'destructive' as const };
    if (dueDate <= addMonths(now, 1)) return { label: 'Due Soon', variant: 'warning' as const };
    return { label: 'On Track', variant: 'success' as const };
  };

  return (
    <>
      <PageHeader
        title="Schedule Review Cycles"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Performance', href: '/staff/performance' },
          { label: 'Reviews', href: '/staff/performance/reviews' },
          { label: 'Schedule' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchStaff} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setDialogOpen(true)} disabled={config.selectedStaff.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Reviews ({config.selectedStaff.length})
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Staff</p>
                  <p className="text-lg font-bold">{stats.totalStaff}</p>
                </div>
                <Users className="h-5 w-5 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Reviews Due</p>
                  <p className="text-lg font-bold">{stats.reviewsDue}</p>
                </div>
                <Clock className="h-5 w-5 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold">{stats.reviewsOverdue}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-error-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-lg font-bold">{stats.upcomingReviews}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Selection Actions */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <FormField label="Review Type">
                    <Select
                      value={config.reviewType}
                      onValueChange={(v) => setConfig((prev) => ({ ...prev, reviewType: v }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEW_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Start Date">
                    <Input
                      type="date"
                      value={config.startDate}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-[160px]"
                    />
                  </FormField>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectDue}>
                    Select Due
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectNone}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Staff Members</CardTitle>
              <CardDescription>
                Select staff members to schedule for review cycle
              </CardDescription>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Last Review</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : staff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.map((s) => {
                      const status = getReviewStatus(s);
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Checkbox
                              checked={config.selectedStaff.includes(s.id)}
                              onCheckedChange={() => toggleStaffSelection(s.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <PhiProtected fakeData={getFakeName()}>
                              {s.firstName} {s.lastName}
                            </PhiProtected>
                          </TableCell>
                          <TableCell>{s.title || '-'}</TableCell>
                          <TableCell>{format(new Date(s.hireDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {s.lastReviewDate
                              ? format(new Date(s.lastReviewDate), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {s.nextReviewDue
                              ? format(new Date(s.nextReviewDue), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Review Cycle</DialogTitle>
            <DialogDescription>
              Create review sessions for {config.selectedStaff.length} staff member(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Review Type</p>
                  <p className="font-medium">
                    {REVIEW_TYPES.find((t) => t.value === config.reviewType)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(config.startDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Staff Selected</p>
                  <p className="font-medium">{config.selectedStaff.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Review Period</p>
                  <p className="font-medium">
                    {REVIEW_TYPES.find((t) => t.value === config.reviewType)?.months} months
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Reviews will be scheduled 2 weeks after the end of the review period.
              Staff members will receive notifications about their upcoming reviews.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReviews} disabled={isScheduling}>
              {isScheduling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Schedule Reviews
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
