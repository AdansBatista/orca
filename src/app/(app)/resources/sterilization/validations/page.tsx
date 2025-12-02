'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { ValidationList } from '@/components/sterilization/ValidationList';

function ValidationListFallback() {
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
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function SterilizationValidationsPage() {
  return (
    <>
      <PageHeader
        title="Equipment Validation"
        description="Track sterilizer validation, calibration, and maintenance records"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Validations' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/resources/sterilization/validations/schedules">
              <Button variant="outline">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Schedules
              </Button>
            </Link>
            <Link href="/resources/sterilization/validations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Validation
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <Suspense fallback={<ValidationListFallback />}>
          <ValidationList />
        </Suspense>
      </PageContent>
    </>
  );
}
