import { cookies } from 'next/headers';
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Building,
  Calendar,
} from 'lucide-react';
import { db } from '@/lib/db';
import { PortalSection, PortalCard, PortalListItem } from '@/components/portal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';

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
          clinic: { select: { id: true, name: true } },
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

  return prefs || {
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    appointmentReminders: true,
    treatmentUpdates: true,
    billingNotifications: true,
    marketingMessages: false,
  };
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

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="py-6 space-y-6">
      {/* Profile Header */}
      <PortalSection>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">
            <PhiProtected fakeData={getFakeName()}>
              {fullName}
            </PhiProtected>
          </h1>
          <p className="text-muted-foreground">Patient at {clinic.name}</p>
        </div>
      </PortalSection>

      {/* Contact Information */}
      <PortalSection title="Contact Information">
        <PortalCard>
          <div className="divide-y divide-border">
            <PortalListItem
              leading={
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              }
              showArrow={false}
            >
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">
                <PhiProtected fakeData={getFakeEmail()}>
                  {patient.email || 'Not provided'}
                </PhiProtected>
              </p>
            </PortalListItem>

            <PortalListItem
              leading={
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              }
              showArrow={false}
            >
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">
                <PhiProtected fakeData={getFakePhone()}>
                  {patient.phone || 'Not provided'}
                </PhiProtected>
              </p>
            </PortalListItem>

            {patient.dateOfBirth && (
              <PortalListItem
                leading={
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                }
                showArrow={false}
              >
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  <PhiProtected fakeData="Jan 1, 1990">
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </PhiProtected>
                </p>
              </PortalListItem>
            )}
          </div>
        </PortalCard>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Contact the clinic to update your information
        </p>
      </PortalSection>

      {/* Notification Preferences */}
      <PortalSection title="Notifications">
        <PortalCard>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Appointment Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified before appointments</p>
                </div>
              </div>
              <Switch checked={preferences.appointmentReminders} disabled />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch checked={preferences.emailEnabled} disabled />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via text</p>
                </div>
              </div>
              <Switch checked={preferences.smsEnabled} disabled />
            </div>
          </div>
        </PortalCard>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Contact the clinic to change notification preferences
        </p>
      </PortalSection>

      {/* Security */}
      <PortalSection title="Security">
        <PortalCard>
          <div className="divide-y divide-border">
            <PortalListItem
              href="/portal/profile/change-password"
              leading={
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
              }
            >
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your login password</p>
            </PortalListItem>
          </div>
        </PortalCard>
      </PortalSection>

      {/* Clinic */}
      <PortalSection title="Your Clinic">
        <PortalCard>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{clinic.name}</p>
              <p className="text-sm text-muted-foreground">Connected Clinic</p>
            </div>
          </div>
        </PortalCard>
      </PortalSection>

      {/* Sign Out */}
      <PortalSection>
        <form action="/api/portal/auth/logout" method="POST">
          <Button type="submit" variant="outline" className="w-full" size="lg">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </form>
      </PortalSection>

      {/* Version Info */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        Orca Patient Portal v1.0
      </p>
    </div>
  );
}
