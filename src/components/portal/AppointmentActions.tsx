'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  CalendarClock,
  Calendar,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reschedule form state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [preferredDate1, setPreferredDate1] = useState('');
  const [preferredDate2, setPreferredDate2] = useState('');
  const [preferredDate3, setPreferredDate3] = useState('');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState('ANY');
  const [rescheduleReason, setRescheduleReason] = useState('');

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
    } catch {
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
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = async () => {
    // Validate at least one date is selected
    const dates = [preferredDate1, preferredDate2, preferredDate3].filter(Boolean);
    if (dates.length === 0) {
      setError('Please select at least one preferred date');
      return;
    }
    if (!rescheduleReason.trim()) {
      setError('Please provide a reason for rescheduling');
      return;
    }

    setIsRescheduling(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/portal/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredDates: dates,
          preferredTimeOfDay,
          reason: rescheduleReason,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to submit reschedule request');
        return;
      }

      setSuccess(data.data?.message || 'Reschedule request submitted!');
      setRescheduleOpen(false);
      // Reset form
      setPreferredDate1('');
      setPreferredDate2('');
      setPreferredDate3('');
      setPreferredTimeOfDay('ANY');
      setRescheduleReason('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

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

        {/* Reschedule button with dialog */}
        {canCancel && (
          <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-12 text-base" size="lg">
                <CalendarClock className="h-5 w-5 mr-2" />
                Request Reschedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Request Reschedule</DialogTitle>
                <DialogDescription>
                  Let us know your preferred dates and we&apos;ll contact you to confirm a new
                  time.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason for rescheduling <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Why do you need to reschedule?"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Preferred dates <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Select up to 3 dates that work for you
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        min={minDate}
                        value={preferredDate1}
                        onChange={(e) => setPreferredDate1(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        min={minDate}
                        value={preferredDate2}
                        onChange={(e) => setPreferredDate2(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        min={minDate}
                        value={preferredDate3}
                        onChange={(e) => setPreferredDate3(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-preference">Preferred time of day</Label>
                  <Select value={preferredTimeOfDay} onValueChange={setPreferredTimeOfDay}>
                    <SelectTrigger id="time-preference">
                      <SelectValue placeholder="Select time preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any time</SelectItem>
                      <SelectItem value="MORNING">Morning (8am-12pm)</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon (12pm-5pm)</SelectItem>
                      <SelectItem value="EVENING">Evening (5pm-8pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setRescheduleOpen(false)}
                  disabled={isRescheduling}
                >
                  Cancel
                </Button>
                <Button onClick={handleReschedule} disabled={isRescheduling}>
                  {isRescheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              Need help? Contact us
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
