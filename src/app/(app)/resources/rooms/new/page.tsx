'use client';

import { PageHeader, PageContent } from '@/components/layout';
import { RoomForm } from '@/components/rooms/RoomForm';

export default function NewRoomPage() {
  return (
    <>
      <PageHeader
        title="Add Room"
        description="Register a new room in the clinic"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Rooms', href: '/resources/rooms' },
          { label: 'New Room' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <RoomForm mode="create" />
      </PageContent>
    </>
  );
}
