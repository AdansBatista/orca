'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutTemplate,
  Clock,
  Calendar,
  Gift,
  MessageSquare,
  Bell,
  Star,
  Users,
  GraduationCap,
  ClipboardList,
  Heart,
  RefreshCw,
  Zap,
  Check,
  ArrowRight,
} from 'lucide-react';

import { PageHeader, PageContent, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from 'sonner';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  triggerType: string;
  triggerEvent?: string;
  icon: React.ReactNode;
  features: string[];
  category: 'appointment' | 'engagement' | 'education' | 'marketing' | 'feedback';
  popular?: boolean;
  defaultSteps: {
    name: string;
    type: string;
    channel?: string;
    waitDuration?: number;
  }[];
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // Appointment Templates
  {
    id: 'appt-reminder-24h',
    name: '24-Hour Appointment Reminder',
    description: 'Automatically remind patients 24 hours before their scheduled appointment',
    type: 'REMINDER',
    triggerType: 'EVENT',
    triggerEvent: 'appointment.reminder',
    icon: <Bell className="h-6 w-6" />,
    features: ['Automatic timing', 'Customizable message', 'Multi-channel'],
    category: 'appointment',
    popular: true,
    defaultSteps: [
      { name: 'Send reminder', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'appt-confirmation',
    name: 'Appointment Confirmation',
    description: 'Send confirmation when patients book an appointment',
    type: 'REMINDER',
    triggerType: 'EVENT',
    triggerEvent: 'appointment.booked',
    icon: <Check className="h-6 w-6" />,
    features: ['Instant delivery', 'Calendar link', 'Directions included'],
    category: 'appointment',
    popular: true,
    defaultSteps: [
      { name: 'Send confirmation', type: 'SEND', channel: 'EMAIL' },
      { name: 'Send SMS', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'post-visit-followup',
    name: 'Post-Visit Follow-up',
    description: 'Check in with patients after their appointment',
    type: 'FOLLOW_UP',
    triggerType: 'EVENT',
    triggerEvent: 'appointment.completed',
    icon: <Heart className="h-6 w-6" />,
    features: ['Care instructions', 'Feedback request', 'Next steps'],
    category: 'appointment',
    defaultSteps: [
      { name: 'Wait 2 hours', type: 'WAIT', waitDuration: 120 },
      { name: 'Send follow-up email', type: 'SEND', channel: 'EMAIL' },
    ],
  },
  {
    id: 'no-show-recovery',
    name: 'No-Show Recovery',
    description: 'Reach out to patients who missed their appointment',
    type: 'FOLLOW_UP',
    triggerType: 'EVENT',
    triggerEvent: 'appointment.cancelled',
    icon: <RefreshCw className="h-6 w-6" />,
    features: ['Reschedule options', 'Empathetic messaging', 'Easy booking'],
    category: 'appointment',
    defaultSteps: [
      { name: 'Wait 1 hour', type: 'WAIT', waitDuration: 60 },
      { name: 'Send reschedule request', type: 'SEND', channel: 'SMS' },
      { name: 'Wait 24 hours', type: 'WAIT', waitDuration: 1440 },
      { name: 'Send follow-up email', type: 'SEND', channel: 'EMAIL' },
    ],
  },

  // Engagement Templates
  {
    id: 'welcome-sequence',
    name: 'New Patient Welcome Series',
    description: 'Welcome new patients with a series of helpful messages',
    type: 'WELCOME',
    triggerType: 'EVENT',
    triggerEvent: 'patient.created',
    icon: <Star className="h-6 w-6" />,
    features: ['Multi-step sequence', 'Practice introduction', 'First visit prep'],
    category: 'engagement',
    popular: true,
    defaultSteps: [
      { name: 'Welcome email', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 1 day', type: 'WAIT', waitDuration: 1440 },
      { name: 'Practice intro', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 2 days', type: 'WAIT', waitDuration: 2880 },
      { name: 'First visit prep', type: 'SEND', channel: 'EMAIL' },
    ],
  },
  {
    id: 'birthday-wishes',
    name: 'Birthday Greetings',
    description: 'Send personalized birthday wishes to patients',
    type: 'MARKETING',
    triggerType: 'EVENT',
    triggerEvent: 'birthday',
    icon: <Gift className="h-6 w-6" />,
    features: ['Personalized message', 'Special offers', 'Warm touch'],
    category: 'engagement',
    defaultSteps: [
      { name: 'Send birthday email', type: 'SEND', channel: 'EMAIL' },
      { name: 'Send birthday SMS', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'reactivation',
    name: 'Patient Reactivation',
    description: 'Re-engage patients who haven\'t visited in a while',
    type: 'REACTIVATION',
    triggerType: 'SCHEDULED',
    icon: <Users className="h-6 w-6" />,
    features: ['Targeted outreach', 'Special incentives', 'Easy scheduling'],
    category: 'engagement',
    defaultSteps: [
      { name: 'Send we miss you email', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 3 days', type: 'WAIT', waitDuration: 4320 },
      { name: 'Send SMS reminder', type: 'SEND', channel: 'SMS' },
      { name: 'Wait 7 days', type: 'WAIT', waitDuration: 10080 },
      { name: 'Final offer email', type: 'SEND', channel: 'EMAIL' },
    ],
  },

  // Education Templates
  {
    id: 'treatment-start',
    name: 'Treatment Getting Started',
    description: 'Educate patients when they begin a new treatment',
    type: 'EDUCATION',
    triggerType: 'EVENT',
    triggerEvent: 'treatment.started',
    icon: <GraduationCap className="h-6 w-6" />,
    features: ['Care instructions', 'What to expect', 'Tips & tricks'],
    category: 'education',
    popular: true,
    defaultSteps: [
      { name: 'Send welcome to treatment', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 2 days', type: 'WAIT', waitDuration: 2880 },
      { name: 'Send care tips', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 5 days', type: 'WAIT', waitDuration: 7200 },
      { name: 'Check-in message', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'phase-transition',
    name: 'Treatment Phase Transition',
    description: 'Guide patients through treatment phase changes',
    type: 'EDUCATION',
    triggerType: 'EVENT',
    triggerEvent: 'treatment.phase_changed',
    icon: <ArrowRight className="h-6 w-6" />,
    features: ['Phase explanation', 'New expectations', 'Updated care tips'],
    category: 'education',
    defaultSteps: [
      { name: 'Send phase update', type: 'SEND', channel: 'EMAIL' },
      { name: 'Send SMS notification', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'treatment-milestone',
    name: 'Treatment Milestone Celebration',
    description: 'Celebrate patient milestones and progress',
    type: 'EDUCATION',
    triggerType: 'EVENT',
    triggerEvent: 'treatment.milestone',
    icon: <Star className="h-6 w-6" />,
    features: ['Progress celebration', 'Encouragement', 'Next goals'],
    category: 'education',
    defaultSteps: [
      { name: 'Send milestone congrats', type: 'SEND', channel: 'EMAIL' },
      { name: 'Send SMS celebration', type: 'SEND', channel: 'SMS' },
    ],
  },

  // Feedback Templates
  {
    id: 'satisfaction-survey',
    name: 'Patient Satisfaction Survey',
    description: 'Collect feedback after appointments',
    type: 'SURVEY',
    triggerType: 'EVENT',
    triggerEvent: 'appointment.completed',
    icon: <ClipboardList className="h-6 w-6" />,
    features: ['Quick survey', 'NPS scoring', 'Review request'],
    category: 'feedback',
    popular: true,
    defaultSteps: [
      { name: 'Wait 4 hours', type: 'WAIT', waitDuration: 240 },
      { name: 'Send survey email', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 2 days', type: 'WAIT', waitDuration: 2880 },
      { name: 'Send reminder', type: 'SEND', channel: 'SMS' },
    ],
  },
  {
    id: 'treatment-complete-review',
    name: 'Treatment Completion Review',
    description: 'Request reviews when patients complete treatment',
    type: 'SURVEY',
    triggerType: 'EVENT',
    triggerEvent: 'treatment.completed',
    icon: <MessageSquare className="h-6 w-6" />,
    features: ['Google review link', 'Testimonial request', 'Referral incentive'],
    category: 'feedback',
    defaultSteps: [
      { name: 'Wait 1 day', type: 'WAIT', waitDuration: 1440 },
      { name: 'Send congrats & review request', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 3 days', type: 'WAIT', waitDuration: 4320 },
      { name: 'Send review reminder', type: 'SEND', channel: 'SMS' },
    ],
  },

  // Marketing Templates
  {
    id: 'seasonal-promo',
    name: 'Seasonal Promotion',
    description: 'Run time-limited promotional campaigns',
    type: 'MARKETING',
    triggerType: 'SCHEDULED',
    icon: <Zap className="h-6 w-6" />,
    features: ['Limited time offer', 'Urgency messaging', 'Booking CTA'],
    category: 'marketing',
    defaultSteps: [
      { name: 'Send promo announcement', type: 'SEND', channel: 'EMAIL' },
      { name: 'Wait 3 days', type: 'WAIT', waitDuration: 4320 },
      { name: 'Send reminder', type: 'SEND', channel: 'SMS' },
      { name: 'Wait 4 days', type: 'WAIT', waitDuration: 5760 },
      { name: 'Send last chance', type: 'SEND', channel: 'EMAIL' },
    ],
  },
  {
    id: 'referral-program',
    name: 'Referral Program',
    description: 'Encourage patients to refer friends and family',
    type: 'MARKETING',
    triggerType: 'EVENT',
    triggerEvent: 'treatment.completed',
    icon: <Users className="h-6 w-6" />,
    features: ['Referral rewards', 'Easy sharing', 'Tracking'],
    category: 'marketing',
    defaultSteps: [
      { name: 'Wait 7 days', type: 'WAIT', waitDuration: 10080 },
      { name: 'Send referral invite', type: 'SEND', channel: 'EMAIL' },
    ],
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  appointment: { label: 'Appointment', color: 'primary' },
  engagement: { label: 'Engagement', color: 'success' },
  education: { label: 'Education', color: 'accent' },
  feedback: { label: 'Feedback', color: 'warning' },
  marketing: { label: 'Marketing', color: 'info' },
};

export default function CampaignTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [creating, setCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleUseTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignName(template.name);
  };

  const handleCreateCampaign = async () => {
    if (!selectedTemplate || !campaignName.trim()) return;

    setCreating(true);
    try {
      // Create the campaign
      const campaignPayload = {
        name: campaignName.trim(),
        description: selectedTemplate.description,
        type: selectedTemplate.type,
        triggerType: selectedTemplate.triggerType,
        triggerEvent: selectedTemplate.triggerEvent,
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create campaign');
      }

      const campaignId = result.data.id;

      // Add the default steps
      for (const step of selectedTemplate.defaultSteps) {
        await fetch(`/api/campaigns/${campaignId}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(step),
        });
      }

      toast.success('Campaign created from template!');
      router.push(`/communications/campaigns/${campaignId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const filteredTemplates =
    categoryFilter === 'all'
      ? CAMPAIGN_TEMPLATES
      : CAMPAIGN_TEMPLATES.filter((t) => t.category === categoryFilter);

  const popularTemplates = CAMPAIGN_TEMPLATES.filter((t) => t.popular);

  return (
    <>
      <PageHeader
        title="Campaign Templates"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Campaigns', href: '/communications/campaigns' },
          { label: 'Templates' },
        ]}
        actions={
          <Link href="/communications/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-8">
          {/* Popular Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-warning-500" />
              Popular Templates
            </h2>
            <CardGrid columns={3}>
              {popularTemplates.map((template) => (
                <Card
                  key={template.id}
                  variant="bento"
                  interactive
                  className="cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardHeader compact>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle size="sm">{template.name}</CardTitle>
                        <Badge
                          variant="soft-primary"
                          size="sm"
                          className="mt-1"
                        >
                          {CATEGORY_LABELS[template.category].label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent compact className="pt-0">
                    <CardDescription className="line-clamp-2 mb-3">
                      {template.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature) => (
                        <Badge key={feature} variant="ghost" size="sm">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardGrid>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              All Templates
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
              <Button
                key={key}
                variant={categoryFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* All Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              {categoryFilter === 'all'
                ? 'All Templates'
                : `${CATEGORY_LABELS[categoryFilter].label} Templates`}
            </h2>
            <CardGrid columns={3}>
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  variant="bento"
                  interactive
                  className="cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardHeader compact>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle size="sm">{template.name}</CardTitle>
                        <Badge variant="outline" size="sm" className="mt-1">
                          {CATEGORY_LABELS[template.category].label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent compact className="pt-0">
                    <CardDescription className="line-clamp-2 mb-3">
                      {template.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {template.defaultSteps.length} step
                      {template.defaultSteps.length !== 1 && 's'}
                      {template.triggerEvent && (
                        <>
                          <span className="mx-1">·</span>
                          <Zap className="h-3 w-3" />
                          Event-triggered
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardGrid>
          </div>
        </div>
      </PageContent>

      {/* Create Campaign Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign from Template</DialogTitle>
            <DialogDescription>
              Create a new campaign based on the "{selectedTemplate?.name}" template.
              You can customize it after creation.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <Card variant="ghost">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {selectedTemplate.icon}
                    </div>
                    <div>
                      <p className="font-medium">{selectedTemplate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <FormField label="Campaign Name" required>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter a name for your campaign"
                />
              </FormField>

              <div>
                <p className="text-sm font-medium mb-2">Included Steps:</p>
                <div className="space-y-1">
                  {selectedTemplate.defaultSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      {step.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={creating || !campaignName.trim()}
            >
              {creating ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
