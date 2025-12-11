'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Ruler,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Search,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface TrendData {
  type: string;
  unit: string;
  dataPoints: Array<{
    id: string;
    date: string;
    value: number;
    method: string | null;
    notes: string | null;
  }>;
  statistics: {
    count: number;
    min: number;
    max: number;
    average: number;
    latest: number;
    earliest: number;
    change: number;
    changePercent: number;
  };
}

interface TrendsResponse {
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  trends: TrendData[];
  totalMeasurements: number;
  dateRange: {
    from: string | null;
    to: string | null;
  };
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
  MOLAR_RELATIONSHIP_RIGHT: 'Molar Rel. (R)',
  MOLAR_RELATIONSHIP_LEFT: 'Molar Rel. (L)',
  CANINE_RELATIONSHIP_RIGHT: 'Canine Rel. (R)',
  CANINE_RELATIONSHIP_LEFT: 'Canine Rel. (L)',
  ARCH_LENGTH_UPPER: 'Arch Length (Upper)',
  ARCH_LENGTH_LOWER: 'Arch Length (Lower)',
  INTERCANINE_WIDTH_UPPER: 'Intercanine Width (Upper)',
  INTERCANINE_WIDTH_LOWER: 'Intercanine Width (Lower)',
  INTERMOLAR_WIDTH_UPPER: 'Intermolar Width (Upper)',
  INTERMOLAR_WIDTH_LOWER: 'Intermolar Width (Lower)',
  CROSSBITE: 'Crossbite',
  OPEN_BITE: 'Open Bite',
};

// Types where negative change is good (reducing)
const negativeIsGood = [
  'OVERJET',
  'OVERBITE',
  'CROWDING_UPPER',
  'CROWDING_LOWER',
  'CROSSBITE',
  'OPEN_BITE',
];

function TrendCard({ trend }: { trend: TrendData }) {
  const isNegativeGood = negativeIsGood.includes(trend.type);
  const isImproving = isNegativeGood
    ? trend.statistics.change < 0
    : trend.statistics.change > 0;
  const isStable = Math.abs(trend.statistics.change) < 0.5;

  const getTrendIcon = () => {
    if (isStable) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (trend.statistics.change > 0) return <TrendingUp className={`h-4 w-4 ${isImproving ? 'text-success' : 'text-destructive'}`} />;
    return <TrendingDown className={`h-4 w-4 ${isImproving ? 'text-success' : 'text-destructive'}`} />;
  };

  const getChangeColor = () => {
    if (isStable) return 'text-muted-foreground';
    return isImproving ? 'text-success' : 'text-destructive';
  };

  return (
    <Card>
      <CardHeader compact>
        <div className="flex items-center justify-between">
          <CardTitle size="sm">
            {measurementTypeLabels[trend.type] || trend.type}
          </CardTitle>
          {getTrendIcon()}
        </div>
        <CardDescription>
          {trend.statistics.count} measurements
        </CardDescription>
      </CardHeader>
      <CardContent compact>
        {/* Current Value */}
        <div className="text-center mb-4">
          <p className="text-3xl font-bold">
            {trend.statistics.latest.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {trend.unit}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">Current</p>
        </div>

        {/* Change */}
        <div className={`text-center p-2 rounded-lg bg-muted/50 mb-4 ${getChangeColor()}`}>
          <p className="text-lg font-semibold">
            {trend.statistics.change > 0 ? '+' : ''}
            {trend.statistics.change.toFixed(1)} {trend.unit}
          </p>
          <p className="text-xs">
            ({trend.statistics.changePercent > 0 ? '+' : ''}
            {trend.statistics.changePercent.toFixed(1)}% from initial)
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Initial</p>
            <p className="font-medium">{trend.statistics.earliest.toFixed(1)} {trend.unit}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-medium">{trend.statistics.average.toFixed(1)} {trend.unit}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-medium">{trend.statistics.min.toFixed(1)} {trend.unit}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-medium">{trend.statistics.max.toFixed(1)} {trend.unit}</p>
          </div>
        </div>

        {/* Simple Timeline */}
        {trend.dataPoints.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">History</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {trend.dataPoints.slice().reverse().map((point, index) => (
                <div key={point.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {new Date(point.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">{point.value.toFixed(1)} {trend.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MeasurementTrendsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinical-measurements/trends?patientId=${patientId}`);
      const data = await res.json();

      if (data.success) {
        setTrendsData(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch trends');
      }
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to fetch measurement trends');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Measurement Trends"
        description="Track changes in measurements over time"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Measurements', href: '/treatment/documentation/measurements' },
          { label: 'Trends' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push('/treatment/documentation/measurements')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Measurements
          </Button>
        }
      />

      <PageContent>
        {/* Patient Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter patient ID..."
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTrends()}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={fetchTrends} disabled={loading}>
                {loading ? 'Loading...' : 'View Trends'}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {trendsData && (
          <>
            {/* Patient Info */}
            <Card variant="ghost">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <PhiProtected fakeData={getFakeName()}>
                        {trendsData.patient.firstName} {trendsData.patient.lastName}
                      </PhiProtected>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {trendsData.totalMeasurements} measurements total
                    </p>
                  </div>
                  {trendsData.dateRange.from && trendsData.dateRange.to && (
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(trendsData.dateRange.from).toLocaleDateString()} - {new Date(trendsData.dateRange.to).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trends Grid */}
            {trendsData.trends.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No measurements found for this patient</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendsData.trends.map((trend) => (
                  <TrendCard key={trend.type} trend={trend} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!trendsData && !loading && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enter a patient ID to view measurement trends</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can find patient IDs in the patient list or from progress notes
              </p>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </>
  );
}

function MeasurementTrendsPageLoading() {
  return (
    <>
      <PageHeader
        title="Measurement Trends"
        description="Track changes in measurements over time"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </PageContent>
    </>
  );
}

export default function MeasurementTrendsPage() {
  return (
    <Suspense fallback={<MeasurementTrendsPageLoading />}>
      <MeasurementTrendsPageContent />
    </Suspense>
  );
}
