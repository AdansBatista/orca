'use client';

import { use } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { PurchaseOrderDetail } from '@/components/inventory/PurchaseOrderDetail';

interface PurchaseOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <PageHeader
        title="Purchase Order"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Purchase Orders', href: '/resources/purchase-orders' },
          { label: 'Order Details' },
        ]}
      />
      <PageContent density="comfortable">
        <PurchaseOrderDetail orderId={id} />
      </PageContent>
    </>
  );
}
