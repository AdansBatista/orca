'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  LogOut,
  Building,
  Calendar,
  Check,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { PortalSection, PortalCard, PortalListItem } from '@/components/portal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';
import { useToast } from '@/components/ui/use-toast';

interface ProfileData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    preferredContactMethod: string | null;
  };
  preferences: {
    smsEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    appointmentReminders: boolean;
    treatmentUpdates: boolean;
    billingNotifications: boolean;
    marketingMessages: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    timezone: string | null;
  };
  clinic: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

interface ProfileFormProps {
  initialData: ProfileData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    email: initialData.patient.email || '',
    phone: initialData.patient.phone || '',
  });

  const patient = data.patient;
  const clinic = data.clinic;
  const preferences = data.preferences;

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const fullName = `${patient.firstName} ${patient.lastName}`;

  const handleContactSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setData((prev) => ({
          ...prev,
          patient: {
            ...prev.patient,
            email: editForm.email || null,
            phone: editForm.phone || null,
          },
        }));
        setIsEditingContact(false);
        toast({
          title: 'Contact updated',
          description: 'Your contact information has been saved.',
        });
      } else {
        toast({
          title: 'Update failed',
          description: result.error?.message || 'Failed to update contact info',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Update failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceToggle = async (
    key: keyof ProfileData['preferences'],
    value: boolean
  ) => {
    // Optimistic update
    setData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));

    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { [key]: value },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Revert on failure
        setData((prev) => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [key]: !value,
          },
        }));
        toast({
          title: 'Update failed',
          description: result.error?.message || 'Failed to update preference',
          variant: 'destructive',
        });
      }
    } catch {
      // Revert on error
      setData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: !value,
        },
      }));
      toast({
        title: 'Update failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
            <PhiProtected fakeData={getFakeName()}>{fullName}</PhiProtected>
          </h1>
          <p className="text-muted-foreground">Patient at {clinic?.name || 'Clinic'}</p>
        </div>
      </PortalSection>

      {/* Contact Information */}
      <PortalSection
        title="Contact Information"
        action={
          !isEditingContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditForm({
                  email: patient.email || '',
                  phone: patient.phone || '',
                });
                setIsEditingContact(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )
        }
      >
        <PortalCard>
          {isEditingContact ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditingContact(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleContactSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </PortalCard>
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
              <Switch
                checked={preferences.appointmentReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle('appointmentReminders', checked)
                }
              />
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
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => handlePreferenceToggle('emailEnabled', checked)}
              />
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
              <Switch
                checked={preferences.smsEnabled}
                onCheckedChange={(checked) => handlePreferenceToggle('smsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Treatment Updates</p>
                  <p className="text-sm text-muted-foreground">Progress and care updates</p>
                </div>
              </div>
              <Switch
                checked={preferences.treatmentUpdates}
                onCheckedChange={(checked) => handlePreferenceToggle('treatmentUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium">Marketing Messages</p>
                  <p className="text-sm text-muted-foreground">Promotions and newsletters</p>
                </div>
              </div>
              <Switch
                checked={preferences.marketingMessages}
                onCheckedChange={(checked) => handlePreferenceToggle('marketingMessages', checked)}
              />
            </div>
          </div>
        </PortalCard>
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
      {clinic && (
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
      )}

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
      <p className="text-xs text-muted-foreground text-center pb-4">Orca Patient Portal v1.0</p>
    </div>
  );
}
