'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Armchair,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';

interface PatientDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  appointmentId?: string;
  currentStage?: string;
  onAction?: () => void;
}

interface PatientDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
}

interface AppointmentDetails {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  appointmentType: {
    name: string;
    code: string;
  } | null;
  provider: {
    firstName: string;
    lastName: string;
  } | null;
}

const STAGE_ACTIONS: Record<string, { label: string; endpoint: string; nextLabel: string }> = {
  CHECKED_IN: { label: 'Call Patient', endpoint: '/api/ops/flow/call', nextLabel: 'Called' },
  WAITING: { label: 'Call Patient', endpoint: '/api/ops/flow/call', nextLabel: 'Called' },
  CALLED: { label: 'Seat Patient', endpoint: '/api/ops/flow/seat', nextLabel: 'In Chair' },
  IN_CHAIR: { label: 'Complete', endpoint: '/api/ops/flow/complete', nextLabel: 'Completed' },
  COMPLETED: { label: 'Check Out', endpoint: '/api/ops/flow/check-out', nextLabel: 'Checked Out' },
};

export function PatientDetailSheet({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  currentStage,
  onAction,
}: PatientDetailSheetProps) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch patient details when sheet opens
  useEffect(() => {
    if (open && patientId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          // Fetch patient details
          const patientRes = await fetch(`/api/patients/${patientId}`);
          const patientResult = await patientRes.json();
          if (patientResult.success) {
            setPatient(patientResult.data);
          }

          // Fetch appointment if provided
          if (appointmentId) {
            const apptRes = await fetch(`/api/booking/appointments/${appointmentId}`);
            const apptResult = await apptRes.json();
            if (apptResult.success) {
              setAppointment(apptResult.data);
            }
          }
        } catch {
          toast.error('Failed to load patient details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [open, patientId, appointmentId]);

  // Handle action (call, seat, complete, checkout)
  const handleAction = async () => {
    if (!currentStage || !appointmentId) return;

    const action = STAGE_ACTIONS[currentStage];
    if (!action) return;

    // For seat action, we need chair selection - just close and let parent handle it
    if (currentStage === 'CALLED') {
      toast.info('Please select a chair to seat the patient');
      onOpenChange(false);
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(action.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Patient moved to ${action.nextLabel}`);
        onAction?.();
        onOpenChange(false);
      } else {
        toast.error(result.error?.message || 'Action failed');
      }
    } catch {
      toast.error('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const currentAction = currentStage ? STAGE_ACTIONS[currentStage] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            Patient Details
          </SheetTitle>
          <SheetDescription>
            View patient information and appointment details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : patient ? (
            <>
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    <PhiProtected fakeData={getFakeName()}>
                      {patient.firstName} {patient.lastName}
                    </PhiProtected>
                  </h3>
                  {patient.dateOfBirth && (
                    <p className="text-sm text-muted-foreground">
                      DOB:{' '}
                      <PhiProtected fakeData="01/01/1990">
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </PhiProtected>
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium">Contact Information</h4>
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <PhiProtected fakeData={getFakePhone()}>
                      {patient.phone}
                    </PhiProtected>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <PhiProtected fakeData={getFakeEmail()}>
                      {patient.email}
                    </PhiProtected>
                  </div>
                )}
                {!patient.phone && !patient.email && (
                  <p className="text-sm text-muted-foreground">
                    No contact information on file
                  </p>
                )}
              </div>

              {/* Appointment Info */}
              {appointment && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium">Today&apos;s Appointment</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(appointment.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(appointment.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(appointment.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge variant="outline" size="sm">
                        {appointment.duration} min
                      </Badge>
                    </div>
                    {appointment.appointmentType && (
                      <div className="flex items-center gap-2">
                        <Badge variant="soft-primary">
                          {appointment.appointmentType.name}
                        </Badge>
                      </div>
                    )}
                    {appointment.provider && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Dr. {appointment.provider.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current Stage */}
              {currentStage && (
                <div className="space-y-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Current Stage</h4>
                    <Badge variant="soft-primary">
                      {currentStage.replace('_', ' ')}
                    </Badge>
                  </div>

                  {currentAction && (
                    <Button
                      className="w-full"
                      onClick={handleAction}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        'Processing...'
                      ) : (
                        <>
                          {currentStage === 'CALLED' ? (
                            <Armchair className="h-4 w-4 mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          {currentAction.label}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Patient not found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
