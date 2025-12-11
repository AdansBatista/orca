'use client';

import { Suspense } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressNoteList } from '@/components/treatment/documentation';

function ProgressNotesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-16" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ProgressNotesPage() {
  return (
    <>
      <PageHeader
        title="Progress Notes"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Progress Notes' },
        ]}
      />
      <PageContent density="comfortable">
        <Suspense fallback={<ProgressNotesLoading />}>
          <ProgressNoteList />
        </Suspense>
      </PageContent>
    </>
  );
}
