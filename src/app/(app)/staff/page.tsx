'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { StaffList } from '@/components/staff';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function StaffListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <>
      <PageHeader
        title="Staff Management"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<StaffListSkeleton />}>
          <StaffList />
        </Suspense>
      </PageContent>
    </>
  );
}
