'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { TreatmentPlanList } from '@/components/treatment';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function TreatmentPlansPage() {
  return (
    <>
      <PageHeader
        title="Treatment Plans"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<LoadingState />}>
          <TreatmentPlanList />
        </Suspense>
      </PageContent>
    </>
  );
}
