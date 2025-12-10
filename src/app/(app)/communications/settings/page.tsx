'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  MessageSquare,
  Mail,
  Bell,
  Clock,
  Shield,
  Globe,
  Save,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function CommunicationsSettingsPage() {
  const [saving, setSaving] = useState(false);

  // SMS Settings
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsFromNumber, setSmsFromNumber] = useState('+1 (555) 123-4567');

  // Email Settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailFromName, setEmailFromName] = useState('Smile Orthodontics');
  const [emailFromAddress, setEmailFromAddress] = useState('noreply@smileortho.com');
  const [emailReplyTo, setEmailReplyTo] = useState('contact@smileortho.com');

  // Notification Defaults
  const [defaultReminderTime, setDefaultReminderTime] = useState('24');
  const [autoConfirmationEnabled, setAutoConfirmationEnabled] = useState(true);
  const [doubleOptInRequired, setDoubleOptInRequired] = useState(false);

  // Quiet Hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement settings save API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Communication Settings"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Settings' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-3xl space-y-6">
          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle>SMS Settings</CardTitle>
                  <CardDescription>Configure SMS messaging via Twilio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending SMS messages to patients
                  </p>
                </div>
                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
              </div>

              <Separator />

              <FormField label="SMS From Number">
                <Input
                  value={smsFromNumber}
                  onChange={(e) => setSmsFromNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={!smsEnabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This number is configured in your Twilio account
                </p>
              </FormField>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  SMS provider credentials are stored securely in environment variables.
                  Contact your administrator to update Twilio settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-accent-600" />
                </div>
                <div>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Configure email messaging via SendGrid</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending email messages to patients
                  </p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="From Name">
                  <Input
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    placeholder="Your Practice Name"
                    disabled={!emailEnabled}
                  />
                </FormField>

                <FormField label="From Address">
                  <Input
                    type="email"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    placeholder="noreply@yourpractice.com"
                    disabled={!emailEnabled}
                  />
                </FormField>
              </div>

              <FormField label="Reply-To Address">
                <Input
                  type="email"
                  value={emailReplyTo}
                  onChange={(e) => setEmailReplyTo(e.target.value)}
                  placeholder="contact@yourpractice.com"
                  disabled={!emailEnabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Replies from patients will be sent to this address
                </p>
              </FormField>
            </CardContent>
          </Card>

          {/* Notification Defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <CardTitle>Notification Defaults</CardTitle>
                  <CardDescription>Default settings for patient notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Default Reminder Time">
                <Select value={defaultReminderTime} onValueChange={setDefaultReminderTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="4">4 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                    <SelectItem value="72">72 hours before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Default time for appointment reminders
                </p>
              </FormField>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-send Confirmations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send booking confirmations
                  </p>
                </div>
                <Switch
                  checked={autoConfirmationEnabled}
                  onCheckedChange={setAutoConfirmationEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Double Opt-In Required</Label>
                    <Badge variant="outline" size="sm">
                      Compliance
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Require patients to confirm marketing consent
                  </p>
                </div>
                <Switch
                  checked={doubleOptInRequired}
                  onCheckedChange={setDoubleOptInRequired}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <CardTitle>Quiet Hours</CardTitle>
                  <CardDescription>
                    Prevent messages from being sent during specific hours
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Defer non-urgent messages during quiet hours
                  </p>
                </div>
                <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
              </div>

              {quietHoursEnabled && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Start Time">
                      <Input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                      />
                    </FormField>
                    <FormField label="End Time">
                      <Input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Messages scheduled during quiet hours will be sent when quiet hours end
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Timezone</CardTitle>
                  <CardDescription>Used for scheduling and quiet hours</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormField label="Clinic Timezone">
                <Select defaultValue="America/New_York">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
