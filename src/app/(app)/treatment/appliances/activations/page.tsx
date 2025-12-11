'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RotateCw,
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

interface ApplianceActivation {
  id: string;
  activationDate: string;
  activationType: string;
  turns: number | null;
  millimeters: number | null;
  instructions: string | null;
  nextActivationDate: string | null;
  isPatientReported: boolean;
  reportedWearHours: number | null;
  notes: string | null;
  applianceRecord: {
    id: string;
    applianceType: string;
    arch: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const applianceTypeLabels: Record<string, string> = {
  EXPANDER: 'Expander',
  HERBST: 'Herbst',
  DISTALIZER: 'Distalizer',
  FORSUS: 'Forsus',
  MARA: 'MARA',
  TWIN_BLOCK: 'Twin Block',
  HEADGEAR: 'Headgear',
  FACEMASK: 'Facemask',
  OTHER: 'Other',
};

function ActivationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activations, setActivations] = useState<ApplianceActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activationType, setActivationType] = useState(searchParams.get('activationType') || 'all');
  const [isPatientReported, setIsPatientReported] = useState(searchParams.get('isPatientReported') || 'all');

  const fetchActivations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activationType && activationType !== 'all') params.set('activationType', activationType);
      if (isPatientReported && isPatientReported !== 'all') {
        params.set('isPatientReported', isPatientReported);
      }
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'activationDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/appliance-activations?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        // Filter by search on client side (patient name)
        let items = data.data.items;
        if (search) {
          const searchLower = search.toLowerCase();
          items = items.filter((a: ApplianceActivation) =>
            `${a.applianceRecord.patient.firstName} ${a.applianceRecord.patient.lastName}`
              .toLowerCase()
              .includes(searchLower)
          );
        }
        setActivations(items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching activations:', error);
    } finally {
      setLoading(false);
    }
  }, [search, activationType, isPatientReported, page, pageSize]);

  useEffect(() => {
    fetchActivations();
  }, [fetchActivations]);

  const totalPages = Math.ceil(total / pageSize);

  const formatActivationValue = (activation: ApplianceActivation) => {
    if (activation.turns) return `${activation.turns} turns`;
    if (activation.millimeters) return `${activation.millimeters}mm`;
    return null;
  };

  return (
    <>
      <PageHeader
        title="Appliance Activations"
        description="Track appliance activations and adjustments"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Activations' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/appliances/activations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Record Activation
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
              <Select value={activationType} onValueChange={(value) => { setActivationType(value); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Expansion">Expansion</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                  <SelectItem value="Tightening">Tightening</SelectItem>
                  <SelectItem value="Compliance Check">Compliance Check</SelectItem>
                </SelectContent>
              </Select>
              <Select value={isPatientReported} onValueChange={(value) => { setIsPatientReported(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="false">Office</SelectItem>
                  <SelectItem value="true">Patient Reported</SelectItem>
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
            ) : activations.length === 0 ? (
              <div className="text-center py-12">
                <RotateCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activation records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Record activations for expanders and other adjustable appliances
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/appliances/activations/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Activation
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {activations.map((activation) => (
                  <ListItem
                    key={activation.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/appliances/activations/${activation.id}`)}
                    leading={
                      <div className={`p-2 rounded-lg ${activation.isPatientReported ? 'bg-info-100' : 'bg-primary-100'}`}>
                        <RotateCw className={`h-5 w-5 ${activation.isPatientReported ? 'text-info-600' : 'text-primary-600'}`} />
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={activation.isPatientReported ? 'info' : 'default'}>
                          {activation.isPatientReported ? 'Patient' : 'Office'}
                        </Badge>
                        {formatActivationValue(activation) && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatActivationValue(activation)}
                          </span>
                        )}
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        <PhiProtected fakeData={getFakeName()}>
                          {activation.applianceRecord.patient.firstName} {activation.applianceRecord.patient.lastName}
                        </PhiProtected>
                        <Badge variant="outline">
                          {applianceTypeLabels[activation.applianceRecord.applianceType] || activation.applianceRecord.applianceType}
                        </Badge>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{activation.activationType}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(activation.activationDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activation.performedBy.title || 'Dr.'} {activation.performedBy.lastName}
                        </span>
                        {activation.nextActivationDate && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Next: {new Date(activation.nextActivationDate).toLocaleDateString()}
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

function ActivationsPageLoading() {
  return (
    <>
      <PageHeader
        title="Appliance Activations"
        description="Track appliance activations and adjustments"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[160px]" />
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

export default function ActivationsPage() {
  return (
    <Suspense fallback={<ActivationsPageLoading />}>
      <ActivationsPageContent />
    </Suspense>
  );
}
