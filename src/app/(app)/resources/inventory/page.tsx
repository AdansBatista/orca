'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { InventoryList } from '@/components/inventory';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function InventoryListSkeleton() {
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
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Items grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Inventory' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<InventoryListSkeleton />}>
          <InventoryList />
        </Suspense>
      </PageContent>
    </>
  );
}
