'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { VendorsList } from './vendors-list';

function VendorsListSkeleton() {
  return (
    <div className="space-y-6">
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-36" />
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

export default function VendorsPage() {
  return (
    <>
      <PageHeader
        title="Lab Vendors"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Vendors' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<VendorsListSkeleton />}>
          <VendorsList />
        </Suspense>
      </PageContent>
    </>
  );
}
