'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SmilePlus,
  Plus,
  Search,
  Calendar,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress';

interface AlignerRecord {
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
  alignerSystem: string;
  caseNumber: string | null;
  totalAligners: number;
  currentAligner: number;
  refinementNumber: number;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  alignersDelivered: number;
  averageWearHours: number | null;
  _count: {
    deliveries: number;
  };
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  SUBMITTED: 'info',
  APPROVED: 'info',
  MANUFACTURING: 'warning',
  IN_PROGRESS: 'success',
  REFINEMENT: 'warning',
  COMPLETED: 'success',
  DISCONTINUED: 'secondary',
};

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  MANUFACTURING: 'Manufacturing',
  IN_PROGRESS: 'In Progress',
  REFINEMENT: 'Refinement',
  COMPLETED: 'Completed',
  DISCONTINUED: 'Discontinued',
};

const alignerSystems = [
  'Invisalign',
  'ClearCorrect',
  'SureSmile',
  '3M Clarity',
  'Spark',
  'uLab',
  'Other',
];

function AlignersListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [aligners, setAligners] = useState<AlignerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [alignerSystem, setAlignerSystem] = useState(searchParams.get('alignerSystem') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const fetchAligners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (alignerSystem && alignerSystem !== 'all') params.set('alignerSystem', alignerSystem);
      if (status && status !== 'all') params.set('status', status);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'startDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/aligners?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAligners(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching aligners:', error);
    } finally {
      setLoading(false);
    }
  }, [search, alignerSystem, status, page, pageSize]);

  useEffect(() => {
    fetchAligners();
  }, [fetchAligners]);

  const totalPages = Math.ceil(total / pageSize);

  const getProgressPercent = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  return (
    <>
      <PageHeader
        title="Aligner Cases"
        description="Track clear aligner treatments (Invisalign, ClearCorrect, etc.)"
        actions={
          <Button onClick={() => router.push('/treatment/appliances/aligners/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Aligner Case
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
                    placeholder="Search by case number..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={alignerSystem} onValueChange={(value) => { setAlignerSystem(value); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Aligner System" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Systems</SelectItem>
                  {alignerSystems.map((system) => (
                    <SelectItem key={system} value={system}>{system}</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : aligners.length === 0 ? (
              <div className="text-center py-12">
                <SmilePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No aligner cases found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/aligners/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Aligner Case
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {aligners.map((aligner) => {
                  const progressPercent = getProgressPercent(aligner.currentAligner, aligner.totalAligners);
                  return (
                    <ListItem
                      key={aligner.id}
                      showArrow
                      className="px-4"
                      onClick={() => router.push(`/treatment/appliances/aligners/${aligner.id}`)}
                      leading={
                        <div className="p-2 rounded-lg bg-muted">
                          <SmilePlus className="h-5 w-5 text-accent" />
                        </div>
                      }
                      trailing={
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={statusVariants[aligner.status] || 'secondary'}>
                            {statusLabels[aligner.status] || aligner.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {aligner.currentAligner}/{aligner.totalAligners}
                          </span>
                        </div>
                      }
                    >
                      <ListItemTitle>
                        <PhiProtected fakeData={getFakeName()}>
                          {aligner.patient.firstName} {aligner.patient.lastName}
                        </PhiProtected>
                      </ListItemTitle>
                      <ListItemDescription>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium">{aligner.alignerSystem}</span>
                          {aligner.caseNumber && (
                            <span className="text-muted-foreground">#{aligner.caseNumber}</span>
                          )}
                          {aligner.refinementNumber > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Refinement #{aligner.refinementNumber}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started {new Date(aligner.startDate).toLocaleDateString()}
                          </span>
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={progressPercent} className="h-2 flex-1 max-w-[200px]" />
                          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
                        </div>
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

function AlignersListPageLoading() {
  return (
    <>
      <PageHeader
        title="Aligner Cases"
        description="Track clear aligner treatments (Invisalign, ClearCorrect, etc.)"
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[150px]" />
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
                    <Skeleton className="h-2 w-48" />
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

export default function AlignersListPage() {
  return (
    <Suspense fallback={<AlignersListPageLoading />}>
      <AlignersListPageContent />
    </Suspense>
  );
}
