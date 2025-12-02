'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomForm } from '@/components/rooms/RoomForm';
import type { CreateRoomInput } from '@/lib/validations/room';

interface Room {
  id: string;
  name: string;
  roomNumber: string;
  roomType: string;
  status: string;
  floor: string | null;
  wing: string | null;
  squareFeet: number | null;
  capacity: number | null;
  isAvailable: boolean;
  capabilities: string[];
  setupNotes: string | null;
  notes: string | null;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EditRoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/resources/rooms/${roomId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch room');
        }

        setRoom(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Room"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Rooms', href: '/resources/rooms' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !room) {
    return (
      <>
        <PageHeader
          title="Edit Room"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Rooms', href: '/resources/rooms' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <Card variant="ghost" className="border-error-200 bg-error-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-600 mb-4" />
              <h3 className="font-semibold text-error-900 mb-2">Failed to load room</h3>
              <p className="text-error-700 mb-4">{error || 'Room not found'}</p>
              <div className="flex justify-center gap-3">
                <Link href="/resources/rooms">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Rooms
                  </Button>
                </Link>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  // Convert room data to form input format
  const initialData: Partial<CreateRoomInput> = {
    name: room.name,
    roomNumber: room.roomNumber,
    roomType: room.roomType as CreateRoomInput['roomType'],
    status: room.status as CreateRoomInput['status'],
    floor: room.floor,
    wing: room.wing,
    squareFeet: room.squareFeet as number | undefined,
    capacity: room.capacity as number | undefined,
    isAvailable: room.isAvailable,
    capabilities: room.capabilities || [],
    setupNotes: room.setupNotes,
    notes: room.notes,
  };

  return (
    <>
      <PageHeader
        title="Edit Room"
        description={`Editing ${room.name}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Rooms', href: '/resources/rooms' },
          { label: room.name, href: `/resources/rooms/${roomId}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <RoomForm
          mode="edit"
          roomId={roomId}
          initialData={initialData}
        />
      </PageContent>
    </>
  );
}
