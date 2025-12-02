import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageList } from '@/components/sterilization/PackageList';

function PackageListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <>
      <PageHeader
        title="Instrument Packages"
        description="Manage sterilized instrument packages and track usage"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Packages' },
        ]}
        actions={
          <Link href="/resources/sterilization/packages/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Package
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <Suspense fallback={<PackageListSkeleton />}>
          <PackageList />
        </Suspense>
      </PageContent>
    </>
  );
}
