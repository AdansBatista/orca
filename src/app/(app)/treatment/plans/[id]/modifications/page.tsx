'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Plus,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  User,
  Calendar,
  GitBranch,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlanModification {
  id: string;
  modificationType: string;
  modificationDate: string;
  previousVersion: number;
  newVersion: number;
  createsNewVersion: boolean;
  changeDescription: string;
  reason: string;
  feeChangeAmount: number | null;
  requiresAcknowledgment: boolean;
  acknowledgedAt: string | null;
  modifiedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  acknowledgedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface Version {
  version: number;
  createdAt: string;
  isInitial: boolean;
  modificationType: string | null;
  changeDescription: string;
  reason?: string;
  modifiedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  feeChange?: number | null;
  requiresAcknowledgment?: boolean;
  acknowledgedAt?: string | null;
}

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  version: number;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const modificationTypeLabels: Record<string, string> = {
  MINOR_ADJUSTMENT: 'Minor Adjustment',
  PHASE_ADDITION: 'Phase Addition',
  PHASE_REMOVAL: 'Phase Removal',
  APPLIANCE_CHANGE: 'Appliance Change',
  DURATION_EXTENSION: 'Duration Extension',
  DURATION_REDUCTION: 'Duration Reduction',
  TREATMENT_UPGRADE: 'Treatment Upgrade',
  TREATMENT_DOWNGRADE: 'Treatment Downgrade',
  FEE_ADJUSTMENT: 'Fee Adjustment',
  PROVIDER_CHANGE: 'Provider Change',
  GOAL_MODIFICATION: 'Goal Modification',
  CLINICAL_PROTOCOL: 'Clinical Protocol',
  OTHER: 'Other',
};

const modificationTypeVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  MINOR_ADJUSTMENT: 'secondary',
  PHASE_ADDITION: 'info',
  PHASE_REMOVAL: 'warning',
  APPLIANCE_CHANGE: 'destructive',
  DURATION_EXTENSION: 'warning',
  DURATION_REDUCTION: 'info',
  TREATMENT_UPGRADE: 'success',
  TREATMENT_DOWNGRADE: 'warning',
  FEE_ADJUSTMENT: 'warning',
  PROVIDER_CHANGE: 'secondary',
  GOAL_MODIFICATION: 'info',
  CLINICAL_PROTOCOL: 'info',
  OTHER: 'secondary',
};

export default function PlanModificationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [modifications, setModifications] = useState<PlanModification[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch treatment plan
        const planRes = await fetch(`/api/treatment-plans/${id}`);
        const planData = await planRes.json();
        if (planData.success) {
          setTreatmentPlan(planData.data);
        }

        // Fetch modifications
        const modsRes = await fetch(`/api/treatment-plans/${id}/modifications?pageSize=100`);
        const modsData = await modsRes.json();
        if (modsData.success) {
          setModifications(modsData.data.items);
        }

        // Fetch versions
        const versionsRes = await fetch(`/api/treatment-plans/${id}/versions`);
        const versionsData = await versionsRes.json();
        if (versionsData.success) {
          setVersions(versionsData.data.versions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const pendingAcknowledgments = modifications.filter(
    (m) => m.requiresAcknowledgment && !m.acknowledgedAt
  );

  if (loading) {
    return (
      <>
        <PageHeader
          title="Plan Modifications"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...', href: `/treatment/plans/${id}` },
            { label: 'Modifications' },
          ]}
        />
        <PageContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!treatmentPlan) {
    return (
      <>
        <PageHeader title="Plan Not Found" compact />
        <PageContent>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Treatment plan not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/plans')}
              >
                Back to Plans
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
        title="Plan Modifications"
        description={`${treatmentPlan.planName} (v${treatmentPlan.version})`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: treatmentPlan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Modifications' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/treatment/plans/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plan
            </Button>
            <Button onClick={() => router.push(`/treatment/plans/${id}/modifications/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              New Modification
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Pending Acknowledgments Alert */}
        {pendingAcknowledgments.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium">Pending Acknowledgments</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingAcknowledgments.length} modification{pendingAcknowledgments.length !== 1 ? 's' : ''} require patient acknowledgment
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('pending')}
                >
                  View Pending
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{treatmentPlan.version}</p>
                  <p className="text-sm text-muted-foreground">Current Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <History className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modifications.length}</p>
                  <p className="text-sm text-muted-foreground">Total Modifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {modifications.filter((m) => m.acknowledgedAt).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Acknowledged</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingAcknowledgments.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="history">Modification History</TabsTrigger>
            <TabsTrigger value="versions">Version Timeline</TabsTrigger>
            {pendingAcknowledgments.length > 0 && (
              <TabsTrigger value="pending" className="relative">
                Pending
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-warning text-warning-foreground rounded-full">
                  {pendingAcknowledgments.length}
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Modification History Tab */}
          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {modifications.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No modifications yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push(`/treatment/plans/${id}/modifications/new`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Modification
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {modifications.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/treatment/plans/${id}/modifications/${mod.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={modificationTypeVariants[mod.modificationType] || 'secondary'}>
                                {modificationTypeLabels[mod.modificationType] || mod.modificationType}
                              </Badge>
                              {mod.createsNewVersion && (
                                <Badge variant="outline" className="text-xs">
                                  v{mod.previousVersion} → v{mod.newVersion}
                                </Badge>
                              )}
                              {mod.requiresAcknowledgment && !mod.acknowledgedAt && (
                                <Badge variant="warning" className="text-xs">
                                  Needs Acknowledgment
                                </Badge>
                              )}
                              {mod.acknowledgedAt && (
                                <Badge variant="success" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{mod.changeDescription}</p>
                            <p className="text-sm text-muted-foreground mt-1">{mod.reason}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {mod.modifiedBy.title ? `${mod.modifiedBy.title} ` : ''}
                                {mod.modifiedBy.firstName} {mod.modifiedBy.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(mod.modificationDate).toLocaleDateString()}
                              </span>
                              {mod.feeChangeAmount !== null && mod.feeChangeAmount !== 0 && (
                                <span className={`flex items-center gap-1 ${mod.feeChangeAmount > 0 ? 'text-destructive' : 'text-success'}`}>
                                  <DollarSign className="h-3 w-3" />
                                  {mod.feeChangeAmount > 0 ? '+' : ''}
                                  ${mod.feeChangeAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Version Timeline Tab */}
          <TabsContent value="versions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Version Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {versions.map((version, index) => (
                      <div key={version.version} className="relative pl-10">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                            index === versions.length - 1
                              ? 'bg-primary border-primary'
                              : 'bg-background border-muted-foreground'
                          }`}
                        />

                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={index === versions.length - 1 ? 'default' : 'secondary'}>
                              Version {version.version}
                            </Badge>
                            {version.isInitial && (
                              <Badge variant="outline" className="text-xs">Initial</Badge>
                            )}
                            {version.modificationType && (
                              <Badge variant={modificationTypeVariants[version.modificationType] || 'secondary'} className="text-xs">
                                {modificationTypeLabels[version.modificationType]}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{version.changeDescription}</p>
                          {version.reason && (
                            <p className="text-sm text-muted-foreground mt-1">{version.reason}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {version.modifiedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {version.modifiedBy.firstName} {version.modifiedBy.lastName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(version.createdAt).toLocaleDateString()}
                            </span>
                            {version.feeChange !== null && version.feeChange !== undefined && version.feeChange !== 0 && (
                              <span className={`flex items-center gap-1 ${version.feeChange > 0 ? 'text-destructive' : 'text-success'}`}>
                                <DollarSign className="h-3 w-3" />
                                {version.feeChange > 0 ? '+' : ''}${version.feeChange.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Acknowledgments Tab */}
          {pendingAcknowledgments.length > 0 && (
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Pending Acknowledgments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pendingAcknowledgments.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/treatment/plans/${id}/modifications/${mod.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={modificationTypeVariants[mod.modificationType] || 'secondary'}>
                                {modificationTypeLabels[mod.modificationType] || mod.modificationType}
                              </Badge>
                              {mod.createsNewVersion && (
                                <Badge variant="outline" className="text-xs">
                                  v{mod.previousVersion} → v{mod.newVersion}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{mod.changeDescription}</p>
                            <p className="text-sm text-muted-foreground mt-1">{mod.reason}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(mod.modificationDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Record Acknowledgment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </PageContent>
    </>
  );
}
