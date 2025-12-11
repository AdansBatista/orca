'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { TreatmentPlanForm } from '@/components/treatment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreateTreatmentPlanInput } from '@/lib/validations/treatment';

interface TreatmentPlanData {
  id: string;
  planNumber: string;
  planName: string;
  planType: string | null;
  status: string;
  patientId: string;
  chiefComplaint: string | null;
  diagnosis: string[];
  treatmentGoals: string[];
  treatmentDescription: string | null;
  primaryProviderId: string | null;
  supervisingProviderId: string | null;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  totalFee: number | null;
  startDate: string | null;
  estimatedEndDate: string | null;
}

export default function EditTreatmentPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [plan, setPlan] = useState<TreatmentPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/treatment-plans/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment plan');
        }

        setPlan(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Treatment Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !plan) {
    return (
      <>
        <PageHeader
          title="Edit Treatment Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Plan</h3>
              <p className="text-muted-foreground mb-4">{error || 'Treatment plan not found'}</p>
              <Link href="/treatment/plans">
                <Button variant="outline">Back to Plans</Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  // Check if plan can be edited
  if (['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(plan.status)) {
    return (
      <>
        <PageHeader
          title="Edit Treatment Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: plan.planNumber },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cannot Edit Plan</h3>
              <p className="text-muted-foreground mb-4">
                This treatment plan is {plan.status.toLowerCase()} and cannot be edited.
              </p>
              <Link href={`/treatment/plans/${id}`}>
                <Button variant="outline">View Plan</Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const initialData: Partial<CreateTreatmentPlanInput> = {
    patientId: plan.patientId,
    planName: plan.planName,
    planType: plan.planType,
    status: plan.status as CreateTreatmentPlanInput['status'],
    chiefComplaint: plan.chiefComplaint,
    diagnosis: plan.diagnosis,
    treatmentGoals: plan.treatmentGoals,
    treatmentDescription: plan.treatmentDescription,
    primaryProviderId: plan.primaryProviderId,
    supervisingProviderId: plan.supervisingProviderId,
    estimatedDuration: plan.estimatedDuration,
    estimatedVisits: plan.estimatedVisits,
    totalFee: plan.totalFee,
    startDate: plan.startDate ? new Date(plan.startDate) : undefined,
    estimatedEndDate: plan.estimatedEndDate ? new Date(plan.estimatedEndDate) : undefined,
  };

  return (
    <>
      <PageHeader
        title={`Edit ${plan.planNumber}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable">
        <TreatmentPlanForm initialData={initialData} planId={id} mode="edit" />
      </PageContent>
    </>
  );
}
