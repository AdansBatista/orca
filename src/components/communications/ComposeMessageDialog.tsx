'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Send, MessageSquare, Mail, FileText, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { IconBox } from '@/components/ui/icon-box';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientSearchCombobox } from '@/components/booking/PatientSearchCombobox';
import { toast } from 'sonner';

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  preselectedPatientId?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  smsBody?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
}

const composeMessageSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  channel: z.enum(['SMS', 'EMAIL']),
  templateId: z.string().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, 'Message body is required').max(50000),
});

type ComposeMessageFormData = z.infer<typeof composeMessageSchema>;

export function ComposeMessageDialog({
  open,
  onOpenChange,
  onComplete,
  preselectedPatientId,
}: ComposeMessageDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<{
    subject?: string;
    body?: string;
    missingVariables?: string[];
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ComposeMessageFormData>({
    resolver: zodResolver(composeMessageSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      channel: 'SMS',
      templateId: '',
      subject: '',
      body: '',
    },
  });

  const currentChannel = watch('channel');
  const currentBody = watch('body');
  const currentSubject = watch('subject');
  const currentPatientId = watch('patientId');
  const currentTemplateId = watch('templateId');

  // Fetch preview with variable substitution
  const fetchPreview = useCallback(async () => {
    if (!currentBody && !currentTemplateId) {
      setPreview(null);
      return;
    }

    setLoadingPreview(true);
    try {
      const payload: Record<string, unknown> = {
        channel: currentChannel,
      };

      if (currentTemplateId) {
        payload.templateId = currentTemplateId;
      } else {
        if (currentChannel === 'SMS') {
          payload.smsBody = currentBody;
        } else {
          payload.emailSubject = currentSubject;
          payload.emailBody = currentBody;
        }
      }

      if (currentPatientId) {
        payload.patientId = currentPatientId;
      }

      const response = await fetch('/api/communications/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setPreview({
          subject: result.data.preview.subject,
          body: result.data.preview.body,
          missingVariables: result.data.variables.missing,
        });
      }
    } catch {
      // Silent fail for preview
    } finally {
      setLoadingPreview(false);
    }
  }, [currentChannel, currentBody, currentSubject, currentPatientId, currentTemplateId]);

  // Fetch preview when showing preview panel
  useEffect(() => {
    if (showPreview) {
      fetchPreview();
    }
  }, [showPreview, fetchPreview]);

  // Fetch templates
  useEffect(() => {
    if (open) {
      const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
          const response = await fetch('/api/communications/templates?isActive=true&pageSize=100');
          const result = await response.json();
          if (result.success) {
            setTemplates(result.data.items || []);
          }
        } catch {
          // Silent fail
        } finally {
          setLoadingTemplates(false);
        }
      };
      fetchTemplates();
    }
  }, [open]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        patientId: preselectedPatientId || '',
        channel: 'SMS',
        templateId: '',
        subject: '',
        body: '',
      });
      setError(null);
      setShowPreview(false);
      setPreview(null);
    }
  }, [open, reset, preselectedPatientId]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setValue('templateId', '');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setValue('templateId', templateId);

    if (currentChannel === 'SMS' && template.smsBody) {
      setValue('body', template.smsBody);
    } else if (currentChannel === 'EMAIL') {
      if (template.emailSubject) {
        setValue('subject', template.emailSubject);
      }
      if (template.emailBody) {
        setValue('body', template.emailBody);
      }
    }
  };

  const onSubmit = async (data: ComposeMessageFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        patientId: data.patientId,
        channel: data.channel,
        body: data.body,
      };

      if (data.templateId) {
        payload.templateId = data.templateId;
      }

      if (data.channel === 'EMAIL' && data.subject) {
        payload.subject = data.subject;
      }

      const response = await fetch('/api/communications/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send message');
      }

      toast.success('Message sent successfully');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter templates by channel
  const availableTemplates = templates.filter((t) => {
    if (currentChannel === 'SMS') return !!t.smsBody;
    if (currentChannel === 'EMAIL') return !!t.emailBody;
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <IconBox color="primary" size="sm">
              <Send className="h-4 w-4" />
            </IconBox>
            New Message
          </DialogTitle>
          <DialogDescription>Send a message to a patient via SMS or email.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Patient Selection */}
            <FormField label="Patient" required error={errors.patientId?.message}>
              <PatientSearchCombobox
                onSelect={(patient) => setValue('patientId', patient.id)}
                placeholder="Search for a patient..."
              />
            </FormField>

            {/* Channel Selection */}
            <FormField label="Channel" required>
              <Tabs
                value={currentChannel}
                onValueChange={(v) => setValue('channel', v as 'SMS' | 'EMAIL')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="SMS" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="EMAIL" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FormField>

            {/* Template Selection */}
            <FormField label="Template (Optional)">
              <Select
                value={watch('templateId') || 'none'}
                onValueChange={(v) => handleTemplateSelect(v === 'none' ? '' : v)}
                disabled={loadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTemplates ? 'Loading...' : 'Select a template'}>
                    {watch('templateId') ? (
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {templates.find((t) => t.id === watch('templateId'))?.name || 'Template'}
                      </span>
                    ) : (
                      'No template'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.name}
                        <span className="text-xs text-muted-foreground">({template.category})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Email Subject (only for EMAIL channel) */}
            {currentChannel === 'EMAIL' && (
              <FormField label="Subject" error={errors.subject?.message}>
                <Input
                  value={currentSubject || ''}
                  onChange={(e) => setValue('subject', e.target.value)}
                  placeholder="Email subject..."
                />
              </FormField>
            )}

            {/* Message Body */}
            <FormField label="Message" required error={errors.body?.message}>
              <Textarea
                value={currentBody}
                onChange={(e) => setValue('body', e.target.value)}
                placeholder={
                  currentChannel === 'SMS'
                    ? 'Type your SMS message...'
                    : 'Type your email message...'
                }
                rows={6}
              />
              <div className="flex items-center justify-between mt-1">
                {currentChannel === 'SMS' ? (
                  <p className="text-xs text-muted-foreground">
                    {currentBody.length}/160 characters
                    {currentBody.length > 160 && ` (${Math.ceil(currentBody.length / 160)} segments)`}
                  </p>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1 text-xs"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </FormField>

            {/* Preview Panel */}
            {showPreview && (
              <Card variant="ghost" className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Preview</span>
                    {loadingPreview && (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    )}
                  </div>

                  {preview?.missingVariables && preview.missingVariables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-amber-600">Missing:</span>
                      {preview.missingVariables.map((v) => (
                        <Badge key={v} variant="warning" size="sm">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {currentChannel === 'EMAIL' && preview?.subject && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Subject:</span>
                      <p className="text-sm font-medium">{preview.subject}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-muted-foreground">Body:</span>
                    <p className="text-sm whitespace-pre-wrap">
                      {preview?.body || currentBody || '(empty)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
