'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Package,
  Calendar,
  User,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { Pagination } from '@/components/ui/pagination';

interface ApplianceRecord {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentPlan: {
    id: string;
    planName: string;
  } | null;
  applianceType: string;
  applianceSystem: string | null;
  manufacturer: string | null;
  arch: string;
  status: string;
  placedDate: string | null;
  placedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    wireRecords: number;
  };
}

const applianceTypeLabels: Record<string, string> = {
  BRACKETS: 'Brackets',
  BANDS: 'Bands',
  EXPANDER: 'Expander',
  HERBST: 'Herbst',
  MARA: 'MARA',
  HEADGEAR: 'Headgear',
  FACEMASK: 'Facemask',
  TAD: 'TAD',
  ELASTICS: 'Elastics',
  SPRING: 'Spring',
  POWER_CHAIN: 'Power Chain',
  OTHER: 'Other',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  ACTIVE: 'success',
  ORDERED: 'info',
  RECEIVED: 'info',
  ADJUSTED: 'warning',
  REMOVED: 'secondary',
  REPLACED: 'secondary',
  LOST: 'destructive',
  BROKEN: 'destructive',
};

const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  ACTIVE: 'Active',
  ADJUSTED: 'Adjusted',
  REMOVED: 'Removed',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

function BracketsListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appliances, setAppliances] = useState<ApplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [applianceType, setApplianceType] = useState(searchParams.get('applianceType') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [arch, setArch] = useState(searchParams.get('arch') || 'all');

  const fetchAppliances = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (applianceType && applianceType !== 'all') params.set('applianceType', applianceType);
      if (status && status !== 'all') params.set('status', status);
      if (arch && arch !== 'all') params.set('arch', arch);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/appliances?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAppliances(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching appliances:', error);
    } finally {
      setLoading(false);
    }
  }, [search, applianceType, status, arch, page, pageSize]);

  useEffect(() => {
    fetchAppliances();
  }, [fetchAppliances]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Brackets & Fixed Appliances"
        description="Track brackets, bands, expanders, and other fixed appliances"
        actions={
          <Button onClick={() => router.push('/treatment/appliances/brackets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Appliance
          </Button>
        }
      />

      <PageContent>
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by system, manufacturer..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={applianceType} onValueChange={(value) => { setApplianceType(value); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Appliance Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(applianceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={arch} onValueChange={(value) => { setArch(value); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Arch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Arches</SelectItem>
                  {Object.entries(archLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : appliances.length === 0 ? (
              <div className="text-center py-12">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appliance records found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/brackets/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Appliance
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {appliances.map((appliance) => (
                  <ListItem
                    key={appliance.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/appliances/brackets/${appliance.id}`)}
                    leading={
                      <div className="p-2 rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariants[appliance.status] || 'secondary'}>
                          {statusLabels[appliance.status] || appliance.status}
                        </Badge>
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <PhiProtected fakeData={getFakeName()}>
                        {appliance.patient.firstName} {appliance.patient.lastName}
                      </PhiProtected>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {applianceTypeLabels[appliance.applianceType] || appliance.applianceType}
                          {appliance.applianceSystem && ` - ${appliance.applianceSystem}`}
                        </span>
                        <span>• {archLabels[appliance.arch] || appliance.arch}</span>
                        {appliance.placedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(appliance.placedDate).toLocaleDateString()}
                          </span>
                        )}
                        {appliance._count.wireRecords > 0 && (
                          <span className="text-muted-foreground">
                            {appliance._count.wireRecords} wire{appliance._count.wireRecords !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    </ListItemDescription>
                  </ListItem>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </PageContent>
    </>
  );
}

function BracketsListPageLoading() {
  return (
    <>
      <PageHeader
        title="Brackets & Fixed Appliances"
        description="Track brackets, bands, expanders, and other fixed appliances"
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

export default function BracketsListPage() {
  return (
    <Suspense fallback={<BracketsListPageLoading />}>
      <BracketsListPageContent />
    </Suspense>
  );
}
