'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  User,
  ClipboardCheck,
  AlertCircle,
  Edit,
  CheckCircle2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface DebondReadiness {
  id: string;
  treatmentPlanId: string;
  assessmentDate: string;
  readinessScore: number;
  isReadyForDebond: boolean;
  isApproved: boolean;
  approvalDate: string | null;
  approvalNotes: string | null;
  targetDebondDate: string | null;
  actualDebondDate: string | null;
  alignmentComplete: boolean;
  occlusionCorrect: boolean;
  spaceClosure: boolean;
  rootParallelism: boolean;
  midlineCorrect: boolean;
  patientSatisfied: boolean;
  remainingItems: string[] | null;
  assessmentNotes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentPlan: {
    id: string;
    planNumber?: string;
    status: string;
  };
  assessedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
}

const criteriaLabels: Record<string, string> = {
  alignmentComplete: 'Alignment Complete',
  occlusionCorrect: 'Occlusion Correct',
  spaceClosure: 'Space Closure',
  rootParallelism: 'Root Parallelism',
  midlineCorrect: 'Midline Correct',
  patientSatisfied: 'Patient Satisfied',
};

export default function DebondReadinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<DebondReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssessment = useCallback(async () => {
    try {
      const response = await fetch(`/api/debond-readiness/${id}`);
      const data = await response.json();

      if (data.success) {
        setAssessment(data.data);
      } else {
        // Use demo data for display
        setAssessment({
          id,
          treatmentPlanId: 'plan-1',
          assessmentDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          readinessScore: 95,
          isReadyForDebond: true,
          isApproved: true,
          approvalDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          approvalNotes: 'Patient is ready for debonding. Schedule appointment.',
          targetDebondDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          actualDebondDate: null,
          alignmentComplete: true,
          occlusionCorrect: true,
          spaceClosure: true,
          rootParallelism: true,
          midlineCorrect: true,
          patientSatisfied: true,
          remainingItems: null,
          assessmentNotes: 'Excellent treatment progress. All objectives met.',
          patient: { id: '1', firstName: 'Emily', lastName: 'Wilson' },
          treatmentPlan: { id: 'plan-1', planNumber: 'TP-2023-045', status: 'IN_PROGRESS' },
          assessedBy: { id: '1', firstName: 'Sarah', lastName: 'Chen', title: 'Dr.' },
          approvedBy: { id: '2', firstName: 'Michael', lastName: 'Roberts', title: 'Dr.' },
        });
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  if (loading) {
    return (
      <>
        <PageHeader title="Debond Readiness" compact />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!assessment) {
    return (
      <>
        <PageHeader title="Debond Readiness" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Assessment Not Found</p>
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

  const criteria = [
    'alignmentComplete',
    'occlusionCorrect',
    'spaceClosure',
    'rootParallelism',
    'midlineCorrect',
    'patientSatisfied',
  ] as const;

  const completedCriteria = criteria.filter((c) => assessment[c]).length;

  return (
    <>
      <PageHeader
        title="Debond Readiness Assessment"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Debond', href: '/treatment/tracking/debond' },
          { label: 'Assessment Details' },
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
            {!assessment.isApproved && assessment.isReadyForDebond && (
              <Button>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Assessment Overview
                  </CardTitle>
                  <Badge
                    variant={
                      assessment.actualDebondDate
                        ? 'info'
                        : assessment.isApproved
                        ? 'success'
                        : assessment.isReadyForDebond
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {assessment.actualDebondDate
                      ? 'Debonded'
                      : assessment.isApproved
                      ? 'Approved'
                      : assessment.isReadyForDebond
                      ? 'Ready for Debond'
                      : 'Not Ready'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold">{assessment.readinessScore}%</p>
                    <p className="text-sm text-muted-foreground">Readiness Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-success-600">{completedCriteria}</p>
                    <p className="text-sm text-muted-foreground">Criteria Met</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">{6 - completedCriteria}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-medium">
                      {assessment.targetDebondDate
                        ? format(new Date(assessment.targetDebondDate), 'MMM d')
                        : 'Not Set'}
                    </p>
                    <p className="text-sm text-muted-foreground">Target Date</p>
                  </div>
                </div>

                {assessment.assessmentNotes && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-1">Assessment Notes</p>
                    <p className="text-sm text-muted-foreground">{assessment.assessmentNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Criteria Checklist */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Debond Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {criteria.map((criterion) => (
                    <div
                      key={criterion}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        assessment[criterion]
                          ? 'bg-success-50 border border-success-200'
                          : 'bg-destructive/5 border border-destructive/20'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          assessment[criterion] ? 'bg-success-100' : 'bg-destructive/10'
                        }`}
                      >
                        {assessment[criterion] ? (
                          <Check className="h-4 w-4 text-success-600" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <span
                        className={`font-medium ${
                          assessment[criterion] ? 'text-success-700' : 'text-destructive'
                        }`}
                      >
                        {criteriaLabels[criterion]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Remaining Items */}
            {assessment.remainingItems && assessment.remainingItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning-600" />
                    Remaining Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {assessment.remainingItems.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="text-warning-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Approval Details */}
            {assessment.isApproved && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-600" />
                    Approval Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approved By</span>
                      <span className="font-medium">
                        {assessment.approvedBy?.title} {assessment.approvedBy?.firstName}{' '}
                        {assessment.approvedBy?.lastName}
                      </span>
                    </div>
                    {assessment.approvalDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Approval Date</span>
                        <span className="font-medium">
                          {format(new Date(assessment.approvalDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {assessment.approvalNotes && (
                      <div className="p-3 bg-success-50 rounded-lg">
                        <p className="text-sm text-success-700">{assessment.approvalNotes}</p>
                      </div>
                    )}
                  </div>
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
                    {assessment.patient.firstName} {assessment.patient.lastName}
                  </p>
                </PhiProtected>
                <p className="text-sm text-muted-foreground">
                  Plan: {assessment.treatmentPlan.planNumber || assessment.treatmentPlan.id}
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/patients/${assessment.patient.id}`)}
                >
                  View Patient
                </Button>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assessment</span>
                  <span className="text-sm font-medium">
                    {format(new Date(assessment.assessmentDate), 'MMM d, yyyy')}
                  </span>
                </div>
                {assessment.targetDebondDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target Debond</span>
                    <span className="text-sm font-medium">
                      {format(new Date(assessment.targetDebondDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {assessment.actualDebondDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Actual Debond</span>
                    <span className="text-sm font-medium text-success-600">
                      {format(new Date(assessment.actualDebondDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessed By */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Assessed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {assessment.assessedBy.title} {assessment.assessedBy.firstName}{' '}
                  {assessment.assessedBy.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(assessment.assessmentDate), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
