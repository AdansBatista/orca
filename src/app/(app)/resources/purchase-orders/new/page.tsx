'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { PurchaseOrderForm } from '@/components/inventory/PurchaseOrderForm';

export default function NewPurchaseOrderPage() {
  return (
    <>
      <PageHeader
        title="New Purchase Order"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Purchase Orders', href: '/resources/purchase-orders' },
          { label: 'New Order' },
        ]}
      />
      <PageContent density="comfortable">
        <PurchaseOrderForm />
      </PageContent>
    </>
  );
}
