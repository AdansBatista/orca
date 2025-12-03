'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { InventoryForm } from '@/components/inventory';

export default function NewInventoryItemPage() {
  return (
    <>
      <PageHeader
        title="Add Inventory Item"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Inventory', href: '/resources/inventory' },
          { label: 'Add Item' },
        ]}
      />
      <PageContent density="comfortable">
        <InventoryForm mode="create" />
      </PageContent>
    </>
  );
}
