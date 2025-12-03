'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Wrench,
  FileCheck,
} from 'lucide-react';
import type { ValidationType, ValidationResult } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Pagination } from '@/components/ui/pagination';
import { StatsRow, DashboardGrid } from '@/components/layout';

interface ValidationWithEquipment {
  id: string;
  clinicId: string;
  equipmentId: string;
  validationType: ValidationType;
  validationDate: string;
  nextValidationDue: string | null;
  result: ValidationResult;
  performedBy: string;
  vendorName: string | null;
  certificateNumber: string | null;
  notes: string | null;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    equipmentNumber: string;
  } | null;
}

interface DueSummary {
  summary: {
    overdue: number;
    dueWithin7Days: number;
    dueWithin30Days: number;
    recentFailures: number;
  };
  overdue: Array<{
    id: string;
    validationType: ValidationType;
    nextDue: string;
    daysOverdue: number;
    equipment: { name: string; equipmentNumber: string } | null;
  }>;
}

interface PaginatedResponse {
  items: ValidationWithEquipment[];
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
  { value: 'INSTALLATION_QUALIFICATION', label: 'IQ' },
  { value: 'OPERATIONAL_QUALIFICATION', label: 'OQ' },
  { value: 'PERFORMANCE_QUALIFICATION', label: 'PQ' },
  { value: 'LEAK_RATE_TEST', label: 'Leak Rate Test' },
  { value: 'REPAIR_VERIFICATION', label: 'Repair Verification' },
];

const resultOptions = [
  { value: '', label: 'All Results' },
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'CONDITIONAL', label: 'Conditional' },
];

function getValidationTypeLabel(type: ValidationType): string {
  const labels: Record<ValidationType, string> = {
    INSTALLATION_QUALIFICATION: 'Installation Qualification (IQ)',
    OPERATIONAL_QUALIFICATION: 'Operational Qualification (OQ)',
    PERFORMANCE_QUALIFICATION: 'Performance Qualification (PQ)',
    BOWIE_DICK_TEST: 'Bowie-Dick Test',
    LEAK_RATE_TEST: 'Leak Rate Test',
    CALIBRATION: 'Calibration',
    PREVENTIVE_MAINTENANCE: 'Preventive Maintenance',
    REPAIR_VERIFICATION: 'Repair Verification',
    ANNUAL_VALIDATION: 'Annual Validation',
  };
  return labels[type] || type;
}

function getValidationTypeShortLabel(type: ValidationType): string {
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

function ValidationCard({ validation }: { validation: ValidationWithEquipment }) {
  const resultVariant =
    validation.result === 'PASS'
      ? 'success'
      : validation.result === 'FAIL'
      ? 'error'
      : 'warning';

  const ResultIcon =
    validation.result === 'PASS'
      ? CheckCircle
      : validation.result === 'FAIL'
      ? XCircle
      : AlertTriangle;

  return (
    <Link href={`/resources/sterilization/validations/${validation.id}`}>
      <Card interactive className="h-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    validation.result === 'PASS'
                      ? 'bg-success-100 dark:bg-success-900/30'
                      : validation.result === 'FAIL'
                      ? 'bg-error-100 dark:bg-error-900/30'
                      : 'bg-warning-100 dark:bg-warning-900/30'
                  }`}
                >
                  <ResultIcon
                    className={`h-4 w-4 ${
                      validation.result === 'PASS'
                        ? 'text-success-600'
                        : validation.result === 'FAIL'
                        ? 'text-error-600'
                        : 'text-warning-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {getValidationTypeShortLabel(validation.validationType)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(validation.validationDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <Badge variant={resultVariant}>{validation.result}</Badge>
            </div>

            {/* Equipment */}
            {validation.equipment && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wrench className="h-3.5 w-3.5" />
                <span className="truncate">{validation.equipment.name}</span>
              </div>
            )}

            {/* Performed by */}
            <div className="text-sm">
              <span className="text-muted-foreground">By: </span>
              <span>{validation.performedBy}</span>
              {validation.vendorName && (
                <span className="text-muted-foreground"> ({validation.vendorName})</span>
              )}
            </div>

            {/* Next due */}
            {validation.nextValidationDue && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Next: {format(new Date(validation.nextValidationDue), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Certificate */}
            {validation.certificateNumber && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileCheck className="h-3 w-3" />
                <span>Cert: {validation.certificateNumber}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ValidationList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [dueSummary, setDueSummary] = useState<DueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [validationType, setValidationType] = useState(
    searchParams.get('validationType') || ''
  );
  const [result, setResult] = useState(searchParams.get('result') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (validationType) params.set('validationType', validationType);
      if (result) params.set('result', result);
      params.set('page', String(page));
      params.set('pageSize', '12');

      try {
        const [validationsRes, dueRes] = await Promise.all([
          fetch(`/api/resources/sterilization/validations?${params.toString()}`),
          fetch('/api/resources/sterilization/validations/due'),
        ]);

        const validationsResult = await validationsRes.json();
        const dueResult = await dueRes.json();

        if (!validationsResult.success) {
          throw new Error(validationsResult.error?.message || 'Failed to fetch validations');
        }

        setData(validationsResult.data);
        if (dueResult.success) {
          setDueSummary(dueResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [validationType, result, page]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (validationType) params.set('validationType', validationType);
    if (result) params.set('result', result);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(
      query ? `/resources/sterilization/validations?${query}` : '/resources/sterilization/validations',
      { scroll: false }
    );
  }, [validationType, result, page, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="ghost">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
          <p className="text-error-600">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {dueSummary && (
        <StatsRow>
          <StatCard accentColor={dueSummary.summary.overdue > 0 ? 'error' : 'success'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold">{dueSummary.summary.overdue}</p>
              </div>
              <div
                className={`flex items-center justify-center rounded-xl p-2 ${
                  dueSummary.summary.overdue > 0
                    ? 'bg-error-100 dark:bg-error-900/30'
                    : 'bg-success-100 dark:bg-success-900/30'
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    dueSummary.summary.overdue > 0 ? 'text-error-600' : 'text-success-600'
                  }`}
                />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor={dueSummary.summary.dueWithin7Days > 0 ? 'warning' : 'success'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Due in 7 days</p>
                <p className="text-xl font-bold">{dueSummary.summary.dueWithin7Days}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                <Clock className="h-4 w-4 text-warning-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Due in 30 days</p>
                <p className="text-xl font-bold">{dueSummary.summary.dueWithin30Days}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
                <Calendar className="h-4 w-4 text-accent-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-xl font-bold">{data?.total || 0}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                <ShieldCheck className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Overdue Alert */}
      {dueSummary && dueSummary.overdue.length > 0 && (
        <Card className="border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
          <CardHeader className="pb-2">
            <CardTitle size="sm" className="flex items-center gap-2 text-error-700 dark:text-error-400">
              <AlertTriangle className="h-4 w-4" />
              Overdue Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dueSummary.overdue.slice(0, 5).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50"
                >
                  <div>
                    <span className="font-medium">
                      {getValidationTypeShortLabel(schedule.validationType)}
                    </span>
                    {schedule.equipment && (
                      <span className="text-muted-foreground"> - {schedule.equipment.name}</span>
                    )}
                  </div>
                  <Badge variant="error">{schedule.daysOverdue} days overdue</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Validation Type filter */}
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

            {/* Result filter */}
            <Select
              value={result}
              onValueChange={(v) => {
                setResult(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Link href="/resources/sterilization/validations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Validation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No validations found</h3>
            <p className="text-muted-foreground mb-4">
              {validationType || result
                ? 'Try adjusting your filters'
                : 'Get started by logging your first equipment validation'}
            </p>
            <Link href="/resources/sterilization/validations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Validation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((validation) => (
            <ValidationCard key={validation.id} validation={validation} />
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
