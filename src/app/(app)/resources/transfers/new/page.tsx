'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { TransferRequestForm } from '@/components/inventory/TransferRequestForm';

export default function NewTransferPage() {
  return (
    <>
      <PageHeader
        title="New Transfer Request"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Transfers', href: '/resources/transfers' },
          { label: 'New Transfer' },
        ]}
      />
      <PageContent density="comfortable">
        <TransferRequestForm mode="create" />
      </PageContent>
    </>
  );
}
