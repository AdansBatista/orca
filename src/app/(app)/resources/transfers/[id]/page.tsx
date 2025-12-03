'use client';

import { use } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { TransferDetail } from '@/components/inventory/TransferDetail';

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <PageHeader
        title="Transfer Details"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Transfers', href: '/resources/transfers' },
          { label: 'Transfer Details' },
        ]}
      />
      <PageContent density="comfortable">
        <TransferDetail transferId={id} />
      </PageContent>
    </>
  );
}
