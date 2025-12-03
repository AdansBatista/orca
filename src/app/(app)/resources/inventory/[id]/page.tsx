'use client';

import { use } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { InventoryDetail } from '@/components/inventory';

interface InventoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <PageHeader
        title="Inventory Item"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Inventory', href: '/resources/inventory' },
          { label: 'Item Details' },
        ]}
      />
      <PageContent density="comfortable">
        <InventoryDetail itemId={id} />
      </PageContent>
    </>
  );
}
