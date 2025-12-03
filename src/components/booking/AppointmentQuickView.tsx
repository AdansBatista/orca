'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  User,
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  Play,
  Ban,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { CalendarEvent } from './BookingCalendar';
import { toast } from 'sonner';

interface AppointmentQuickViewProps {
  event: CalendarEvent;
  onClose: () => void;
  onStatusChange?: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'default' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  ARRIVED: { label: 'Arrived', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
  NO_SHOW: { label: 'No Show', variant: 'error' },
};

export function AppointmentQuickView({ event, onClose, onStatusChange }: AppointmentQuickViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { extendedProps } = event;
  const status = extendedProps.status;
  const statusInfo = statusConfig[status] || statusConfig.SCHEDULED;

  // Status transition action
  const handleStatusAction = async (action: string, body?: object) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/booking/appointments/${extendedProps.appointmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`Appointment ${action}ed successfully`);
        onStatusChange?.();
        onClose();
      } else {
        toast.error(result.error?.message || `Failed to ${action} appointment`);
      }
    } catch {
      toast.error(`Failed to ${action} appointment`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    await handleStatusAction('cancel', { cancellationReason: cancelReason });
    setShowCancelDialog(false);
  };

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  return (
    <div className="space-y-6 py-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Badge variant={statusInfo.variant} className="text-sm">
          {statusInfo.label}
        </Badge>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: event.backgroundColor }}
        />
      </div>

      {/* Appointment Type */}
      <div>
        <h3 className="font-semibold text-lg text-foreground">
          {extendedProps.appointmentTypeName}
        </h3>
        <p className="text-sm text-muted-foreground font-mono">
          {extendedProps.appointmentTypeCode}
        </p>
      </div>

      <Separator />

      {/* Patient Info */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{extendedProps.patientName}</p>
            <Link
              href={`/patients/${extendedProps.patientId}`}
              className="text-sm text-primary hover:underline"
            >
              View Patient
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-foreground">
              {format(startDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-foreground">{extendedProps.duration} minutes</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{extendedProps.providerName}</p>
            <p className="text-sm text-muted-foreground">Provider</p>
          </div>
        </div>

        {(extendedProps.chairName || extendedProps.roomName) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              {extendedProps.chairName && (
                <p className="text-foreground">Chair: {extendedProps.chairName}</p>
              )}
              {extendedProps.roomName && (
                <p className="text-foreground">Room: {extendedProps.roomName}</p>
              )}
            </div>
          </div>
        )}

        {extendedProps.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-foreground mt-1">{extendedProps.notes}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Status Actions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Actions</p>
        <div className="flex flex-wrap gap-2">
          {/* Confirm - from SCHEDULED */}
          {status === 'SCHEDULED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('confirm')}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          )}

          {/* Check In - from SCHEDULED or CONFIRMED */}
          {['SCHEDULED', 'CONFIRMED'].includes(status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('check-in')}
              disabled={isLoading}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Check In
            </Button>
          )}

          {/* Start - from ARRIVED */}
          {status === 'ARRIVED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('start')}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {/* Complete - from IN_PROGRESS or ARRIVED */}
          {['IN_PROGRESS', 'ARRIVED'].includes(status) && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusAction('complete')}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}

          {/* No Show - from SCHEDULED or CONFIRMED */}
          {['SCHEDULED', 'CONFIRMED'].includes(status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('no-show')}
              disabled={isLoading}
              className="text-warning-600"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              No Show
            </Button>
          )}

          {/* Cancel - any non-terminal status */}
          {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={isLoading}
              className="text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Edit link */}
      <div className="pt-4 border-t">
        <Link href={`/booking/appointments/${extendedProps.appointmentId}`}>
          <Button variant="outline" className="w-full">
            Edit Appointment
          </Button>
        </Link>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormField label="Cancellation Reason" required>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation"
            />
          </FormField>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
