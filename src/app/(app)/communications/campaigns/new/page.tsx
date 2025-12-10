'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Save,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { TRIGGER_EVENTS } from '@/lib/validations/campaigns';

type CampaignType = 'MARKETING' | 'REMINDER' | 'FOLLOW_UP' | 'SURVEY' | 'WELCOME' | 'EDUCATION';
type TriggerType = 'EVENT' | 'SCHEDULED' | 'RECURRING';

const CAMPAIGN_TYPES: { value: CampaignType; label: string; description: string }[] = [
  { value: 'REMINDER', label: 'Appointment Reminder', description: 'Automated reminders before appointments' },
  { value: 'FOLLOW_UP', label: 'Follow-up', description: 'Post-visit follow-up messages' },
  { value: 'WELCOME', label: 'Welcome Sequence', description: 'Onboarding for new patients' },
  { value: 'SURVEY', label: 'Feedback Survey', description: 'Collect patient feedback' },
  { value: 'MARKETING', label: 'Marketing', description: 'Promotional campaigns' },
  { value: 'EDUCATION', label: 'Educational', description: 'Treatment education content' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('REMINDER');
  const [triggerType, setTriggerType] = useState<TriggerType>('EVENT');
  const [triggerEvent, setTriggerEvent] = useState('appointment.booked');
  const [triggerSchedule, setTriggerSchedule] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name,
        description: description || undefined,
        type,
        triggerType,
      };

      if (triggerType === 'EVENT') {
        payload.triggerEvent = triggerEvent;
      } else if (triggerType === 'SCHEDULED') {
        payload.triggerSchedule = new Date(triggerSchedule).toISOString();
      }

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create campaign');
      }

      toast.success('Campaign created! Now add workflow steps.');
      router.push(`/communications/campaigns/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Campaign"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Campaigns', href: '/communications/campaigns' },
          { label: 'New' },
        ]}
        actions={
          <Link href="/communications/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
        }
      />

      <PageContent density="comfortable">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Campaign Details
              </CardTitle>
              <CardDescription>Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Campaign Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Appointment Reminder - 24 Hours"
                  required
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this campaign..."
                  rows={3}
                />
              </FormField>

              <FormField label="Campaign Type" required>
                <Select value={type} onValueChange={(v) => setType(v as CampaignType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <span className="font-medium">{t.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {t.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Trigger Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Trigger Configuration</CardTitle>
              <CardDescription>When should this campaign be triggered?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={triggerType}
                onValueChange={(v) => setTriggerType(v as TriggerType)}
                className="grid gap-4"
              >
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="EVENT" id="trigger-event" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="trigger-event" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium">Event-triggered</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign runs when a specific event occurs (e.g., appointment booked)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="SCHEDULED" id="trigger-scheduled" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="trigger-scheduled" className="flex items-center gap-2 cursor-pointer">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Scheduled</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign runs once at a specific date and time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="RECURRING" id="trigger-recurring" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="trigger-recurring" className="flex items-center gap-2 cursor-pointer">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <span className="font-medium">Recurring</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign runs on a regular schedule (daily, weekly, monthly)
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Event trigger config */}
              {triggerType === 'EVENT' && (
                <FormField label="Trigger Event" required>
                  <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              {/* Scheduled trigger config */}
              {triggerType === 'SCHEDULED' && (
                <FormField label="Schedule Date & Time" required>
                  <Input
                    type="datetime-local"
                    value={triggerSchedule}
                    onChange={(e) => setTriggerSchedule(e.target.value)}
                    required
                  />
                </FormField>
              )}

              {/* Recurring trigger config - simplified for now */}
              {triggerType === 'RECURRING' && (
                <Alert>
                  <AlertDescription>
                    Recurring schedule configuration will be available in the next step after creating the campaign.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/communications/campaigns">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !name}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
