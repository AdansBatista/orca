'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  FileText,
  Edit,
  MoreVertical,
  UserPlus,
  Send,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';
import { ListActivity } from '@/components/ui/list-item';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  preferredContact: string;
  source: string;
  sourceDetails: string | null;
  status: string;
  stage: string;
  primaryConcern: string | null;
  treatmentInterest: string | null;
  urgency: string | null;
  patientType: string;
  patientAge: number | null;
  isMinor: boolean;
  guardianName: string | null;
  consultationDate: string | null;
  consultationNotes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  referringDentist: {
    id: string;
    practiceName: string;
    firstName: string;
    lastName: string;
  } | null;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: string;
    performedBy: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    assignedTo: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  formSubmissions: Array<{
    id: string;
    createdAt: string;
    template: {
      id: string;
      name: string;
      type: string;
    } | null;
  }>;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  performedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

const stageBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary'> = {
  INQUIRY: 'secondary',
  CONTACTED: 'info',
  CONSULTATION_SCHEDULED: 'warning',
  CONSULTATION_COMPLETED: 'soft-primary',
  PENDING_DECISION: 'warning',
  TREATMENT_ACCEPTED: 'success',
  TREATMENT_STARTED: 'success',
  LOST: 'destructive',
};

const stageLabels: Record<string, string> = {
  INQUIRY: 'Inquiry',
  CONTACTED: 'Contacted',
  CONSULTATION_SCHEDULED: 'Consultation Scheduled',
  CONSULTATION_COMPLETED: 'Consultation Completed',
  PENDING_DECISION: 'Pending Decision',
  TREATMENT_ACCEPTED: 'Treatment Accepted',
  TREATMENT_STARTED: 'Treatment Started',
  LOST: 'Lost',
};

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Website',
  PHONE_CALL: 'Phone Call',
  WALK_IN: 'Walk-in',
  REFERRAL_DENTIST: 'Dentist Referral',
  REFERRAL_PATIENT: 'Patient Referral',
  SOCIAL_MEDIA: 'Social Media',
  GOOGLE_ADS: 'Google Ads',
  INSURANCE_DIRECTORY: 'Insurance Directory',
  OTHER: 'Other',
};

const activityIcons: Record<string, typeof MessageSquare> = {
  NOTE: MessageSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
  STATUS_CHANGE: Target,
  FORM_SUBMITTED: FileText,
  SYSTEM: Clock,
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      setLoading(true);
      setError(null);

      try {
        const [leadRes, activitiesRes] = await Promise.all([
          fetch(`/api/leads/${resolvedParams.id}`),
          fetch(`/api/leads/${resolvedParams.id}/activities?limit=10`),
        ]);

        const leadResult = await leadRes.json();
        const activitiesResult = await activitiesRes.json();

        if (!leadResult.success) {
          throw new Error(leadResult.error?.message || 'Failed to fetch lead');
        }

        setLead(leadResult.data);
        if (activitiesResult.success) {
          setActivities(activitiesResult.data.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [resolvedParams.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const response = await fetch(`/api/leads/${resolvedParams.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          title: 'Note added',
          description: newNote.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setActivities((prev) => [result.data, ...prev]);
        setNewNote('');
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleConvert = async () => {
    try {
      const response = await fetch(`/api/leads/${resolvedParams.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/patients/${result.data.patient.id}`);
      }
    } catch {
      // Handle error
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'CRM', href: '/crm' },
            { label: 'Leads', href: '/crm/leads' },
            { label: '...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !lead) {
    return (
      <>
        <PageHeader
          title="Lead Not Found"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'CRM', href: '/crm' },
            { label: 'Leads', href: '/crm/leads' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{error || 'Lead not found'}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/crm/leads')}>
                Back to Leads
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Leads', href: '/crm/leads' },
          { label: `${lead.firstName} ${lead.lastName}` },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {lead.status !== 'CONVERTED' && (
              <Button onClick={handleConvert}>
                <UserPlus className="h-4 w-4 mr-2" />
                Convert to Patient
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Mark as Lost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Lead Info Card */}
            <Card>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm">Lead Information</CardTitle>
                  <Badge variant={stageBadgeVariant[lead.stage] || 'default'}>
                    {stageLabels[lead.stage] || lead.stage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent compact>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <PhiProtected fakeData={getFakePhone()}>
                      <p className="flex items-center gap-2 font-medium">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {lead.phone}
                      </p>
                    </PhiProtected>
                  </div>
                  {lead.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <PhiProtected fakeData={getFakeEmail()}>
                        <p className="flex items-center gap-2 font-medium">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {lead.email}
                        </p>
                      </PhiProtected>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-medium">{sourceLabels[lead.source] || lead.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Contact</p>
                    <p className="font-medium capitalize">{lead.preferredContact.toLowerCase()}</p>
                  </div>
                  {lead.primaryConcern && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Primary Concern</p>
                      <p className="font-medium">{lead.primaryConcern}</p>
                    </div>
                  )}
                  {lead.treatmentInterest && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Treatment Interest</p>
                      <p className="font-medium">{lead.treatmentInterest}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Activity</CardTitle>
                <CardDescription>Recent interactions and updates</CardDescription>
              </CardHeader>
              <CardContent compact>
                {/* Add Note */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      disabled={!newNote.trim() || isSubmittingNote}
                      onClick={handleAddNote}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmittingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No activity yet
                    </p>
                  ) : (
                    activities.map((activity) => {
                      const Icon = activityIcons[activity.type] || MessageSquare;
                      return (
                        <ListActivity
                          key={activity.id}
                          indicatorColor={activity.type === 'STATUS_CHANGE' ? 'primary' : 'info'}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{activity.title}</p>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                                {activity.performedBy && (
                                  <> by {activity.performedBy.firstName} {activity.performedBy.lastName}</>
                                )}
                              </p>
                            </div>
                          </div>
                        </ListActivity>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Quick Stats */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Activities</span>
                  <Badge variant="soft-primary">{lead.activities?.length ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Tasks</span>
                  <Badge variant="soft-primary">{lead.tasks?.length ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Forms</span>
                  <Badge variant="soft-primary">{lead.formSubmissions?.length ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Assignment</CardTitle>
              </CardHeader>
              <CardContent compact>
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">Assigned staff</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </CardContent>
            </Card>

            {/* Referring Provider */}
            {lead.referringDentist && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Referred By</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <Link href={`/crm/referrers/${lead.referringDentist.id}`}>
                    <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <p className="font-medium text-sm">{lead.referringDentist.practiceName}</p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {lead.referringDentist.firstName} {lead.referringDentist.lastName}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Consultation */}
            {lead.consultationDate && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Consultation</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(lead.consultationDate), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {lead.consultationNotes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {lead.consultationNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(lead.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(lead.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
