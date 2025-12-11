'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Ruler,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
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

interface ClinicalMeasurement {
  id: string;
  measurementType: string;
  measurementDate: string;
  value: number;
  unit: string;
  method: string | null;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  recordedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  progressNote: {
    id: string;
    noteDate: string;
  } | null;
}

const measurementTypeLabels: Record<string, string> = {
  OVERJET: 'Overjet',
  OVERBITE: 'Overbite',
  OVERBITE_PERCENT: 'Overbite %',
  CROWDING_UPPER: 'Crowding (Upper)',
  CROWDING_LOWER: 'Crowding (Lower)',
  SPACING_UPPER: 'Spacing (Upper)',
  SPACING_LOWER: 'Spacing (Lower)',
  MIDLINE_UPPER: 'Midline (Upper)',
  MIDLINE_LOWER: 'Midline (Lower)',
  MOLAR_RELATIONSHIP_RIGHT: 'Molar Relationship (R)',
  MOLAR_RELATIONSHIP_LEFT: 'Molar Relationship (L)',
  CANINE_RELATIONSHIP_RIGHT: 'Canine Relationship (R)',
  CANINE_RELATIONSHIP_LEFT: 'Canine Relationship (L)',
  ARCH_LENGTH_UPPER: 'Arch Length (Upper)',
  ARCH_LENGTH_LOWER: 'Arch Length (Lower)',
  INTERCANINE_WIDTH_UPPER: 'Intercanine Width (Upper)',
  INTERCANINE_WIDTH_LOWER: 'Intercanine Width (Lower)',
  INTERMOLAR_WIDTH_UPPER: 'Intermolar Width (Upper)',
  INTERMOLAR_WIDTH_LOWER: 'Intermolar Width (Lower)',
  CROSSBITE: 'Crossbite',
  OPEN_BITE: 'Open Bite',
};

const methodLabels: Record<string, string> = {
  CLINICAL: 'Clinical',
  MODEL_ANALYSIS: 'Model Analysis',
  DIGITAL_SCAN: 'Digital Scan',
  CEPHALOMETRIC: 'Cephalometric',
};

function MeasurementsListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [measurements, setMeasurements] = useState<ClinicalMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [measurementType, setMeasurementType] = useState(searchParams.get('measurementType') || 'all');

  const fetchMeasurements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (patientId) params.set('patientId', patientId);
      if (measurementType && measurementType !== 'all') params.set('measurementType', measurementType);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'measurementDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/clinical-measurements?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMeasurements(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, measurementType, page, pageSize]);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Clinical Measurements"
        description="Orthodontic measurement tracking and trends"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Measurements' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/documentation/notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Progress Note
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
                    placeholder="Filter by patient ID..."
                    value={patientId}
                    onChange={(e) => {
                      setPatientId(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={measurementType} onValueChange={(value) => { setMeasurementType(value); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Measurement Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(measurementTypeLabels).map(([value, label]) => (
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
            ) : measurements.length === 0 ? (
              <div className="text-center py-12">
                <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No measurements found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Measurements are recorded during progress notes
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/documentation/notes/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Progress Note
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {measurements.map((measurement) => (
                  <ListItem
                    key={measurement.id}
                    showArrow
                    className="px-4"
                    onClick={() => measurement.progressNote
                      ? router.push(`/treatment/documentation/notes/${measurement.progressNote.id}`)
                      : null
                    }
                    leading={
                      <div className="p-2 rounded-lg bg-accent-100">
                        <Ruler className="h-5 w-5 text-accent-600" />
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-semibold">
                          {measurement.value} {measurement.unit}
                        </span>
                        {measurement.method && (
                          <Badge variant="outline" className="text-xs">
                            {methodLabels[measurement.method] || measurement.method}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {measurementTypeLabels[measurement.measurementType] || measurement.measurementType}
                        </Badge>
                        <PhiProtected fakeData={getFakeName()}>
                          {measurement.patient.firstName} {measurement.patient.lastName}
                        </PhiProtected>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(measurement.measurementDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {measurement.recordedBy.firstName} {measurement.recordedBy.lastName}
                        </span>
                        {measurement.notes && (
                          <span className="text-muted-foreground truncate max-w-xs">
                            {measurement.notes}
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

function MeasurementsListPageLoading() {
  return (
    <>
      <PageHeader
        title="Clinical Measurements"
        description="Orthodontic measurement tracking and trends"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[200px]" />
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

export default function MeasurementsListPage() {
  return (
    <Suspense fallback={<MeasurementsListPageLoading />}>
      <MeasurementsListPageContent />
    </Suspense>
  );
}
