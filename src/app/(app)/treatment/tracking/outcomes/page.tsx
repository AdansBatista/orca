'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  BarChart3,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface TreatmentOutcome {
  id: string;
  treatmentPlanId: string;
  planNumber: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assessmentDate: string;
  overallRating: string;
  aestheticRating: string;
  functionalRating: string;
  patientSatisfaction: number | null;
  totalTreatmentDays: number | null;
  totalVisits: number | null;
  summary: string | null;
}

const ratingColors: Record<string, string> = {
  EXCELLENT: 'text-success-600 bg-success-100',
  GOOD: 'text-info-600 bg-info-100',
  ACCEPTABLE: 'text-warning-600 bg-warning-100',
  POOR: 'text-destructive bg-destructive/10',
  NOT_EVALUATED: 'text-muted-foreground bg-muted',
};

const ratingLabels: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  ACCEPTABLE: 'Acceptable',
  POOR: 'Poor',
  NOT_EVALUATED: 'Not Evaluated',
};

const ratingIcons: Record<string, React.ReactNode> = {
  EXCELLENT: <Star className="h-5 w-5 fill-current" />,
  GOOD: <ThumbsUp className="h-5 w-5" />,
  ACCEPTABLE: <Minus className="h-5 w-5" />,
  POOR: <ThumbsDown className="h-5 w-5" />,
  NOT_EVALUATED: <Minus className="h-5 w-5" />,
};

export default function TreatmentOutcomesPage() {
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<TreatmentOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOutcomes = async () => {
      try {
        const response = await fetch('/api/treatment-outcomes?pageSize=50');
        const data = await response.json();

        if (data.success) {
          setOutcomes(data.data.items);
        } else {
          // Use demo data
          setOutcomes([
            {
              id: '1',
              treatmentPlanId: 'plan-1',
              planNumber: 'TP-2022-089',
              patient: { id: '1', firstName: 'James', lastName: 'Anderson' },
              assessmentDate: new Date(Date.now() - 14 * 86400000).toISOString(),
              overallRating: 'EXCELLENT',
              aestheticRating: 'EXCELLENT',
              functionalRating: 'EXCELLENT',
              patientSatisfaction: 10,
              totalTreatmentDays: 548,
              totalVisits: 24,
              summary: 'Treatment completed successfully with excellent results.',
            },
            {
              id: '2',
              treatmentPlanId: 'plan-2',
              planNumber: 'TP-2022-095',
              patient: { id: '2', firstName: 'Jennifer', lastName: 'Clark' },
              assessmentDate: new Date(Date.now() - 30 * 86400000).toISOString(),
              overallRating: 'GOOD',
              aestheticRating: 'EXCELLENT',
              functionalRating: 'GOOD',
              patientSatisfaction: 9,
              totalTreatmentDays: 620,
              totalVisits: 28,
              summary: 'Good results achieved with minor occlusal refinements needed.',
            },
            {
              id: '3',
              treatmentPlanId: 'plan-3',
              planNumber: 'TP-2022-078',
              patient: { id: '3', firstName: 'Thomas', lastName: 'Robinson' },
              assessmentDate: new Date(Date.now() - 60 * 86400000).toISOString(),
              overallRating: 'ACCEPTABLE',
              aestheticRating: 'GOOD',
              functionalRating: 'ACCEPTABLE',
              patientSatisfaction: 7,
              totalTreatmentDays: 730,
              totalVisits: 32,
              summary: 'Acceptable results. Patient compliance was a challenge.',
            },
            {
              id: '4',
              treatmentPlanId: 'plan-4',
              planNumber: 'TP-2023-012',
              patient: { id: '4', firstName: 'Rachel', lastName: 'Moore' },
              assessmentDate: new Date(Date.now() - 7 * 86400000).toISOString(),
              overallRating: 'EXCELLENT',
              aestheticRating: 'EXCELLENT',
              functionalRating: 'GOOD',
              patientSatisfaction: 10,
              totalTreatmentDays: 456,
              totalVisits: 20,
              summary: 'Outstanding aesthetic results. Patient extremely satisfied.',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching outcomes:', error);
        // Set empty array on error
        setOutcomes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomes();
  }, []);

  const filteredOutcomes = outcomes.filter((outcome) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = `${outcome.patient.firstName} ${outcome.patient.lastName}`.toLowerCase();
      if (!patientName.includes(query) && !outcome.planNumber.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Rating filter
    if (ratingFilter !== 'all' && outcome.overallRating !== ratingFilter) return false;

    return true;
  });

  // Summary stats
  const totalOutcomes = outcomes.length;
  const excellentCount = outcomes.filter((o) => o.overallRating === 'EXCELLENT').length;
  const goodCount = outcomes.filter((o) => o.overallRating === 'GOOD').length;
  const avgSatisfaction =
    outcomes.length > 0
      ? Math.round(
          (outcomes
            .filter((o) => o.patientSatisfaction !== null)
            .reduce((sum, o) => sum + (o.patientSatisfaction || 0), 0) /
            outcomes.filter((o) => o.patientSatisfaction !== null).length) *
            10
        ) / 10
      : 0;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Treatment Outcomes"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Tracking', href: '/treatment/tracking' },
            { label: 'Outcomes' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Treatment Outcomes"
        description="Review and analyze treatment results"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Outcomes' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <PageContent density="comfortable">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{totalOutcomes}</p>
              <p className="text-sm text-muted-foreground">Total Outcomes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success-600">{excellentCount}</p>
              <p className="text-sm text-muted-foreground">Excellent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-info-600">{goodCount}</p>
              <p className="text-sm text-muted-foreground">Good</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-warning-500 fill-current" />
                <p className="text-3xl font-bold">{avgSatisfaction}</p>
              </div>
              <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="mb-6">
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            <div className="flex gap-4">
              {['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'POOR'].map((rating) => {
                const count = outcomes.filter((o) => o.overallRating === rating).length;
                const percentage = totalOutcomes > 0 ? Math.round((count / totalOutcomes) * 100) : 0;
                return (
                  <div key={rating} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{ratingLabels[rating]}</span>
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rating === 'EXCELLENT'
                            ? 'bg-success-500'
                            : rating === 'GOOD'
                            ? 'bg-info-500'
                            : rating === 'ACCEPTABLE'
                            ? 'bg-warning-500'
                            : 'bg-destructive'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">{count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or plan numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="ACCEPTABLE">Acceptable</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Outcomes List */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Treatment Outcomes ({filteredOutcomes.length})
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            {filteredOutcomes.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">No Outcomes Found</p>
                <p className="text-muted-foreground">
                  {searchQuery || ratingFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No treatment outcomes have been recorded'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOutcomes.map((outcome) => (
                  <Link key={outcome.id} href={`/treatment/tracking/outcomes/${outcome.id}`}>
                    <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            ratingColors[outcome.overallRating]
                          }`}
                        >
                          {ratingIcons[outcome.overallRating]}
                        </div>
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium">
                              {outcome.patient.firstName} {outcome.patient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-sm text-muted-foreground">{outcome.planNumber}</p>
                          {outcome.summary && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {outcome.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(outcome.assessmentDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {outcome.totalTreatmentDays && (
                              <span className="text-xs text-muted-foreground">
                                {outcome.totalTreatmentDays} days
                              </span>
                            )}
                            {outcome.totalVisits && (
                              <span className="text-xs text-muted-foreground">
                                {outcome.totalVisits} visits
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={ratingColors[outcome.overallRating]}>
                            {ratingLabels[outcome.overallRating]}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {outcome.patientSatisfaction !== null && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning-500 fill-current" />
                            <span className="text-sm font-medium">{outcome.patientSatisfaction}/10</span>
                          </div>
                        )}
                        <div className="flex gap-2 text-xs">
                          <span className={ratingColors[outcome.aestheticRating].split(' ')[0]}>
                            Aesthetic: {ratingLabels[outcome.aestheticRating]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
