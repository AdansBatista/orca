import { cookies } from 'next/headers';
import Link from 'next/link';
import { format, isToday, isTomorrow } from 'date-fns';
import { Calendar, MessageSquare, MapPin, Activity } from 'lucide-react';
import { db } from '@/lib/db';
import { PortalCard, PortalSection, PortalListItem } from '@/components/portal';
import { Progress } from '@/components/ui/progress';

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
          patient: { select: { id: true, firstName: true, lastName: true } },
          clinic: { select: { id: true, name: true, address: true, phone: true } },
        },
      },
    },
  });

  if (!session?.account) return null;

  return {
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
    firstName: session.account.patient.firstName,
    clinic: session.account.clinic,
  };
}

async function getUpcomingAppointments(patientId: string, clinicId: string) {
  const appointments = await db.appointment.findMany({
    where: {
      patientId,
      clinicId,
      startTime: { gte: new Date() },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
    },
    include: {
      appointmentType: { select: { name: true, color: true, defaultDuration: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 3,
  });

  return appointments;
}

async function getRecentMessages(patientId: string, clinicId: string) {
  const messages = await db.message.findMany({
    where: {
      patientId,
      clinicId,
      direction: 'INBOUND',
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  return messages;
}

async function getUnreadCount(patientId: string, clinicId: string) {
  return db.message.count({
    where: {
      patientId,
      clinicId,
      direction: 'INBOUND',
      readAt: null,
    },
  });
}

async function getActiveTreatment(patientId: string, clinicId: string) {
  const plan = await db.treatmentPlan.findFirst({
    where: {
      patientId,
      clinicId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    include: {
      phases: {
        orderBy: { phaseNumber: 'asc' },
      },
    },
  });

  if (!plan) return null;

  // Calculate overall progress
  const progress =
    plan.phases.length > 0
      ? Math.round(plan.phases.reduce((sum, p) => sum + p.progressPercent, 0) / plan.phases.length)
      : 0;

  // Get current phase (first non-completed phase)
  const currentPhase = plan.phases.find(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED'
  );

  return {
    id: plan.id,
    name: plan.planName,
    progress,
    currentPhase: currentPhase?.phaseName || null,
    estimatedEndDate: plan.estimatedEndDate,
  };
}

function formatAppointmentDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export default async function PortalDashboard() {
  const session = await getPortalSession();
  if (!session) return null;

  const [appointments, messages, unreadCount, activeTreatment] = await Promise.all([
    getUpcomingAppointments(session.patientId, session.clinicId),
    getRecentMessages(session.patientId, session.clinicId),
    getUnreadCount(session.patientId, session.clinicId),
    getActiveTreatment(session.patientId, session.clinicId),
  ]);

  return (
    <div className="py-6 space-y-6">
      {/* Welcome Section */}
      <PortalSection>
        <h1 className="text-2xl font-bold mb-1">
          Hi, {session.firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome to your patient portal
        </p>
      </PortalSection>

      {/* Quick Actions */}
      <PortalSection title="Quick Actions">
        <div className="grid grid-cols-3 gap-3">
          <PortalCard href="/portal/appointments" className="text-center py-5">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="font-medium text-sm">Appointments</p>
            <p className="text-xs text-muted-foreground">
              {appointments.length} upcoming
            </p>
          </PortalCard>

          <PortalCard href="/portal/messages" className="text-center py-5">
            <div className="relative h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <p className="font-medium text-sm">Messages</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </PortalCard>

          <PortalCard href="/portal/progress" className="text-center py-5">
            <div className="h-11 w-11 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <p className="font-medium text-sm">Progress</p>
            <p className="text-xs text-muted-foreground">
              {activeTreatment ? `${activeTreatment.progress}%` : 'No plan'}
            </p>
          </PortalCard>
        </div>
      </PortalSection>

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <PortalSection
          title="Upcoming Appointments"
          action={
            <Link href="/portal/appointments" className="text-sm text-primary font-medium">
              View all
            </Link>
          }
        >
          <PortalCard>
            <div className="divide-y divide-border">
              {appointments.map((apt) => (
                <PortalListItem
                  key={apt.id}
                  href={`/portal/appointments/${apt.id}`}
                  leading={
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${apt.appointmentType?.color || '#0891b2'}20` }}
                    >
                      <Calendar
                        className="h-5 w-5"
                        style={{ color: apt.appointmentType?.color || '#0891b2' }}
                      />
                    </div>
                  }
                >
                  <p className="font-medium">{apt.appointmentType?.name || 'Appointment'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointmentDate(apt.startTime)} at {format(apt.startTime, 'h:mm a')}
                  </p>
                </PortalListItem>
              ))}
            </div>
          </PortalCard>
        </PortalSection>
      )}

      {/* Treatment Progress */}
      {activeTreatment && (
        <PortalSection
          title="Treatment Progress"
          action={
            <Link href="/portal/progress" className="text-sm text-primary font-medium">
              Details
            </Link>
          }
        >
          <PortalCard href="/portal/progress">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                <Activity className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{activeTreatment.name}</p>
                {activeTreatment.currentPhase && (
                  <p className="text-sm text-muted-foreground">
                    Current: {activeTreatment.currentPhase}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={activeTreatment.progress} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{activeTreatment.progress}%</span>
                </div>
              </div>
            </div>
            {activeTreatment.estimatedEndDate && (
              <p className="text-xs text-muted-foreground mt-3 text-right">
                Est. completion: {format(activeTreatment.estimatedEndDate, 'MMMM yyyy')}
              </p>
            )}
          </PortalCard>
        </PortalSection>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <PortalSection
          title="Recent Messages"
          action={
            <Link href="/portal/messages" className="text-sm text-primary font-medium">
              View all
            </Link>
          }
        >
          <PortalCard>
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <PortalListItem
                  key={msg.id}
                  href="/portal/messages"
                  leading={
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {!msg.readAt && (
                        <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full" />
                      )}
                    </div>
                  }
                >
                  <p className="font-medium line-clamp-1">
                    {msg.subject || 'New message'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {msg.body}
                  </p>
                </PortalListItem>
              ))}
            </div>
          </PortalCard>
        </PortalSection>
      )}

      {/* Clinic Info */}
      <PortalSection title="Your Clinic">
        <PortalCard>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{session.clinic.name}</p>
              {session.clinic.address && (
                <p className="text-sm text-muted-foreground line-clamp-2">
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
    </div>
  );
}
