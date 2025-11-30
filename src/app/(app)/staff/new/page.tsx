'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { StaffProfileForm } from '@/components/staff';

export default function NewStaffPage() {
  return (
    <>
      <PageHeader
        title="Add Staff Member"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'New Staff' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <StaffProfileForm mode="create" />
      </PageContent>
    </>
  );
}
