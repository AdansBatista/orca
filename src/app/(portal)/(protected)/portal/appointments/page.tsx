import { cookies } from 'next/headers';
import Link from 'next/link';
import { format, isToday, isTomorrow, isPast, startOfToday } from 'date-fns';
import { Calendar, Clock, User, ChevronRight, CalendarX } from 'lucide-react';
import { db } from '@/lib/db';
import { PortalSection, PortalCard, PortalListItem, PortalEmptyState } from '@/components/portal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
        },
      },
    },
  });

  if (!session?.account) return null;

  return {
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
  };
}

async function getAppointments(patientId: string, clinicId: string, upcoming: boolean) {
  const today = startOfToday();

  const appointments = await db.appointment.findMany({
    where: {
      patientId,
      clinicId,
      startTime: upcoming ? { gte: today } : { lt: today },
      status: upcoming
        ? { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED'] }
        : { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED'] },
    },
    include: {
      appointmentType: { select: { name: true, color: true, defaultDuration: true } },
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { startTime: upcoming ? 'asc' : 'desc' },
    take: 50,
  });

  return appointments;
}

function formatAppointmentDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <Badge variant="success">Confirmed</Badge>;
    case 'SCHEDULED':
      return <Badge variant="info">Scheduled</Badge>;
    case 'ARRIVED':
      return <Badge variant="warning">Arrived</Badge>;
    case 'COMPLETED':
      return <Badge variant="soft-primary">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive">Cancelled</Badge>;
    case 'NO_SHOW':
      return <Badge variant="destructive">No Show</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Group appointments by date
function groupByDate<T extends { startTime: Date }>(appointments: T[]) {
  const groups: Map<string, T[]> = new Map();

  appointments.forEach((apt) => {
    const dateKey = format(apt.startTime, 'yyyy-MM-dd');
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, apt]);
  });

  return groups;
}

export const metadata = {
  title: 'Appointments',
};

export default async function PortalAppointmentsPage() {
  const session = await getPortalSession();
  if (!session) return null;

  const [upcoming, past] = await Promise.all([
    getAppointments(session.patientId, session.clinicId, true),
    getAppointments(session.patientId, session.clinicId, false),
  ]);

  const upcomingByDate = groupByDate(upcoming);
  const pastByDate = groupByDate(past);

  return (
    <div className="py-6">
      <PortalSection className="mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">View and manage your appointments</p>
      </PortalSection>

      <Tabs defaultValue="upcoming" className="px-4">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <PortalEmptyState
              icon={<CalendarX className="h-10 w-10 text-muted-foreground" />}
              title="No upcoming appointments"
              description="You don't have any scheduled appointments. Contact the clinic to book one."
            />
          ) : (
            <div className="space-y-6">
              {Array.from(upcomingByDate.entries()).map(([dateKey, apts]) => (
                <div key={dateKey}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                    {formatAppointmentDate(new Date(dateKey))}
                  </h3>
                  <PortalCard>
                    <div className="divide-y divide-border">
                      {apts.map((apt: {
                        id: string;
                        startTime: Date;
                        status: string;
                        appointmentType: { name: string; color: string; defaultDuration: number } | null;
                        provider: { id: string; firstName: string; lastName: string } | null;
                      }) => (
                        <PortalListItem
                          key={apt.id}
                          href={`/portal/appointments/${apt.id}`}
                          leading={
                            <div
                              className="h-12 w-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${apt.appointmentType?.color || '#0891b2'}15` }}
                            >
                              <Calendar
                                className="h-6 w-6"
                                style={{ color: apt.appointmentType?.color || '#0891b2' }}
                              />
                            </div>
                          }
                          trailing={getStatusBadge(apt.status)}
                        >
                          <p className="font-semibold">
                            {apt.appointmentType?.name || 'Appointment'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(apt.startTime, 'h:mm a')}
                            </span>
                            {apt.provider && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                Dr. {apt.provider.lastName}
                              </span>
                            )}
                          </div>
                        </PortalListItem>
                      ))}
                    </div>
                  </PortalCard>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <PortalEmptyState
              icon={<Calendar className="h-10 w-10 text-muted-foreground" />}
              title="No past appointments"
              description="Your appointment history will appear here."
            />
          ) : (
            <div className="space-y-6">
              {Array.from(pastByDate.entries()).map(([dateKey, apts]) => (
                <div key={dateKey}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                    {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <PortalCard>
                    <div className="divide-y divide-border">
                      {apts.map((apt: {
                        id: string;
                        startTime: Date;
                        status: string;
                        appointmentType: { name: string; color: string; defaultDuration: number } | null;
                        provider: { id: string; firstName: string; lastName: string } | null;
                      }) => (
                        <PortalListItem
                          key={apt.id}
                          href={`/portal/appointments/${apt.id}`}
                          leading={
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                          }
                          trailing={getStatusBadge(apt.status)}
                        >
                          <p className="font-semibold">
                            {apt.appointmentType?.name || 'Appointment'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(apt.startTime, 'h:mm a')}
                            </span>
                            {apt.provider && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                Dr. {apt.provider.lastName}
                              </span>
                            )}
                          </div>
                        </PortalListItem>
                      ))}
                    </div>
                  </PortalCard>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
