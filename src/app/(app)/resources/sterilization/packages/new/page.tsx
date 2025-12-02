'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { PackageForm } from '@/components/sterilization/PackageForm';
import { Skeleton } from '@/components/ui/skeleton';

function NewPackageContent() {
  const searchParams = useSearchParams();
  const cycleId = searchParams.get('cycleId') || undefined;

  return <PackageForm cycleId={cycleId} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

export default function NewPackagePage() {
  return (
    <>
      <PageHeader
        title="Create Instrument Package"
        description="Create a new sterilized instrument package"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Packages', href: '/resources/sterilization/packages' },
          { label: 'New Package' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<FormSkeleton />}>
            <NewPackageContent />
          </Suspense>
        </div>
      </PageContent>
    </>
  );
}
