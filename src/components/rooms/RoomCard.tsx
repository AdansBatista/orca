'use client';

import Link from 'next/link';
import { DoorOpen, Armchair, Package, Settings } from 'lucide-react';
import type { Room, RoomType, RoomStatus } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RoomWithCounts = Room & {
  _count: {
    chairs: number;
    roomEquipment: number;
  };
};

interface RoomCardProps {
  room: RoomWithCounts;
}

const roomTypeLabels: Record<RoomType, string> = {
  OPERATORY: 'Operatory',
  CONSULTATION: 'Consultation',
  X_RAY: 'X-Ray',
  STERILIZATION: 'Sterilization',
  LAB: 'Lab',
  STORAGE: 'Storage',
  RECEPTION: 'Reception',
  OFFICE: 'Office',
};

const roomTypeColors: Record<RoomType, 'default' | 'info' | 'warning' | 'success' | 'accent' | 'secondary' | 'soft-primary' | 'soft-secondary' | 'soft-accent'> = {
  OPERATORY: 'default',
  CONSULTATION: 'info',
  X_RAY: 'warning',
  STERILIZATION: 'success',
  LAB: 'accent',
  STORAGE: 'secondary',
  RECEPTION: 'soft-primary',
  OFFICE: 'soft-secondary',
};

const statusVariants: Record<RoomStatus, 'success' | 'warning' | 'error' | 'secondary'> = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  CLOSED: 'error',
  RENOVATION: 'secondary',
};

const statusLabels: Record<RoomStatus, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  CLOSED: 'Closed',
  RENOVATION: 'Renovation',
};

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/resources/rooms/${room.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <DoorOpen className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">{room.roomNumber}</p>
                </div>
              </div>
              <Badge variant={statusVariants[room.status]} dot>
                {statusLabels[room.status]}
              </Badge>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={roomTypeColors[room.roomType]}>
                {roomTypeLabels[room.roomType]}
              </Badge>
              {room.floor && (
                <Badge variant="outline">{room.floor}</Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Armchair className="h-4 w-4" />
                <span>{room._count.chairs} chair{room._count.chairs !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>{room._count.roomEquipment} equipment</span>
              </div>
            </div>

            {/* Capabilities */}
            {room.capabilities && room.capabilities.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {room.capabilities.slice(0, 3).join(', ')}
                  {room.capabilities.length > 3 && ` +${room.capabilities.length - 3} more`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
