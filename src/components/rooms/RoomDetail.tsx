'use client';

import {
  DoorOpen,
  Settings,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { DashboardGrid } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChairSection } from './ChairSection';

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

interface RoomDetailProps {
  room: Room;
  onRefresh: () => void;
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

export function RoomDetail({ room, onRefresh }: RoomDetailProps) {
  return (
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
        <ChairSection
          roomId={room.id}
          chairs={room.chairs || []}
          onRefresh={onRefresh}
        />

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
  );
}
