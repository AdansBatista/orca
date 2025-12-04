'use client';

import { Suspense } from 'react';
import { AppointmentsListContent } from './AppointmentsListContent';
import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function AppointmentsListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Date Navigation Skeleton */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-48 ml-2" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </CardContent>
      </Card>

      {/* Filters Skeleton */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentsListPage() {
  return (
    <>
      <PageHeader
        title="Appointments"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Appointments' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<AppointmentsListSkeleton />}>
          <AppointmentsListContent />
        </Suspense>
      </PageContent>
    </>
  );
}
