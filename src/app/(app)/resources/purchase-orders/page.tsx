'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { PurchaseOrderList } from '@/components/inventory/PurchaseOrderList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function PurchaseOrderListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="ghost">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters skeleton */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* List skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <>
      <PageHeader
        title="Purchase Orders"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Purchase Orders' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<PurchaseOrderListSkeleton />}>
          <PurchaseOrderList />
        </Suspense>
      </PageContent>
    </>
  );
}
