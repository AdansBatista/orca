'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { RoleForm } from '@/components/roles';

export default function NewRolePage() {
  return (
    <>
      <PageHeader
        title="Create Role"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Roles', href: '/staff/roles' },
          { label: 'Create' },
        ]}
      />
      <PageContent density="comfortable" maxWidth="2xl">
        <RoleForm mode="create" />
      </PageContent>
    </>
  );
}
