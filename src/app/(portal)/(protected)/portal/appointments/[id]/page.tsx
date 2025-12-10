import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { db } from '@/lib/db';
import { PortalSection, PortalCard, AppointmentActions } from '@/components/portal';
import { Badge } from '@/components/ui/badge';

async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('portal_session')?.value;

  if (!sessionToken) return null;

  const session = await db.portalSession.findFirst({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: {
      account: {
        include: {
          patient: { select: { id: true } },
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!session?.account) return null;

  return {
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
    clinic: session.account.clinic,
  };
}

async function getAppointment(appointmentId: string, patientId: string, clinicId: string) {
  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId,
      clinicId,
    },
    include: {
      appointmentType: {
        select: {
          name: true,
          color: true,
          defaultDuration: true,
          description: true,
        },
      },
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
        },
      },
      chair: {
        select: {
          name: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
    },
  });

  return appointment;
}

function formatAppointmentDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d, yyyy');
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return {
        badge: <Badge variant="success">Confirmed</Badge>,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        message: 'Your appointment is confirmed.',
      };
    case 'SCHEDULED':
      return {
        badge: <Badge variant="info">Scheduled</Badge>,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        message: 'Please confirm your appointment.',
      };
    case 'ARRIVED':
      return {
        badge: <Badge variant="warning">Arrived</Badge>,
        icon: <CheckCircle className="h-5 w-5 text-amber-500" />,
        message: 'You have checked in.',
      };
    case 'IN_PROGRESS':
      return {
        badge: <Badge variant="info">In Progress</Badge>,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        message: 'Your appointment is in progress.',
      };
    case 'COMPLETED':
      return {
        badge: <Badge variant="soft-primary">Completed</Badge>,
        icon: <CheckCircle className="h-5 w-5 text-primary" />,
        message: 'Thank you for visiting!',
      };
    case 'CANCELLED':
      return {
        badge: <Badge variant="destructive">Cancelled</Badge>,
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        message: 'This appointment has been cancelled.',
      };
    case 'NO_SHOW':
      return {
        badge: <Badge variant="destructive">Missed</Badge>,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        message: 'You missed this appointment. Please reschedule.',
      };
    default:
      return {
        badge: <Badge variant="outline">{status}</Badge>,
        icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
        message: '',
      };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return {
    title: 'Appointment Details',
  };
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getPortalSession();
  if (!session) return null;

  const appointment = await getAppointment(id, session.patientId, session.clinicId);
  if (!appointment) {
    notFound();
  }

  const statusInfo = getStatusInfo(appointment.status);
  const isUpcoming = !isPast(appointment.startTime);
  const canConfirm = isUpcoming && appointment.status === 'SCHEDULED';
  const canCancel = isUpcoming && ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);

  return (
    <div className="py-6 space-y-6">
      {/* Header with Status */}
      <PortalSection>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {appointment.appointmentType?.name || 'Appointment'}
            </h1>
            <p className="text-muted-foreground">
              {formatAppointmentDate(appointment.startTime)}
            </p>
          </div>
          {statusInfo.badge}
        </div>
      </PortalSection>

      {/* Status Message Card */}
      <PortalSection>
        <PortalCard
          className="border-l-4"
          style={{
            borderLeftColor: appointment.appointmentType?.color || '#0891b2',
          }}
        >
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <p className="font-medium">{statusInfo.message}</p>
              {isUpcoming && appointment.status === 'SCHEDULED' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tap the button below to confirm your attendance.
                </p>
              )}
            </div>
          </div>
        </PortalCard>
      </PortalSection>

      {/* Appointment Details */}
      <PortalSection title="Details">
        <PortalCard>
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {format(appointment.startTime, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-muted-foreground">
                  {format(appointment.startTime, 'h:mm a')} -{' '}
                  {format(appointment.endTime, 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{appointment.duration} minutes</p>
              </div>
            </div>

            {/* Provider */}
            {appointment.provider && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">
                    Dr. {appointment.provider.firstName} {appointment.provider.lastName}
                  </p>
                  {appointment.provider.title && (
                    <p className="text-sm text-muted-foreground">
                      {appointment.provider.title}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location/Room */}
            {(appointment.room || appointment.chair) && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {appointment.room?.name || appointment.chair?.name || 'Treatment Area'}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {appointment.patientNotes && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{appointment.patientNotes}</p>
                </div>
              </div>
            )}
          </div>
        </PortalCard>
      </PortalSection>

      {/* Appointment Type Description */}
      {appointment.appointmentType?.description && (
        <PortalSection title="What to Expect">
          <PortalCard>
            <p className="text-muted-foreground">
              {appointment.appointmentType.description}
            </p>
          </PortalCard>
        </PortalSection>
      )}

      {/* Clinic Information */}
      <PortalSection title="Clinic">
        <PortalCard>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{session.clinic.name}</p>
              {session.clinic.address && (
                <p className="text-sm text-muted-foreground">
                  {session.clinic.address}
                </p>
              )}
              {session.clinic.phone && (
                <a
                  href={`tel:${session.clinic.phone}`}
                  className="text-sm text-primary font-medium mt-1 inline-block"
                >
                  {session.clinic.phone}
                </a>
              )}
            </div>
          </div>
        </PortalCard>
      </PortalSection>

      {/* Actions */}
      {(canConfirm || canCancel) && (
        <PortalSection title="Actions">
          <PortalCard>
            <AppointmentActions
              appointmentId={appointment.id}
              status={appointment.status}
              canConfirm={canConfirm}
              canCancel={canCancel}
              clinicPhone={session.clinic.phone}
            />
          </PortalCard>
        </PortalSection>
      )}
    </div>
  );
}
