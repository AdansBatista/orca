'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { PatientList } from '@/components/patients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function PatientListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <>
      <PageHeader
        title="Patients"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<PatientListSkeleton />}>
          <PatientList />
        </Suspense>
      </PageContent>
    </>
  );
}
