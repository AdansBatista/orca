'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { TreatmentPlanForm } from '@/components/treatment';

export default function NewTreatmentPlanPage() {
  return (
    <>
      <PageHeader
        title="New Treatment Plan"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: 'New' },
        ]}
      />
      <PageContent density="comfortable">
        <TreatmentPlanForm mode="create" />
      </PageContent>
    </>
  );
}
