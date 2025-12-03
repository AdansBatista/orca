'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader, PageContent } from '@/components/layout';
import { AppointmentForm } from '@/components/booking';
import { Skeleton } from '@/components/ui/skeleton';

function NewAppointmentContent() {
  const searchParams = useSearchParams();

  // Get preselected values from URL params
  const dateParam = searchParams.get('date');
  const providerParam = searchParams.get('provider');

  const preselectedDate = dateParam ? new Date(dateParam) : undefined;

  return (
    <AppointmentForm
      mode="create"
      preselectedDate={preselectedDate}
      preselectedProviderId={providerParam || undefined}
    />
  );
}

function NewAppointmentSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <>
      <PageHeader
        title="New Appointment"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'New Appointment' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <Suspense fallback={<NewAppointmentSkeleton />}>
          <NewAppointmentContent />
        </Suspense>
      </PageContent>
    </>
  );
}
