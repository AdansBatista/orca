'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Cable,
  Plus,
  Search,
  Calendar,
  User,
  Filter,
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

interface WireRecord {
  id: string;
  wireType: string;
  wireSize: string;
  wireMaterial: string;
  arch: string;
  placedDate: string;
  removedDate: string | null;
  status: string;
  sequenceNumber: number | null;
  bends: string | null;
  notes: string | null;
  applianceRecord: {
    id: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  placedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const wireTypeLabels: Record<string, string> = {
  NITI_ROUND: 'NiTi Round',
  NITI_RECTANGULAR: 'NiTi Rectangular',
  NITI_HEAT_ACTIVATED: 'NiTi Heat-Activated',
  SS_ROUND: 'SS Round',
  SS_RECTANGULAR: 'SS Rectangular',
  TMA: 'TMA',
  BETA_TITANIUM: 'Beta Titanium',
  BRAIDED: 'Braided',
  COAXIAL: 'Coaxial',
};

const wireMaterialLabels: Record<string, string> = {
  NICKEL_TITANIUM: 'Nickel Titanium',
  STAINLESS_STEEL: 'Stainless Steel',
  TMA: 'TMA',
  BETA_TITANIUM: 'Beta Titanium',
  COPPER_NITI: 'Copper NiTi',
};

const archLabels: Record<string, string> = {
  UPPER: 'Upper',
  LOWER: 'Lower',
  BOTH: 'Both',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  REMOVED: 'Removed',
  REPLACED: 'Replaced',
  LOST: 'Lost',
  BROKEN: 'Broken',
};

const statusVariants: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  REMOVED: 'secondary',
  REPLACED: 'secondary',
  LOST: 'warning',
  BROKEN: 'destructive',
};

function WiresListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [wires, setWires] = useState<WireRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [wireType, setWireType] = useState(searchParams.get('wireType') || 'all');
  const [arch, setArch] = useState(searchParams.get('arch') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const fetchWires = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (wireType && wireType !== 'all') params.set('wireType', wireType);
      if (arch && arch !== 'all') params.set('arch', arch);
      if (status && status !== 'all') params.set('status', status);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'placedDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/wires?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setWires(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching wires:', error);
    } finally {
      setLoading(false);
    }
  }, [search, wireType, arch, status, page, pageSize]);

  useEffect(() => {
    fetchWires();
  }, [fetchWires]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Wire Records"
        description="Track wire changes and progressions"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Wires' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/appliances/wires/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Wire Record
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
                    placeholder="Search by patient name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={wireType} onValueChange={(value) => { setWireType(value); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Wire Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(wireTypeLabels).map(([value, label]) => (
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
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
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
            ) : wires.length === 0 ? (
              <div className="text-center py-12">
                <Cable className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No wire records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wire records track archwire changes throughout treatment
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/wires/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wire Record
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {wires.map((wire) => (
                  <ListItem
                    key={wire.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/appliances/wires/${wire.id}`)}
                    leading={
                      <div className={`p-2 rounded-lg ${
                        wire.status === 'ACTIVE' ? 'bg-success-100' : 'bg-muted'
                      }`}>
                        <Cable className={`h-5 w-5 ${
                          wire.status === 'ACTIVE' ? 'text-success' : 'text-muted-foreground'
                        }`} />
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusVariants[wire.status] || 'secondary'}>
                          {statusLabels[wire.status] || wire.status}
                        </Badge>
                        <Badge variant="outline">
                          {archLabels[wire.arch] || wire.arch}
                        </Badge>
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        {wire.applianceRecord?.patient ? (
                          <PhiProtected fakeData={getFakeName()}>
                            {wire.applianceRecord.patient.firstName} {wire.applianceRecord.patient.lastName}
                          </PhiProtected>
                        ) : (
                          <span className="text-muted-foreground">No patient linked</span>
                        )}
                        <Badge variant="outline">
                          {wireTypeLabels[wire.wireType] || wire.wireType}
                        </Badge>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{wire.wireSize}</span>
                        <span>{wireMaterialLabels[wire.wireMaterial] || wire.wireMaterial}</span>
                        {wire.sequenceNumber && (
                          <span>Sequence #{wire.sequenceNumber}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(wire.placedDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <PhiProtected fakeData={getFakeName()}>
                            {wire.placedBy.title ? `${wire.placedBy.title} ` : ''}
                            {wire.placedBy.lastName}
                          </PhiProtected>
                        </span>
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

function WiresListPageLoading() {
  return (
    <>
      <PageHeader
        title="Wire Records"
        description="Track wire changes and progressions"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[130px]" />
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

export default function WiresListPage() {
  return (
    <Suspense fallback={<WiresListPageLoading />}>
      <WiresListPageContent />
    </Suspense>
  );
}
