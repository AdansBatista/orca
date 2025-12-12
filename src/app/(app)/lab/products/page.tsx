'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ProductsList } from './products-list';

function ProductsListSkeleton() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Product Catalog"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Products' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<ProductsListSkeleton />}>
          <ProductsList />
        </Suspense>
      </PageContent>
    </>
  );
}
