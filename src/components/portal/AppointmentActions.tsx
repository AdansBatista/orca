'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentActionsProps {
  appointmentId: string;
  status: string;
  canConfirm: boolean;
  canCancel: boolean;
  clinicPhone?: string | null;
}

export function AppointmentActions({
  appointmentId,
  status,
  canConfirm,
  canCancel,
  clinicPhone,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/portal/appointments/${appointmentId}/confirm`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to confirm appointment');
        return;
      }

      setSuccess('Appointment confirmed!');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/portal/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to cancel appointment');
        return;
      }

      setSuccess('Appointment cancelled');
      if (data.data?.warning) {
        setError(data.data.warning);
      }
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  // Show nothing if no actions available
  if (!canConfirm && !canCancel) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Success/Error messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Confirm button */}
        {canConfirm && status === 'SCHEDULED' && (
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm Attendance
              </>
            )}
          </Button>
        )}

        {/* Cancel button with dialog */}
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/5"
                size="lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancel Appointment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this appointment? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="cancel-reason">Reason (optional)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Let us know why you need to cancel..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Call clinic option */}
        {clinicPhone && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Need to reschedule? Contact us
            </p>
            <Button variant="ghost" className="w-full" asChild>
              <a href={`tel:${clinicPhone}`}>
                <Phone className="h-4 w-4 mr-2" />
                {clinicPhone}
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
