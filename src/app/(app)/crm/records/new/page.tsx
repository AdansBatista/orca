'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { NewRecordsRequestForm } from './new-records-request-form';

function FormSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewRecordsRequestPage() {
  return (
    <>
      <PageHeader
        title="New Records Request"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Records', href: '/crm/records' },
          { label: 'New Request' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<FormSkeleton />}>
          <NewRecordsRequestForm />
        </Suspense>
      </PageContent>
    </>
  );
}
