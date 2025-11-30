'use client';

import { Clock, MapPin, MoreHorizontal, User } from 'lucide-react';
import type { StaffShift, StaffProfile } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

type ShiftWithStaff = StaffShift & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title' | 'department'>;
};

interface ShiftCardProps {
  shift: ShiftWithStaff;
  onEdit?: (shift: ShiftWithStaff) => void;
  onDelete?: (shift: ShiftWithStaff) => void;
  onStatusChange?: (shift: ShiftWithStaff, status: string) => void;
  showStaffName?: boolean;
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary'> = {
  SCHEDULED: 'secondary',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
  SWAP_PENDING: 'warning',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  SWAP_PENDING: 'Swap Pending',
};

const shiftTypeLabels: Record<string, string> = {
  REGULAR: 'Regular',
  OVERTIME: 'Overtime',
  ON_CALL: 'On Call',
  TRAINING: 'Training',
  MEETING: 'Meeting',
  COVERAGE: 'Coverage',
  FLOAT: 'Float',
};

export function ShiftCard({
  shift,
  onEdit,
  onDelete,
  onStatusChange,
  showStaffName = true,
}: ShiftCardProps) {
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      className="relative"
      style={shift.color ? { borderLeftColor: shift.color, borderLeftWidth: 4 } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {/* Date and time */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatDate(new Date(shift.shiftDate))}
              </span>
              <span className="text-muted-foreground">
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
            </div>

            {/* Staff name */}
            {showStaffName && shift.staffProfile && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <PhiProtected fakeData={getFakeName()}>
                  {shift.staffProfile.firstName} {shift.staffProfile.lastName}
                </PhiProtected>
                {shift.staffProfile.title && (
                  <span className="text-muted-foreground">
                    • {shift.staffProfile.title}
                  </span>
                )}
              </div>
            )}

            {/* Hours */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{shift.scheduledHours.toFixed(1)} hrs scheduled</span>
              {shift.breakMinutes > 0 && (
                <span>• {shift.breakMinutes} min break</span>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              <Badge variant={statusVariants[shift.status] || 'secondary'}>
                {statusLabels[shift.status] || shift.status}
              </Badge>
              {shift.shiftType !== 'REGULAR' && (
                <Badge variant="outline">
                  {shiftTypeLabels[shift.shiftType] || shift.shiftType}
                </Badge>
              )}
            </div>

            {/* Notes */}
            {shift.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {shift.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          {(onEdit || onDelete || onStatusChange) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(shift)}>
                    Edit Shift
                  </DropdownMenuItem>
                )}
                {onStatusChange && shift.status === 'SCHEDULED' && (
                  <DropdownMenuItem onClick={() => onStatusChange(shift, 'CONFIRMED')}>
                    Confirm Shift
                  </DropdownMenuItem>
                )}
                {onStatusChange && shift.status === 'CONFIRMED' && (
                  <DropdownMenuItem onClick={() => onStatusChange(shift, 'IN_PROGRESS')}>
                    Start Shift
                  </DropdownMenuItem>
                )}
                {onStatusChange && shift.status === 'IN_PROGRESS' && (
                  <DropdownMenuItem onClick={() => onStatusChange(shift, 'COMPLETED')}>
                    Complete Shift
                  </DropdownMenuItem>
                )}
                {onDelete && shift.status !== 'COMPLETED' && (
                  <DropdownMenuItem
                    onClick={() => onDelete(shift)}
                    className="text-destructive"
                  >
                    Cancel Shift
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
