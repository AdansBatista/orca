'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid,
  List,
  Table2,
  Rows3,
  Columns3,
} from 'lucide-react';
import type { SterilizationCycle, SterilizationCycleType, CycleStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { StatsRow } from '@/components/layout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CycleCard } from './CycleCard';
import { CycleCardCondensed } from './CycleCardCondensed';
import { CycleCardExpanded } from './CycleCardExpanded';
import { CycleTableView, CycleTableViewCompact } from './CycleTableView';

type CycleWithCounts = SterilizationCycle & {
  _count: {
    loads: number;
    biologicalIndicators: number;
    chemicalIndicators: number;
  };
};

interface PaginatedResponse {
  items: CycleWithCounts[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type ViewMode = 'grid' | 'condensed' | 'expanded' | 'table' | 'table-compact';

const cycleTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'STEAM_GRAVITY', label: 'Steam Gravity' },
  { value: 'STEAM_PREVACUUM', label: 'Steam Pre-Vacuum' },
  { value: 'STEAM_FLASH', label: 'Flash/Immediate' },
  { value: 'CHEMICAL', label: 'Chemical' },
  { value: 'DRY_HEAT', label: 'Dry Heat' },
  { value: 'VALIDATION', label: 'Validation' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ABORTED', label: 'Aborted' },
  { value: 'VOID', label: 'Void' },
];

const viewOptions: { value: ViewMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid, description: 'Standard card grid' },
  { value: 'condensed', label: 'Condensed', icon: List, description: 'Compact list view' },
  { value: 'expanded', label: 'Expanded', icon: Rows3, description: 'Detailed cards' },
  { value: 'table', label: 'Table', icon: Table2, description: 'Full table view' },
  { value: 'table-compact', label: 'Compact Table', icon: Columns3, description: 'Minimal table' },
];

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-1">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = view === option.value;
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onChange(option.value)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{option.label}</p>
                <p className="text-muted-foreground">{option.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function LoadingSkeleton({ view }: { view: ViewMode }) {
  if (view === 'table' || view === 'table-compact') {
    return (
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="bg-muted/30 p-3">
          <div className="flex gap-4">
            {Array.from({ length: view === 'table' ? 9 : 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3 border-t border-border/50">
            <div className="flex gap-4">
              {Array.from({ length: view === 'table' ? 9 : 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'condensed') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (view === 'expanded') {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Default grid skeleton
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CycleList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
  } | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cycleType, setCycleType] = useState(searchParams.get('cycleType') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [view, setView] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  );

  // Fetch cycles data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (cycleType) params.set('cycleType', cycleType);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', '12');

      try {
        const response = await fetch(`/api/resources/sterilization/cycles?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch cycles');
        }

        setData(result.data);

        // Calculate stats from data
        if (!stats) {
          const allResponse = await fetch('/api/resources/sterilization/cycles?pageSize=1000');
          const allResult = await allResponse.json();
          if (allResult.success) {
            const allItems = allResult.data.items as CycleWithCounts[];
            setStats({
              total: allResult.data.total,
              completed: allItems.filter((c) => c.status === 'COMPLETED').length,
              failed: allItems.filter((c) => c.status === 'FAILED').length,
              inProgress: allItems.filter((c) => c.status === 'IN_PROGRESS').length,
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
  }, [search, cycleType, status, page, stats]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cycleType) params.set('cycleType', cycleType);
    if (status) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    if (view !== 'grid') params.set('view', view);

    const query = params.toString();
    router.replace(query ? `/resources/sterilization?${query}` : '/resources/sterilization', {
      scroll: false,
    });
  }, [search, cycleType, status, page, view, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const renderContent = () => {
    if (!data?.items) return null;

    switch (view) {
      case 'condensed':
        return (
          <div className="space-y-2">
            {data.items.map((cycle) => (
              <CycleCardCondensed key={cycle.id} cycle={cycle} />
            ))}
          </div>
        );

      case 'expanded':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            {data.items.map((cycle) => (
              <CycleCardExpanded key={cycle.id} cycle={cycle} />
            ))}
          </div>
        );

      case 'table':
        return <CycleTableView cycles={data.items} />;

      case 'table-compact':
        return <CycleTableViewCompact cycles={data.items} />;

      case 'grid':
      default:
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header section - Stats and Filters */}
      <div className="shrink-0 space-y-6 pb-4">
        {/* Stats */}
        {stats && (
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cycles</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                  <FlaskConical className="h-4 w-4 text-primary-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{stats.completed}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-xl font-bold">{stats.failed}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                  <XCircle className="h-4 w-4 text-error-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-xl font-bold">{stats.inProgress}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
                  <Clock className="h-4 w-4 text-accent-600" />
                </div>
              </div>
            </StatCard>
          </StatsRow>
        )}

        {/* Filters and View Toggle */}
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by cycle number..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Cycle Type filter */}
              <Select
                value={cycleType}
                onValueChange={(v) => {
                  setCycleType(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Cycle Type" />
                </SelectTrigger>
                <SelectContent>
                  {cycleTypeOptions.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v === 'all' ? '' : v);
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

              {/* View Toggle */}
              <ViewToggle view={view} onChange={setView} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <LoadingSkeleton view={view} />
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
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No cycles found</h3>
              <p className="text-muted-foreground mb-4">
                {search || cycleType || status
                  ? 'Try adjusting your filters'
                  : 'Get started by recording your first sterilization cycle'}
              </p>
              {!search && !cycleType && !status && (
                <Link href="/resources/sterilization/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Cycle
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          renderContent()
        )}
      </div>

      {/* Sticky pagination footer */}
      {data && data.totalPages > 1 && (
        <div className="shrink-0 pt-4 mt-4 border-t border-border/50 bg-background">
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
