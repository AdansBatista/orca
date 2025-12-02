'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  DoorOpen,
  Armchair,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  Wrench,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChairForm } from '@/components/rooms/ChairForm';

interface TreatmentChair {
  id: string;
  name: string;
  chairNumber: string;
  status: string;
  condition: string;
  manufacturer: string | null;
  modelNumber: string | null;
  hasDeliveryUnit: boolean;
  hasSuction: boolean;
  hasLight: boolean;
  nextMaintenanceDate: string | null;
}

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
  createdAt: string;
  updatedAt: string;
  chairs: TreatmentChair[];
}

function LoadingSkeleton() {
  return (
    <DashboardGrid>
      <DashboardGrid.TwoThirds className="space-y-6">
        {[1, 2, 3].map((i) => (
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
      </DashboardGrid.TwoThirds>
      <DashboardGrid.OneThird>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </DashboardGrid.OneThird>
    </DashboardGrid>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'MAINTENANCE':
      return 'warning';
    case 'CLOSED':
      return 'destructive';
    case 'RENOVATION':
      return 'info';
    default:
      return 'secondary';
  }
}

function getChairStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'IN_REPAIR':
      return 'warning';
    case 'OUT_OF_SERVICE':
      return 'destructive';
    case 'RETIRED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getConditionVariant(condition: string) {
  switch (condition) {
    case 'EXCELLENT':
      return 'success';
    case 'GOOD':
      return 'info';
    case 'FAIR':
      return 'warning';
    case 'POOR':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    OPERATORY: 'Operatory',
    CONSULTATION: 'Consultation',
    X_RAY: 'X-Ray',
    STERILIZATION: 'Sterilization',
    LAB: 'Lab',
    STORAGE: 'Storage',
    RECEPTION: 'Reception',
    OFFICE: 'Office',
  };
  return labels[type] || type;
}

function getCapabilityLabel(capability: string) {
  const labels: Record<string, string> = {
    XRAY: 'X-Ray',
    ORTHO: 'Orthodontics',
    SCANNING: '3D Scanning',
    IMPRESSIONS: 'Impressions',
    PHOTOGRAPHY: 'Photography',
    RETAINERS: 'Retainer Fabrication',
    BONDING: 'Bonding',
    DEBONDING: 'Debonding',
    ADJUSTMENTS: 'Adjustments',
    CONSULTATIONS: 'Consultations',
  };
  return labels[capability] || capability;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [chairFormOpen, setChairFormOpen] = useState(false);

  const fetchRoom = useCallback(async () => {
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
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/resources/rooms/${roomId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete room');
      }

      router.push('/resources/rooms');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
      setDeleting(false);
    }
  };

  const handleDeleteChair = async (chairId: string) => {
    try {
      const response = await fetch(`/api/resources/rooms/${roomId}/chairs/${chairId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete chair');
      }

      fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chair');
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Room Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Rooms', href: '/resources/rooms' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !room) {
    return (
      <>
        <PageHeader
          title="Room Details"
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

  return (
    <>
      <PageHeader
        title={room.name}
        description={`Room ${room.roomNumber} - ${getRoomTypeLabel(room.roomType)}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Rooms', href: '/resources/rooms' },
          { label: room.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href={`/resources/rooms/${roomId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Room</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{room.name}&rdquo;? This will also delete
                    all treatment chairs in this room. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-error-600 hover:bg-error-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Room Name</p>
                  <p className="font-medium">{room.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room Number</p>
                  <p className="font-medium font-mono">{room.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getRoomTypeLabel(room.roomType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(room.status)} className="mt-1">
                    {room.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <Badge
                    variant={room.isAvailable ? 'success' : 'secondary'}
                    className="mt-1 gap-1"
                  >
                    {room.isAvailable ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Unavailable
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Physical Details */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Physical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-medium">{room.floor || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wing</p>
                  <p className="font-medium">{room.wing || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Square Feet</p>
                  <p className="font-medium">
                    {room.squareFeet ? `${room.squareFeet} sq ft` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{room.capacity || 1}</p>
                </div>
              </CardContent>
            </Card>

            {/* Capabilities */}
            {room.capabilities && room.capabilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {room.capabilities.map((cap) => (
                      <Badge key={cap} variant="soft-primary">
                        {getCapabilityLabel(cap)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Treatment Chairs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Armchair className="h-4 w-4" />
                  Treatment Chairs
                </CardTitle>
                <Button size="sm" onClick={() => setChairFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Chair
                </Button>
              </CardHeader>
              <CardContent>
                {room.chairs && room.chairs.length > 0 ? (
                  <div className="space-y-3">
                    {room.chairs.map((chair) => (
                      <div
                        key={chair.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{chair.name}</span>
                            <span className="text-sm text-muted-foreground font-mono">
                              ({chair.chairNumber})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getChairStatusVariant(chair.status)} size="sm">
                              {chair.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getConditionVariant(chair.condition)} size="sm">
                              {chair.condition}
                            </Badge>
                            {chair.manufacturer && (
                              <span className="text-xs text-muted-foreground">
                                {chair.manufacturer}
                                {chair.modelNumber && ` - ${chair.modelNumber}`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {chair.hasDeliveryUnit && <span>Delivery Unit</span>}
                            {chair.hasSuction && <span>Suction</span>}
                            {chair.hasLight && <span>Light</span>}
                          </div>
                          {chair.nextMaintenanceDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                              <Wrench className="h-3 w-3" />
                              <span>
                                Next maintenance:{' '}
                                {new Date(chair.nextMaintenanceDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-error-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chair</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &ldquo;{chair.name}&rdquo;? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteChair(chair.id)}
                                className="bg-error-600 hover:bg-error-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Armchair className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No treatment chairs in this room</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setChairFormOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Chair
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {(room.setupNotes || room.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {room.setupNotes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Setup Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{room.setupNotes}</p>
                    </div>
                  )}
                  {room.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">General Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{room.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-primary-600">
                    {room.chairs?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Treatment Chairs</p>
                </div>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-accent-600">
                    {room.capabilities?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Capabilities</p>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card variant="ghost">
              <CardHeader>
                <CardTitle size="sm">Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>

      {/* Chair Form Modal */}
      <ChairForm
        open={chairFormOpen}
        onOpenChange={setChairFormOpen}
        roomId={roomId}
        mode="create"
        onSuccess={fetchRoom}
      />
    </>
  );
}
