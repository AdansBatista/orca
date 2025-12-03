'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import {
  Plus,
  Filter,
  User,
  MoreHorizontal,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Send,
  Mail,
  Phone,
  MessageSquare,
  Settings,
  RefreshCw,
  Calendar,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';

interface AppointmentReminder {
  id: string;
  channel: string;
  type: string;
  status: string;
  scheduledFor: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  confirmationResponse: string | null;
  respondedAt: string | null;
  appointment: {
    id: string;
    startTime: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      email: string | null;
    };
    appointmentType: {
      name: string;
      color: string;
    };
  };
}

interface ReminderTemplate {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  type: string;
  subject: string | null;
  body: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface PaginatedReminders {
  items: AppointmentReminder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const channelConfig: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  SMS: { label: 'SMS', icon: MessageSquare, color: 'text-blue-600' },
  EMAIL: { label: 'Email', icon: Mail, color: 'text-purple-600' },
  VOICE: { label: 'Voice', icon: Phone, color: 'text-green-600' },
  PUSH: { label: 'Push', icon: Bell, color: 'text-orange-600' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'default' },
  SENT: { label: 'Sent', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'error' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

const confirmationConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'error' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning' },
  NO_RESPONSE: { label: 'No Response', variant: 'default' },
};

const typeConfig: Record<string, string> = {
  REMINDER: 'Reminder',
  CONFIRMATION: 'Confirmation',
  FOLLOW_UP: 'Follow-up',
  CUSTOM: 'Custom',
};

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('queue');

  // Reminders state
  const [reminders, setReminders] = useState<PaginatedReminders | null>(null);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [reminderStatus, setReminderStatus] = useState('all');
  const [reminderChannel, setReminderChannel] = useState('all');
  const [page, setPage] = useState(1);

  // Templates state
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Dialogs
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);

  // Send reminder form
  const [sendFormData, setSendFormData] = useState({
    appointmentId: '',
    templateId: '',
    channel: 'SMS',
    scheduledFor: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Template form
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    channel: 'SMS',
    type: 'REMINDER',
    subject: '',
    body: '',
    isActive: true,
  });

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    setLoadingReminders(true);

    const params = new URLSearchParams();
    if (reminderStatus && reminderStatus !== 'all') params.set('status', reminderStatus);
    if (reminderChannel && reminderChannel !== 'all') params.set('channel', reminderChannel);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/booking/reminders?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setReminders(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to load reminders');
      }
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoadingReminders(false);
    }
  }, [reminderStatus, reminderChannel, page]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/booking/reminder-templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data.items || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchReminders();
    } else {
      fetchTemplates();
    }
  }, [activeTab, fetchReminders, fetchTemplates]);

  // Cancel reminder
  const handleCancelReminder = async (id: string) => {
    if (!confirm('Cancel this reminder?')) return;

    try {
      const response = await fetch(`/api/booking/reminders/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Reminder cancelled');
        fetchReminders();
      } else {
        toast.error(result.error?.message || 'Failed to cancel reminder');
      }
    } catch {
      toast.error('Failed to cancel reminder');
    }
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (!sendFormData.appointmentId || !sendFormData.templateId) {
      toast.error('Please select an appointment and template');
      return;
    }

    try {
      const response = await fetch('/api/booking/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendFormData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Reminder scheduled');
        setShowSendDialog(false);
        setSendFormData({
          appointmentId: '',
          templateId: '',
          channel: 'SMS',
          scheduledFor: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        });
        fetchReminders();
      } else {
        toast.error(result.error?.message || 'Failed to schedule reminder');
      }
    } catch {
      toast.error('Failed to schedule reminder');
    }
  };

  // Create/update template
  const handleSaveTemplate = async () => {
    if (!templateFormData.name || !templateFormData.body) {
      toast.error('Please enter a name and message body');
      return;
    }

    try {
      const url = selectedTemplate
        ? `/api/booking/reminder-templates/${selectedTemplate.id}`
        : '/api/booking/reminder-templates';
      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateFormData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(selectedTemplate ? 'Template updated' : 'Template created');
        setShowTemplateDialog(false);
        setSelectedTemplate(null);
        setTemplateFormData({
          name: '',
          description: '',
          channel: 'SMS',
          type: 'REMINDER',
          subject: '',
          body: '',
          isActive: true,
        });
        fetchTemplates();
      } else {
        toast.error(result.error?.message || 'Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const response = await fetch(`/api/booking/reminder-templates/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        toast.error(result.error?.message || 'Failed to delete template');
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Stats
  const pendingCount = reminders?.items.filter(r => r.status === 'PENDING').length || 0;
  const sentCount = reminders?.items.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length || 0;
  const failedCount = reminders?.items.filter(r => r.status === 'FAILED').length || 0;
  const confirmedCount = reminders?.items.filter(r => r.confirmationResponse === 'CONFIRMED').length || 0;

  return (
    <>
      <PageHeader
        title="Appointment Reminders"
        description="Manage reminder templates and view reminder queue"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedTemplate(null);
              setTemplateFormData({
                name: '',
                description: '',
                channel: 'SMS',
                type: 'REMINDER',
                subject: '',
                body: '',
                isActive: true,
              });
              setShowTemplateDialog(true);
            }}>
              <Settings className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        }
      />

      <PageContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="queue">
              <Bell className="h-4 w-4 mr-2" />
              Reminder Queue
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            {/* Stats */}
            <StatsRow>
              <StatCard accentColor="secondary">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </StatCard>
              <StatCard accentColor="success">
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{sentCount}</p>
              </StatCard>
              <StatCard accentColor="error">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{failedCount}</p>
              </StatCard>
              <StatCard accentColor="primary">
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{confirmedCount}</p>
              </StatCard>
            </StatsRow>

            {/* Filters */}
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>

                  <Select value={reminderStatus} onValueChange={setReminderStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={reminderChannel} onValueChange={setReminderChannel}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="VOICE">Voice</SelectItem>
                      <SelectItem value="PUSH">Push</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={fetchReminders}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reminders Table */}
            <Card>
              <CardContent className="p-0">
                {loadingReminders ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    ))}
                  </div>
                ) : reminders?.items.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">No reminders</h3>
                    <p className="text-muted-foreground">
                      {reminderStatus !== 'all' || reminderChannel !== 'all'
                        ? 'No reminders match your filters'
                        : 'No reminders in the queue'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Appointment</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminders?.items.map((reminder) => {
                        const channelInfo = channelConfig[reminder.channel] || channelConfig.SMS;
                        const statusInfo = statusConfig[reminder.status] || statusConfig.PENDING;
                        const ChannelIcon = channelInfo.icon;
                        const confirmInfo = reminder.confirmationResponse
                          ? confirmationConfig[reminder.confirmationResponse]
                          : null;

                        return (
                          <TableRow key={reminder.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ChannelIcon className={`h-4 w-4 ${channelInfo.color}`} />
                                <span>{channelInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    <PhiProtected fakeData={getFakeName()}>
                                      {reminder.appointment.patient.firstName}{' '}
                                      {reminder.appointment.patient.lastName}
                                    </PhiProtected>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <PhiProtected fakeData={getFakePhone()}>
                                      {reminder.channel === 'EMAIL'
                                        ? reminder.appointment.patient.email
                                        : reminder.appointment.patient.phone}
                                    </PhiProtected>
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: reminder.appointment.appointmentType.color }}
                                />
                                <div>
                                  <p className="text-sm">{reminder.appointment.appointmentType.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(reminder.appointment.startTime), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(reminder.scheduledFor), 'MMM d, h:mm a')}
                              </div>
                              {reminder.sentAt && (
                                <p className="text-xs text-muted-foreground">
                                  Sent: {formatDistanceToNow(new Date(reminder.sentAt), { addSuffix: true })}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                              {reminder.failureReason && (
                                <p className="text-xs text-error-600 mt-1">{reminder.failureReason}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {confirmInfo ? (
                                <Badge variant={confirmInfo.variant}>
                                  {confirmInfo.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {reminder.status === 'PENDING' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleCancelReminder(reminder.id)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {reminders && reminders.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(reminders.page - 1) * reminders.pageSize + 1} to{' '}
                  {Math.min(reminders.page * reminders.pageSize, reminders.total)} of {reminders.total} reminders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {reminders.page} of {reminders.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(reminders.totalPages, p + 1))}
                    disabled={page === reminders.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Templates Grid */}
            {loadingTemplates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-1">No templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first reminder template to get started
                  </p>
                  <Button onClick={() => {
                    setSelectedTemplate(null);
                    setShowTemplateDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const channelInfo = channelConfig[template.channel] || channelConfig.SMS;
                  const ChannelIcon = channelInfo.icon;

                  return (
                    <Card key={template.id} variant="bento" interactive>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className={`h-5 w-5 ${channelInfo.color}`} />
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            {template.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                            {!template.isActive && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{typeConfig[template.type] || template.type}</Badge>
                          <Badge variant="outline">{channelInfo.label}</Badge>
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground bg-muted/30 p-2 rounded">
                          {template.body}
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTemplateFormData({
                                name: template.name,
                                description: template.description || '',
                                channel: template.channel,
                                type: template.type,
                                subject: template.subject || '',
                                body: template.body,
                                isActive: template.isActive,
                              });
                              setShowTemplateDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? 'Update the reminder template'
                : 'Create a new reminder template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormField label="Template Name" required>
              <Input
                placeholder="e.g., 24-Hour Reminder"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Description">
              <Input
                placeholder="Brief description of when to use this template"
                value={templateFormData.description}
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Channel">
                <Select
                  value={templateFormData.channel}
                  onValueChange={(v) => setTemplateFormData({ ...templateFormData, channel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="VOICE">Voice</SelectItem>
                    <SelectItem value="PUSH">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Type">
                <Select
                  value={templateFormData.type}
                  onValueChange={(v) => setTemplateFormData({ ...templateFormData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REMINDER">Reminder</SelectItem>
                    <SelectItem value="CONFIRMATION">Confirmation</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {templateFormData.channel === 'EMAIL' && (
              <FormField label="Subject Line">
                <Input
                  placeholder="Email subject"
                  value={templateFormData.subject}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                />
              </FormField>
            )}

            <FormField label="Message Body" required>
              <Textarea
                placeholder="Hi {patient_name}, this is a reminder for your appointment on {date} at {time}..."
                value={templateFormData.body}
                onChange={(e) => setTemplateFormData({ ...templateFormData, body: e.target.value })}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {'{patient_name}'}, {'{date}'}, {'{time}'}, {'{provider}'}, {'{clinic_name}'}, {'{clinic_phone}'}
              </p>
            </FormField>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={templateFormData.isActive}
                onChange={(e) => setTemplateFormData({ ...templateFormData, isActive: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm">Active template</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
