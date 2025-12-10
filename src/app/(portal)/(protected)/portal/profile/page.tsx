import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ProfileForm } from '@/components/portal';

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
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
            },
          },
          clinic: { select: { id: true, name: true, phone: true, email: true } },
        },
      },
    },
  });

  if (!session?.account) return null;

  return session.account;
}

async function getNotificationPreferences(patientId: string, clinicId: string) {
  const prefs = await db.notificationPreference.findFirst({
    where: { patientId, clinicId },
  });

  return (
    prefs || {
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      treatmentUpdates: true,
      billingNotifications: true,
      marketingMessages: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: null,
    }
  );
}

export const metadata = {
  title: 'Profile',
};

export default async function PortalProfilePage() {
  const account = await getPortalSession();
  if (!account) return null;

  const patient = account.patient;
  const clinic = account.clinic;
  const preferences = await getNotificationPreferences(patient.id, clinic.id);

  // Prepare data for the client component
  const profileData = {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth?.toISOString() || null,
      preferredContactMethod: null as string | null, // Not available in current schema
    },
    preferences: {
      smsEnabled: preferences.smsEnabled,
      emailEnabled: preferences.emailEnabled,
      pushEnabled: preferences.pushEnabled,
      appointmentReminders: preferences.appointmentReminders,
      treatmentUpdates: preferences.treatmentUpdates,
      billingNotifications: preferences.billingNotifications,
      marketingMessages: preferences.marketingMessages,
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
      timezone: preferences.timezone,
    },
    clinic: {
      id: clinic.id,
      name: clinic.name,
      phone: clinic.phone,
      email: clinic.email,
    },
  };

  return <ProfileForm initialData={profileData} />;
}
