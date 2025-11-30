'use client';

import { use } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { RoleDetail } from '@/components/roles';

interface RolePageProps {
  params: Promise<{ id: string }>;
}

export default function RolePage({ params }: RolePageProps) {
  const { id } = use(params);

  return (
    <>
      <PageHeader
        title="Role Details"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Roles', href: '/staff/roles' },
          { label: 'Details' },
        ]}
      />
      <PageContent density="comfortable">
        <RoleDetail roleId={id} />
      </PageContent>
    </>
  );
}
