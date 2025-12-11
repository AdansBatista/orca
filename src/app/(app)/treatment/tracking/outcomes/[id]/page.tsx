'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Edit,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  FileText,
  Target,
  Activity,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface TreatmentOutcome {
  id: string;
  treatmentPlanId: string;
  assessmentDate: string;
  overallRating: string;
  aestheticRating: string;
  functionalRating: string;
  periodontalRating: string | null;
  patientSatisfaction: number | null;
  treatmentGoalsAchieved: string[] | null;
  treatmentGoalsPartiallyAchieved: string[] | null;
  treatmentGoalsNotAchieved: string[] | null;
  complications: string[] | null;
  unexpectedOutcomes: string | null;
  lessonsLearned: string | null;
  initialCondition: string | null;
  finalCondition: string | null;
  totalTreatmentDays: number | null;
  totalVisits: number | null;
  missedAppointments: number | null;
  summary: string | null;
  recommendations: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  treatmentPlan: {
    id: string;
    planNumber?: string;
    status: string;
    objectives?: string;
    startDate?: string;
    actualEndDate?: string;
  };
  assessedBy: {
    firstName: string;
    lastName: string;
    title: string | null;
  };
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

export default function TreatmentOutcomeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [outcome, setOutcome] = useState<TreatmentOutcome | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutcome = useCallback(async () => {
    try {
      const response = await fetch(`/api/treatment-outcomes/${id}`);
      const data = await response.json();

      if (data.success) {
        setOutcome(data.data);
      } else {
        // Use demo data
        setOutcome({
          id,
          treatmentPlanId: 'plan-1',
          assessmentDate: new Date(Date.now() - 14 * 86400000).toISOString(),
          overallRating: 'EXCELLENT',
          aestheticRating: 'EXCELLENT',
          functionalRating: 'EXCELLENT',
          periodontalRating: 'GOOD',
          patientSatisfaction: 10,
          treatmentGoalsAchieved: [
            'Correct Class II malocclusion',
            'Close spacing in upper arch',
            'Improve facial profile',
            'Achieve proper overjet and overbite',
          ],
          treatmentGoalsPartiallyAchieved: ['Minor rotation correction on lower 2nd premolar'],
          treatmentGoalsNotAchieved: null,
          complications: null,
          unexpectedOutcomes: 'Treatment completed 2 months ahead of schedule',
          lessonsLearned: 'Patient compliance with elastics was exceptional, contributing to faster treatment time.',
          initialCondition: 'Class II Division 1 malocclusion with 8mm overjet, moderate crowding',
          finalCondition: 'Class I occlusion, ideal overjet and overbite, aligned arches',
          totalTreatmentDays: 548,
          totalVisits: 24,
          missedAppointments: 1,
          summary: 'Excellent treatment outcome with all primary goals achieved. Patient is extremely satisfied with both functional and aesthetic results.',
          recommendations: 'Full-time retainer wear for 6 months, then transition to nights only. Annual follow-up recommended.',
          patient: { id: '1', firstName: 'James', lastName: 'Anderson', dateOfBirth: '1995-06-15' },
          treatmentPlan: {
            id: 'plan-1',
            planNumber: 'TP-2022-089',
            status: 'COMPLETED',
            objectives: 'Correct Class II malocclusion, close spacing, improve profile',
            startDate: new Date(Date.now() - 548 * 86400000).toISOString(),
            actualEndDate: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
          assessedBy: { firstName: 'Sarah', lastName: 'Chen', title: 'Dr.' },
        });
      }
    } catch (error) {
      console.error('Error fetching outcome:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOutcome();
  }, [fetchOutcome]);

  if (loading) {
    return (
      <>
        <PageHeader title="Treatment Outcome" compact />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!outcome) {
    return (
      <>
        <PageHeader title="Treatment Outcome" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Outcome Not Found</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Treatment Outcome"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Outcomes', href: '/treatment/tracking/outcomes' },
          { label: 'Details' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ratings Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Outcome Assessment
                  </CardTitle>
                  <Badge className={ratingColors[outcome.overallRating]}>
                    {ratingLabels[outcome.overallRating]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div
                      className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        ratingColors[outcome.overallRating]
                      }`}
                    >
                      {ratingIcons[outcome.overallRating]}
                    </div>
                    <p className="text-sm font-medium">{ratingLabels[outcome.overallRating]}</p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div
                      className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        ratingColors[outcome.aestheticRating]
                      }`}
                    >
                      {ratingIcons[outcome.aestheticRating]}
                    </div>
                    <p className="text-sm font-medium">{ratingLabels[outcome.aestheticRating]}</p>
                    <p className="text-xs text-muted-foreground">Aesthetic</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div
                      className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        ratingColors[outcome.functionalRating]
                      }`}
                    >
                      {ratingIcons[outcome.functionalRating]}
                    </div>
                    <p className="text-sm font-medium">{ratingLabels[outcome.functionalRating]}</p>
                    <p className="text-xs text-muted-foreground">Functional</p>
                  </div>
                  {outcome.periodontalRating && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div
                        className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          ratingColors[outcome.periodontalRating]
                        }`}
                      >
                        {ratingIcons[outcome.periodontalRating]}
                      </div>
                      <p className="text-sm font-medium">{ratingLabels[outcome.periodontalRating]}</p>
                      <p className="text-xs text-muted-foreground">Periodontal</p>
                    </div>
                  )}
                </div>

                {outcome.patientSatisfaction !== null && (
                  <div className="p-4 bg-warning-50 rounded-lg flex items-center justify-center gap-2">
                    <Star className="h-6 w-6 text-warning-500 fill-current" />
                    <span className="text-2xl font-bold">{outcome.patientSatisfaction}</span>
                    <span className="text-muted-foreground">/10 Patient Satisfaction</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {outcome.summary && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{outcome.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Treatment Goals */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Treatment Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {outcome.treatmentGoalsAchieved && outcome.treatmentGoalsAchieved.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-success-700 mb-2">
                      Achieved ({outcome.treatmentGoalsAchieved.length})
                    </p>
                    <ul className="space-y-1">
                      {outcome.treatmentGoalsAchieved.map((goal, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-success-600">✓</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {outcome.treatmentGoalsPartiallyAchieved &&
                  outcome.treatmentGoalsPartiallyAchieved.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-warning-700 mb-2">
                        Partially Achieved ({outcome.treatmentGoalsPartiallyAchieved.length})
                      </p>
                      <ul className="space-y-1">
                        {outcome.treatmentGoalsPartiallyAchieved.map((goal, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-warning-600">~</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {outcome.treatmentGoalsNotAchieved &&
                  outcome.treatmentGoalsNotAchieved.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-destructive mb-2">
                        Not Achieved ({outcome.treatmentGoalsNotAchieved.length})
                      </p>
                      <ul className="space-y-1">
                        {outcome.treatmentGoalsNotAchieved.map((goal, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-destructive">✗</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Condition Comparison */}
            {(outcome.initialCondition || outcome.finalCondition) && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Condition Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outcome.initialCondition && (
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Initial Condition</p>
                        <p className="text-sm text-muted-foreground">{outcome.initialCondition}</p>
                      </div>
                    )}
                    {outcome.finalCondition && (
                      <div className="p-4 border border-success-200 bg-success-50 rounded-lg">
                        <p className="text-sm font-medium text-success-700 mb-2">Final Condition</p>
                        <p className="text-sm text-success-600">{outcome.finalCondition}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {(outcome.unexpectedOutcomes || outcome.lessonsLearned || outcome.recommendations) && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {outcome.unexpectedOutcomes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Unexpected Outcomes</p>
                      <p className="text-sm text-muted-foreground">{outcome.unexpectedOutcomes}</p>
                    </div>
                  )}
                  {outcome.lessonsLearned && (
                    <div>
                      <p className="text-sm font-medium mb-1">Lessons Learned</p>
                      <p className="text-sm text-muted-foreground">{outcome.lessonsLearned}</p>
                    </div>
                  )}
                  {outcome.recommendations && (
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-700 mb-1">Recommendations</p>
                      <p className="text-sm text-primary-600">{outcome.recommendations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhiProtected fakeData={getFakeName()}>
                  <p className="font-medium">
                    {outcome.patient.firstName} {outcome.patient.lastName}
                  </p>
                </PhiProtected>
                <p className="text-sm text-muted-foreground">
                  Plan: {outcome.treatmentPlan.planNumber || outcome.treatmentPlan.id}
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/patients/${outcome.patient.id}`)}
                >
                  View Patient
                </Button>
              </CardContent>
            </Card>

            {/* Treatment Stats */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Treatment Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outcome.totalTreatmentDays && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{outcome.totalTreatmentDays} days</span>
                  </div>
                )}
                {outcome.totalVisits && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Visits</span>
                    <span className="font-medium">{outcome.totalVisits}</span>
                  </div>
                )}
                {outcome.missedAppointments !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Missed Appts</span>
                    <span className={`font-medium ${outcome.missedAppointments > 3 ? 'text-warning-600' : ''}`}>
                      {outcome.missedAppointments}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outcome.treatmentPlan.startDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">
                      {format(new Date(outcome.treatmentPlan.startDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {outcome.treatmentPlan.actualEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium">
                      {format(new Date(outcome.treatmentPlan.actualEndDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assessment</span>
                  <span className="text-sm font-medium">
                    {format(new Date(outcome.assessmentDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Assessed By */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Assessed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {outcome.assessedBy.title} {outcome.assessedBy.firstName}{' '}
                  {outcome.assessedBy.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(outcome.assessmentDate), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
