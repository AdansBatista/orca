'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';

export default function NewEquipmentPage() {
  return (
    <>
      <PageHeader
        title="Add Equipment"
        description="Register new equipment in the system"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Equipment', href: '/resources/equipment' },
          { label: 'New Equipment' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <EquipmentForm mode="create" />
      </PageContent>
    </>
  );
}
