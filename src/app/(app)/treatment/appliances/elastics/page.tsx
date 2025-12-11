'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CircleDot,
  Plus,
  Search,
  Calendar,
  User,
  Clock,
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

interface ElasticPrescription {
  id: string;
  elasticType: string;
  elasticSize: string;
  fromTooth: number;
  toTooth: number;
  wearSchedule: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  prescribedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const elasticTypeLabels: Record<string, string> = {
  CLASS_II: 'Class II',
  CLASS_III: 'Class III',
  VERTICAL: 'Vertical',
  CROSS: 'Cross',
  BOX: 'Box',
  TRIANGLE: 'Triangle',
  ZIG_ZAG: 'Zig-Zag',
  CUSTOM: 'Custom',
};

const elasticSizeLabels: Record<string, string> = {
  LIGHT_1_8: '1/8" Light',
  LIGHT_3_16: '3/16" Light',
  MEDIUM_1_4: '1/4" Medium',
  MEDIUM_5_16: '5/16" Medium',
  HEAVY_3_8: '3/8" Heavy',
  HEAVY_1_2: '1/2" Heavy',
};

function ElasticsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [elastics, setElastics] = useState<ElasticPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [elasticType, setElasticType] = useState(searchParams.get('elasticType') || 'all');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || 'all');

  const fetchElastics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (elasticType && elasticType !== 'all') params.set('elasticType', elasticType);
      if (isActive && isActive !== 'all') params.set('isActive', isActive);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'startDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/elastic-prescriptions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setElastics(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching elastics:', error);
    } finally {
      setLoading(false);
    }
  }, [search, elasticType, isActive, page, pageSize]);

  useEffect(() => {
    fetchElastics();
  }, [fetchElastics]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Elastic Prescriptions"
        description="Manage patient elastic wear prescriptions"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Elastics' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/appliances/elastics/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
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
              <Select value={elasticType} onValueChange={(value) => { setElasticType(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(elasticTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={isActive} onValueChange={(value) => { setIsActive(value); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
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
            ) : elastics.length === 0 ? (
              <div className="text-center py-12">
                <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No elastic prescriptions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create prescriptions for patient elastic wear
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/elastics/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {elastics.map((elastic) => (
                  <ListItem
                    key={elastic.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/appliances/elastics/${elastic.id}`)}
                    leading={
                      <div className={`p-2 rounded-lg ${elastic.isActive ? 'bg-success-100' : 'bg-muted'}`}>
                        <CircleDot className={`h-5 w-5 ${elastic.isActive ? 'text-success-600' : 'text-muted-foreground'}`} />
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={elastic.isActive ? 'success' : 'secondary'}>
                          {elastic.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {elasticSizeLabels[elastic.elasticSize] || elastic.elasticSize}
                        </span>
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        <PhiProtected fakeData={getFakeName()}>
                          {elastic.patient.firstName} {elastic.patient.lastName}
                        </PhiProtected>
                        <Badge variant="outline">
                          {elasticTypeLabels[elastic.elasticType] || elastic.elasticType}
                        </Badge>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          #{elastic.fromTooth} → #{elastic.toTooth}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {elastic.hoursPerDay}h/day
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(elastic.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {elastic.prescribedBy.title || 'Dr.'} {elastic.prescribedBy.lastName}
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

function ElasticsPageLoading() {
  return (
    <>
      <PageHeader
        title="Elastic Prescriptions"
        description="Manage patient elastic wear prescriptions"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[150px]" />
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

export default function ElasticsPage() {
  return (
    <Suspense fallback={<ElasticsPageLoading />}>
      <ElasticsPageContent />
    </Suspense>
  );
}
