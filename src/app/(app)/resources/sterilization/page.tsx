'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { CycleList } from '@/components/sterilization/CycleList';

function CycleListFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-14 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SterilizationPage() {
  return (
    <>
      <PageHeader
        title="Sterilization & Compliance"
        description="Track and manage sterilization cycles and compliance"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization' },
        ]}
        actions={
          <Link href="/resources/sterilization/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Cycle
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <Suspense fallback={<CycleListFallback />}>
          <CycleList />
        </Suspense>
      </PageContent>
    </>
  );
}
