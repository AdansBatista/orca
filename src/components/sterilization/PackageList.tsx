'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  Table2,
  Columns3,
} from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PackageCard } from './PackageCard';
import { PackageCardCondensed } from './PackageCardCondensed';
import { PackageTableView, PackageTableViewCompact } from './PackageTableView';

interface PackageData {
  id: string;
  packageNumber: string;
  packageType: PackageType;
  status: PackageStatus;
  sterilizedDate: string;
  expirationDate: string;
  instrumentNames: string[];
  itemCount: number;
  cassetteName?: string | null;
  cycle?: {
    id: string;
    cycleNumber: string;
    cycleType: string;
  };
  _count?: {
    usages: number;
  };
}

interface PackageListResponse {
  items: PackageData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    byStatus: Record<string, number>;
    expiringWithin7Days: number;
  };
}

type ViewMode = 'grid' | 'condensed' | 'table' | 'table-compact';

const packageTypeOptions: { value: PackageType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'CASSETTE_FULL', label: 'Full Cassette' },
  { value: 'CASSETTE_EXAM', label: 'Exam Cassette' },
  { value: 'POUCH', label: 'Pouch' },
  { value: 'WRAPPED', label: 'Wrapped' },
  { value: 'INDIVIDUAL', label: 'Individual' },
];

const statusOptions: { value: PackageStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'STERILE', label: 'Sterile' },
  { value: 'USED', label: 'Used' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'COMPROMISED', label: 'Compromised' },
  { value: 'RECALLED', label: 'Recalled' },
];

const viewOptions: { value: ViewMode; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid, description: 'Standard card grid' },
  { value: 'condensed', label: 'Condensed', icon: List, description: 'Compact list view' },
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
            {Array.from({ length: view === 'table' ? 8 : 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3 border-t border-border/50">
            <div className="flex gap-4">
              {Array.from({ length: view === 'table' ? 8 : 6 }).map((_, j) => (
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

export function PackageList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [stats, setStats] = useState<PackageListResponse['stats'] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [packageType, setPackageType] = useState<PackageType | 'all'>(
    (searchParams.get('packageType') as PackageType) || 'all'
  );
  const [status, setStatus] = useState<PackageStatus | 'all'>(
    (searchParams.get('status') as PackageStatus) || 'all'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [view, setView] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  );

  const pageSize = 12;

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (packageType !== 'all') params.set('packageType', packageType);
      if (status !== 'all') params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const response = await fetch(`/api/resources/sterilization/packages?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch packages');
      }

      setPackages(result.data.items);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
      setStats(result.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, packageType, status, page]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (packageType !== 'all') params.set('packageType', packageType);
    if (status !== 'all') params.set('status', status);
    if (page > 1) params.set('page', String(page));
    if (view !== 'grid') params.set('view', view);

    const newUrl = params.toString() ? `?${params}` : '';
    router.replace(`/resources/sterilization/packages${newUrl}`, { scroll: false });
  }, [search, packageType, status, page, view, router]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const renderContent = () => {
    if (!packages.length) return null;

    switch (view) {
      case 'condensed':
        return (
          <div className="space-y-2">
            {packages.map((pkg) => (
              <PackageCardCondensed key={pkg.id} pkg={pkg} />
            ))}
          </div>
        );

      case 'table':
        return <PackageTableView packages={packages} />;

      case 'table-compact':
        return <PackageTableViewCompact packages={packages} />;

      case 'grid':
      default:
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
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
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sterile Packages</p>
                  <p className="text-xl font-bold">{stats.byStatus.STERILE || 0}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="text-xl font-bold">{stats.byStatus.USED || 0}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
                  <Package className="h-4 w-4 text-secondary-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  <p className="text-xl font-bold">{stats.expiringWithin7Days}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
                  <Clock className="h-4 w-4 text-warning-600" />
                </div>
              </div>
            </StatCard>
            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-xl font-bold">{stats.byStatus.EXPIRED || 0}</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
                  <AlertTriangle className="h-4 w-4 text-error-600" />
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
                  placeholder="Search packages..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Package Type filter */}
              <Select
                value={packageType}
                onValueChange={(v) => {
                  setPackageType(v as PackageType | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packageTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as PackageStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
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
              <p className="text-error-600 mb-4">{error}</p>
              <Button onClick={fetchPackages}>Retry</Button>
            </CardContent>
          </Card>
        ) : packages.length === 0 ? (
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No packages found</h3>
              <p className="text-muted-foreground">
                {search || packageType !== 'all' || status !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create packages from completed sterilization cycles'}
              </p>
            </CardContent>
          </Card>
        ) : (
          renderContent()
        )}
      </div>

      {/* Sticky pagination footer */}
      {totalPages > 1 && (
        <div className="shrink-0 pt-4 mt-4 border-t border-border/50 bg-background">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
