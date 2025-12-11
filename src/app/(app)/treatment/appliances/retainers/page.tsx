'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Plus,
  Search,
  Calendar,
  Package,
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

interface RetainerRecord {
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
  retainerType: string;
  arch: string;
  material: string | null;
  status: string;
  orderedDate: string | null;
  receivedDate: string | null;
  deliveredDate: string | null;
  wearSchedule: string | null;
  isReplacement: boolean;
  deliveredBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const retainerTypeLabels: Record<string, string> = {
  HAWLEY: 'Hawley',
  ESSIX: 'Essix',
  VIVERA: 'Vivera',
  FIXED_BONDED: 'Fixed Bonded',
  SPRING_RETAINER: 'Spring Retainer',
  WRAP_AROUND: 'Wrap Around',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  ORDERED: 'info',
  IN_FABRICATION: 'warning',
  RECEIVED: 'info',
  DELIVERED: 'success',
  ACTIVE: 'success',
  REPLACED: 'secondary',
  LOST: 'destructive',
  BROKEN: 'destructive',
};

const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  IN_FABRICATION: 'In Fabrication',
  RECEIVED: 'Received',
  DELIVERED: 'Delivered',
  ACTIVE: 'Active',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

const wearScheduleLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  NIGHTS_ONLY: 'Nights Only',
  EVERY_OTHER_NIGHT: 'Every Other Night',
  FEW_NIGHTS_WEEK: 'Few Nights/Week',
  AS_NEEDED: 'As Needed',
};

function RetainersListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [retainers, setRetainers] = useState<RetainerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [retainerType, setRetainerType] = useState(searchParams.get('retainerType') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [arch, setArch] = useState(searchParams.get('arch') || 'all');

  const fetchRetainers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (retainerType && retainerType !== 'all') params.set('retainerType', retainerType);
      if (status && status !== 'all') params.set('status', status);
      if (arch && arch !== 'all') params.set('arch', arch);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/retainers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRetainers(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching retainers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, retainerType, status, arch, page, pageSize]);

  useEffect(() => {
    fetchRetainers();
  }, [fetchRetainers]);

  const totalPages = Math.ceil(total / pageSize);

  const getDateToShow = (retainer: RetainerRecord) => {
    if (retainer.deliveredDate) {
      return { label: 'Delivered', date: retainer.deliveredDate };
    }
    if (retainer.receivedDate) {
      return { label: 'Received', date: retainer.receivedDate };
    }
    if (retainer.orderedDate) {
      return { label: 'Ordered', date: retainer.orderedDate };
    }
    return null;
  };

  return (
    <>
      <PageHeader
        title="Retainer Management"
        description="Track retainer orders, deliveries, and retention protocols"
        actions={
          <Button onClick={() => router.push('/treatment/appliances/retainers/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Order Retainer
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
                    placeholder="Search by material, notes..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={retainerType} onValueChange={(value) => { setRetainerType(value); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Retainer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(retainerTypeLabels).map(([value, label]) => (
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
            ) : retainers.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No retainer records found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/retainers/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Order First Retainer
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {retainers.map((retainer) => {
                  const dateInfo = getDateToShow(retainer);
                  return (
                    <ListItem
                      key={retainer.id}
                      showArrow
                      className="px-4"
                      onClick={() => router.push(`/treatment/appliances/retainers/${retainer.id}`)}
                      leading={
                        <div className="p-2 rounded-lg bg-muted">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                      }
                      trailing={
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={statusVariants[retainer.status] || 'secondary'}>
                            {statusLabels[retainer.status] || retainer.status}
                          </Badge>
                          {retainer.isReplacement && (
                            <Badge variant="outline" className="text-xs">Replacement</Badge>
                          )}
                        </div>
                      }
                    >
                      <ListItemTitle>
                        <PhiProtected fakeData={getFakeName()}>
                          {retainer.patient.firstName} {retainer.patient.lastName}
                        </PhiProtected>
                      </ListItemTitle>
                      <ListItemDescription>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {retainerTypeLabels[retainer.retainerType] || retainer.retainerType}
                            {retainer.material && ` (${retainer.material})`}
                          </span>
                          <span>• {archLabels[retainer.arch] || retainer.arch}</span>
                          {dateInfo && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {dateInfo.label} {new Date(dateInfo.date).toLocaleDateString()}
                            </span>
                          )}
                          {retainer.wearSchedule && (
                            <span className="text-muted-foreground">
                              {wearScheduleLabels[retainer.wearSchedule] || retainer.wearSchedule}
                            </span>
                          )}
                        </span>
                      </ListItemDescription>
                    </ListItem>
                  );
                })}
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

function RetainersListPageLoading() {
  return (
    <>
      <PageHeader
        title="Retainer Management"
        description="Track retainer orders, deliveries, and retention protocols"
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

export default function RetainersListPage() {
  return (
    <Suspense fallback={<RetainersListPageLoading />}>
      <RetainersListPageContent />
    </Suspense>
  );
}
