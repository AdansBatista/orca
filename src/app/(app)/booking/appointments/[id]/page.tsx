'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, PageContent } from '@/components/layout';
import { AppointmentForm } from '@/components/booking';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EditAppointmentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAppointmentPage({ params }: EditAppointmentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<{
    id: string;
    patientId: string;
    appointmentTypeId: string;
    providerId: string;
    chairId: string | null;
    startTime: string;
    duration: number;
    source: string;
    notes: string | null;
    status: string;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
  } | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/booking/appointments/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load appointment');
        }

        setAppointment(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Appointment"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Booking', href: '/booking' },
            { label: 'Edit Appointment' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <PageHeader
          title="Edit Appointment"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Booking', href: '/booking' },
            { label: 'Edit Appointment' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Appointment not found'}
            </AlertDescription>
          </Alert>
        </PageContent>
      </>
    );
  }

  // Check if appointment can be edited
  const nonEditableStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (nonEditableStatuses.includes(appointment.status)) {
    return (
      <>
        <PageHeader
          title="Edit Appointment"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Booking', href: '/booking' },
            { label: 'Edit Appointment' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This appointment cannot be edited because it has status: {appointment.status}
            </AlertDescription>
          </Alert>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Appointment"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Edit Appointment' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <AppointmentForm
          mode="edit"
          initialData={{
            id: appointment.id,
            patientId: appointment.patientId,
            appointmentTypeId: appointment.appointmentTypeId,
            providerId: appointment.providerId,
            chairId: appointment.chairId,
            startTime: new Date(appointment.startTime),
            duration: appointment.duration,
            source: appointment.source as 'STAFF' | 'PHONE' | 'ONLINE' | 'WAITLIST' | 'TREATMENT_PLAN' | 'RECALL',
            notes: appointment.notes || '',
          }}
          initialPatient={appointment.patient}
        />
      </PageContent>
    </>
  );
}
