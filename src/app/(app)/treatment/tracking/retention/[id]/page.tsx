'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Shield,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  ChevronRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface RetentionCheck {
  id: string;
  checkDate: string;
  upperRetainerCondition: string;
  lowerRetainerCondition: string;
  stabilityStatus: string;
  complianceLevel: string;
  reportedWearHours: number | null;
  notes: string | null;
  performedBy: {
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

interface RetentionProtocol {
  id: string;
  treatmentPlanId: string;
  startDate: string;
  currentPhase: string;
  currentWearSchedule: string;
  upperRetainerType: string | null;
  lowerRetainerType: string | null;
  upperRetainerDeliveryDate: string | null;
  lowerRetainerDeliveryDate: string | null;
  bondedRetainerPlacement: string | null;
  complianceLevel: string;
  patientInstructions: string | null;
  phaseTransitionDates: Record<string, string> | null;
  nextCheckDate: string | null;
  notes: string | null;
  isActive: boolean;
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
  createdByStaff: {
    firstName: string;
    lastName: string;
    title: string | null;
  };
  retentionChecks: RetentionCheck[];
}

const phaseLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  NIGHTS_ONLY: 'Nights Only',
  ALTERNATING_NIGHTS: 'Alternating Nights',
  WEEKLY: 'Weekly',
  AS_NEEDED: 'As Needed',
  COMPLETED: 'Completed',
};

const wearScheduleLabels: Record<string, string> = {
  FULL_TIME: '22+ hours/day',
  NIGHTS_ONLY: '8-10 hours/night',
  ALTERNATING_NIGHTS: 'Every other night',
  WEEKLY: '1-2 nights/week',
  AS_NEEDED: 'As needed',
};

const complianceColors: Record<string, string> = {
  EXCELLENT: 'text-success-600 bg-success-100',
  GOOD: 'text-info-600 bg-info-100',
  FAIR: 'text-warning-600 bg-warning-100',
  POOR: 'text-destructive bg-destructive/10',
  UNKNOWN: 'text-muted-foreground bg-muted',
};

const retainerTypeLabels: Record<string, string> = {
  HAWLEY: 'Hawley Retainer',
  ESSIX: 'Essix (Clear)',
  BONDED: 'Bonded/Fixed',
  VIVERA: 'Vivera',
  ZENDURA: 'Zendura',
  OTHER: 'Other',
};

const stabilityColors: Record<string, string> = {
  STABLE: 'text-success-600',
  MINOR_RELAPSE: 'text-warning-600',
  SIGNIFICANT_RELAPSE: 'text-destructive',
  NEEDS_INTERVENTION: 'text-destructive',
};

export default function RetentionProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [protocol, setProtocol] = useState<RetentionProtocol | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProtocol = useCallback(async () => {
    try {
      const response = await fetch(`/api/retention-protocols/${id}`);
      const data = await response.json();

      if (data.success) {
        setProtocol(data.data);
      } else {
        // Use demo data
        setProtocol({
          id,
          treatmentPlanId: 'plan-1',
          startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          currentPhase: 'NIGHTS_ONLY',
          currentWearSchedule: 'NIGHTS_ONLY',
          upperRetainerType: 'ESSIX',
          lowerRetainerType: 'BONDED',
          upperRetainerDeliveryDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          lowerRetainerDeliveryDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          bondedRetainerPlacement: 'LOWER_3_TO_3',
          complianceLevel: 'EXCELLENT',
          patientInstructions: 'Wear upper retainer every night for 8+ hours. Clean with retainer cleaner weekly.',
          phaseTransitionDates: {
            FULL_TIME: new Date(Date.now() - 90 * 86400000).toISOString(),
            NIGHTS_ONLY: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          nextCheckDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          notes: 'Patient is compliant and results are stable.',
          isActive: true,
          patient: { id: '1', firstName: 'Jessica', lastName: 'Taylor' },
          treatmentPlan: { id: 'plan-1', planNumber: 'TP-2023-032', status: 'COMPLETED' },
          createdByStaff: { firstName: 'Sarah', lastName: 'Chen', title: 'Dr.' },
          retentionChecks: [
            {
              id: '1',
              checkDate: new Date(Date.now() - 30 * 86400000).toISOString(),
              upperRetainerCondition: 'GOOD',
              lowerRetainerCondition: 'GOOD',
              stabilityStatus: 'STABLE',
              complianceLevel: 'EXCELLENT',
              reportedWearHours: 9,
              notes: 'Patient reports consistent wear. No issues observed.',
              performedBy: { firstName: 'Sarah', lastName: 'Chen', title: 'Dr.' },
            },
            {
              id: '2',
              checkDate: new Date(Date.now() - 60 * 86400000).toISOString(),
              upperRetainerCondition: 'GOOD',
              lowerRetainerCondition: 'GOOD',
              stabilityStatus: 'STABLE',
              complianceLevel: 'EXCELLENT',
              reportedWearHours: 10,
              notes: 'Transitioning from full-time to nights only.',
              performedBy: { firstName: 'Sarah', lastName: 'Chen', title: 'Dr.' },
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching protocol:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProtocol();
  }, [fetchProtocol]);

  if (loading) {
    return (
      <>
        <PageHeader title="Retention Protocol" compact />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!protocol) {
    return (
      <>
        <PageHeader title="Retention Protocol" compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Protocol Not Found</p>
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

  // Calculate days in retention
  const daysInRetention = Math.floor(
    (Date.now() - new Date(protocol.startDate).getTime()) / 86400000
  );

  return (
    <>
      <PageHeader
        title="Retention Protocol"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Retention', href: '/treatment/tracking/retention' },
          { label: 'Protocol Details' },
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Check
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Protocol Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Protocol Overview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={protocol.isActive ? 'success' : 'secondary'}>
                      {protocol.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={complianceColors[protocol.complianceLevel]}>
                      {protocol.complianceLevel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{phaseLabels[protocol.currentPhase]}</p>
                    <p className="text-sm text-muted-foreground">Current Phase</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{daysInRetention}</p>
                    <p className="text-sm text-muted-foreground">Days in Retention</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{protocol.retentionChecks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Checks</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-lg font-medium">
                      {protocol.nextCheckDate
                        ? format(new Date(protocol.nextCheckDate), 'MMM d')
                        : 'Not Set'}
                    </p>
                    <p className="text-sm text-muted-foreground">Next Check</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Wear Schedule</p>
                    <p className="font-medium">
                      {wearScheduleLabels[protocol.currentWearSchedule] || protocol.currentWearSchedule}
                    </p>
                  </div>
                  {protocol.patientInstructions && (
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-700 mb-1">Patient Instructions</p>
                      <p className="text-sm text-primary-600">{protocol.patientInstructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Retainer Details */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Retainer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {protocol.upperRetainerType && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Upper Retainer</p>
                      <p className="font-medium">
                        {retainerTypeLabels[protocol.upperRetainerType] || protocol.upperRetainerType}
                      </p>
                      {protocol.upperRetainerDeliveryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivered: {format(new Date(protocol.upperRetainerDeliveryDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                  {protocol.lowerRetainerType && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Lower Retainer</p>
                      <p className="font-medium">
                        {retainerTypeLabels[protocol.lowerRetainerType] || protocol.lowerRetainerType}
                      </p>
                      {protocol.lowerRetainerDeliveryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivered: {format(new Date(protocol.lowerRetainerDeliveryDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {protocol.bondedRetainerPlacement && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Bonded Retainer:</span>{' '}
                      <span className="font-medium">{protocol.bondedRetainerPlacement.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Retention Checks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Retention Checks ({protocol.retentionChecks.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {protocol.retentionChecks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No retention checks recorded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {protocol.retentionChecks.map((check) => (
                      <div
                        key={check.id}
                        className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(check.checkDate), 'MMM d, yyyy')}
                              </span>
                              <Badge
                                className={`${stabilityColors[check.stabilityStatus]} bg-transparent`}
                              >
                                {check.stabilityStatus.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By {check.performedBy.title} {check.performedBy.firstName}{' '}
                              {check.performedBy.lastName}
                            </p>
                            {check.notes && (
                              <p className="text-sm mt-2">{check.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={complianceColors[check.complianceLevel]}>
                              {check.complianceLevel}
                            </Badge>
                            {check.reportedWearHours && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {check.reportedWearHours}h wear reported
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    {protocol.patient.firstName} {protocol.patient.lastName}
                  </p>
                </PhiProtected>
                <p className="text-sm text-muted-foreground">
                  Plan: {protocol.treatmentPlan.planNumber || protocol.treatmentPlan.id}
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/patients/${protocol.patient.id}`)}
                >
                  View Patient
                </Button>
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm font-medium">
                    {format(new Date(protocol.startDate), 'MMM d, yyyy')}
                  </span>
                </div>
                {protocol.nextCheckDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Check</span>
                    <span className="text-sm font-medium">
                      {format(new Date(protocol.nextCheckDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase History */}
            {protocol.phaseTransitionDates && Object.keys(protocol.phaseTransitionDates).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Phase History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(protocol.phaseTransitionDates)
                      .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime())
                      .map(([phase, date]) => (
                        <div key={phase} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success-600" />
                          <span className="font-medium">{phaseLabels[phase] || phase}</span>
                          <span className="text-muted-foreground">
                            - {format(new Date(date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Created By */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {protocol.createdByStaff.title} {protocol.createdByStaff.firstName}{' '}
                  {protocol.createdByStaff.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(protocol.startDate), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
