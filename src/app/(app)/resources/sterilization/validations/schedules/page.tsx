'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ClipboardCheck,
  Settings,
  Wrench,
} from 'lucide-react';
import type { ValidationType } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Pagination } from '@/components/ui/pagination';
import { StatsRow } from '@/components/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScheduleWithDetails {
  id: string;
  clinicId: string;
  equipmentId: string;
  validationType: ValidationType;
  frequencyDays: number;
  isActive: boolean;
  lastPerformed: string | null;
  nextDue: string | null;
  reminderDays: number;
  notes: string | null;
  status: 'overdue' | 'due_soon' | 'on_track';
  daysUntilDue: number | null;
  equipment: {
    id: string;
    name: string;
    equipmentNumber: string;
  } | null;
}

interface PaginatedResponse {
  items: ScheduleWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const validationTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'BOWIE_DICK_TEST', label: 'Bowie-Dick Test' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'ANNUAL_VALIDATION', label: 'Annual Validation' },
  { value: 'PREVENTIVE_MAINTENANCE', label: 'Preventive Maintenance' },
  { value: 'LEAK_RATE_TEST', label: 'Leak Rate Test' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'dueSoon', label: 'Due Soon' },
];

function getValidationTypeLabel(type: ValidationType): string {
  const labels: Record<ValidationType, string> = {
    INSTALLATION_QUALIFICATION: 'IQ',
    OPERATIONAL_QUALIFICATION: 'OQ',
    PERFORMANCE_QUALIFICATION: 'PQ',
    BOWIE_DICK_TEST: 'Bowie-Dick',
    LEAK_RATE_TEST: 'Leak Test',
    CALIBRATION: 'Calibration',
    PREVENTIVE_MAINTENANCE: 'PM',
    REPAIR_VERIFICATION: 'Repair',
    ANNUAL_VALIDATION: 'Annual',
  };
  return labels[type] || type;
}

function getFrequencyLabel(days: number): string {
  if (days === 1) return 'Daily';
  if (days === 7) return 'Weekly';
  if (days === 30) return 'Monthly';
  if (days === 90) return 'Quarterly';
  if (days === 180) return 'Semi-Annually';
  if (days === 365) return 'Annually';
  return `Every ${days} days`;
}

function ScheduleCard({ schedule }: { schedule: ScheduleWithDetails }) {
  const statusConfig = {
    overdue: {
      color: 'error',
      icon: AlertTriangle,
      label: `${Math.abs(schedule.daysUntilDue || 0)} days overdue`,
    },
    due_soon: {
      color: 'warning',
      icon: Clock,
      label: `Due in ${schedule.daysUntilDue} days`,
    },
    on_track: {
      color: 'success',
      icon: CheckCircle,
      label: schedule.daysUntilDue ? `Due in ${schedule.daysUntilDue} days` : 'On track',
    },
  };

  const config = statusConfig[schedule.status];
  const StatusIcon = config.icon;

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/30`}
              >
                <StatusIcon className={`h-4 w-4 text-${config.color}-600`} />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {getValidationTypeLabel(schedule.validationType)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getFrequencyLabel(schedule.frequencyDays)}
                </p>
              </div>
            </div>
            <Badge
              variant={
                schedule.status === 'overdue'
                  ? 'error'
                  : schedule.status === 'due_soon'
                  ? 'warning'
                  : 'success'
              }
            >
              {config.label}
            </Badge>
          </div>

          {/* Equipment */}
          {schedule.equipment && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              <span className="truncate">{schedule.equipment.name}</span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {schedule.lastPerformed && (
              <div>
                <p className="text-xs text-muted-foreground">Last Done</p>
                <p>{format(new Date(schedule.lastPerformed), 'MMM d, yyyy')}</p>
              </div>
            )}
            {schedule.nextDue && (
              <div>
                <p className="text-xs text-muted-foreground">Next Due</p>
                <p
                  className={
                    schedule.status === 'overdue'
                      ? 'text-error-600'
                      : schedule.status === 'due_soon'
                      ? 'text-warning-600'
                      : ''
                  }
                >
                  {format(new Date(schedule.nextDue), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/resources/sterilization/validations/new?equipmentId=${schedule.equipmentId}&validationType=${schedule.validationType}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                Log Now
              </Button>
            </Link>
            <Link href={`/resources/sterilization/validations/schedules/${schedule.id}`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ValidationSchedulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    overdue: number;
    dueSoon: number;
    onTrack: number;
    total: number;
  } | null>(null);

  // Filters
  const [validationType, setValidationType] = useState(
    searchParams.get('validationType') || ''
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (validationType) params.set('validationType', validationType);
      if (statusFilter === 'overdue') params.set('overdue', 'true');
      if (statusFilter === 'dueSoon') params.set('dueSoon', 'true');
      params.set('isActive', 'true');
      params.set('page', String(page));
      params.set('pageSize', '12');

      try {
        const res = await fetch(
          `/api/resources/sterilization/validations/schedules?${params.toString()}`
        );
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch schedules');
        }

        setData(result.data);

        // Calculate stats if not already loaded
        if (!stats) {
          const allRes = await fetch(
            '/api/resources/sterilization/validations/schedules?isActive=true&pageSize=100'
          );
          const allResult = await allRes.json();
          if (allResult.success) {
            const items = allResult.data.items as ScheduleWithDetails[];
            setStats({
              overdue: items.filter((s) => s.status === 'overdue').length,
              dueSoon: items.filter((s) => s.status === 'due_soon').length,
              onTrack: items.filter((s) => s.status === 'on_track').length,
              total: items.length,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [validationType, statusFilter, page, stats]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (validationType) params.set('validationType', validationType);
    if (statusFilter) params.set('status', statusFilter);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(
      query
        ? `/resources/sterilization/validations/schedules?${query}`
        : '/resources/sterilization/validations/schedules',
      { scroll: false }
    );
  }, [validationType, statusFilter, page, router]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <StatsRow>
          <StatCard accentColor={stats.overdue > 0 ? 'error' : 'success'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold">{stats.overdue}</p>
              </div>
              <div
                className={`flex items-center justify-center rounded-xl p-2 ${
                  stats.overdue > 0
                    ? 'bg-error-100 dark:bg-error-900/30'
                    : 'bg-success-100 dark:bg-success-900/30'
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    stats.overdue > 0 ? 'text-error-600' : 'text-success-600'
                  }`}
                />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Due Soon</p>
                <p className="text-xl font-bold">{stats.dueSoon}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                <Clock className="h-4 w-4 text-warning-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">On Track</p>
                <p className="text-xl font-bold">{stats.onTrack}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Schedules</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                <Calendar className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={validationType}
              onValueChange={(v) => {
                setValidationType(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Validation Type" />
              </SelectTrigger>
              <SelectContent>
                {validationTypeOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
            <p className="text-error-600">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No schedules found</h3>
            <p className="text-muted-foreground mb-4">
              {validationType || statusFilter
                ? 'Try adjusting your filters'
                : 'Get started by creating your first validation schedule'}
            </p>
            <Link href="/resources/sterilization/validations/schedules/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="pt-4 border-t border-border/50">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default function ValidationSchedulesPage() {
  return (
    <>
      <PageHeader
        title="Validation Schedules"
        description="Manage recurring validation schedules for sterilization equipment"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Validations', href: '/resources/sterilization/validations' },
          { label: 'Schedules' },
        ]}
        actions={
          <Link href="/resources/sterilization/validations/schedules/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <Suspense fallback={<LoadingSkeleton />}>
          <ValidationSchedulesContent />
        </Suspense>
      </PageContent>
    </>
  );
}
