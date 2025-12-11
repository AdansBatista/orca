'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader, PageContent } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressNoteEditor } from '@/components/treatment/documentation';

function EditorLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function NewProgressNoteContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || undefined;
  const treatmentPlanId = searchParams.get('treatmentPlanId') || undefined;
  const appointmentId = searchParams.get('appointmentId') || undefined;

  return (
    <ProgressNoteEditor
      mode="create"
      patientId={patientId}
      treatmentPlanId={treatmentPlanId}
      appointmentId={appointmentId}
    />
  );
}

function NewProgressNotePageContent() {
  return (
    <>
      <PageHeader
        title="New Progress Note"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Progress Notes', href: '/treatment/documentation/notes' },
          { label: 'New Note' },
        ]}
      />
      <PageContent density="comfortable">
        <NewProgressNoteContent />
      </PageContent>
    </>
  );
}

export default function NewProgressNotePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewProgressNotePageContent />
    </Suspense>
  );
}
