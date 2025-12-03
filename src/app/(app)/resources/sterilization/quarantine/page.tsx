'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { QuarantineManager } from '@/components/sterilization/QuarantineManager';

export default function QuarantinePage() {
  return (
    <>
      <PageHeader
        title="Quarantine Management"
        description="Manage packages pending biological indicator test results"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Quarantine' },
        ]}
      />
      <PageContent density="comfortable">
        <QuarantineManager />
      </PageContent>
    </>
  );
}
