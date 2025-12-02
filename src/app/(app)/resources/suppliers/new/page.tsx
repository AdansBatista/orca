'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { SupplierForm } from '@/components/suppliers/SupplierForm';

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader
        title="Add Supplier"
        description="Register a new supplier in the system"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Suppliers', href: '/resources/suppliers' },
          { label: 'New Supplier' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <SupplierForm mode="create" />
      </PageContent>
    </>
  );
}
