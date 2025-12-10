'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, FileText, MessageSquare, Mail, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['appointment', 'billing', 'treatment', 'marketing', 'general']),
  smsBody: z.string().max(1600).optional(),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(50000).optional(),
  pushTitle: z.string().max(100).optional(),
  pushBody: z.string().max(500).optional(),
  isActive: z.boolean(),
});

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;

const CATEGORY_OPTIONS = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'billing', label: 'Billing' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'general', label: 'General' },
];

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onComplete,
}: CreateTemplateDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sms');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'general',
      smsBody: '',
      emailSubject: '',
      emailBody: '',
      pushTitle: '',
      pushBody: '',
      isActive: true,
    },
  });

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      reset();
      setError(null);
      setActiveTab('sms');
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: CreateTemplateFormData) => {
    // Validate at least one channel content is provided
    if (!data.smsBody?.trim() && !data.emailBody?.trim() && !data.pushBody?.trim()) {
      setError('At least one channel content is required (SMS, Email, or Push)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        category: data.category,
        isActive: data.isActive,
      };

      if (data.description?.trim()) {
        payload.description = data.description.trim();
      }
      if (data.smsBody?.trim()) {
        payload.smsBody = data.smsBody.trim();
      }
      if (data.emailSubject?.trim()) {
        payload.emailSubject = data.emailSubject.trim();
      }
      if (data.emailBody?.trim()) {
        payload.emailBody = data.emailBody.trim();
      }
      if (data.pushTitle?.trim()) {
        payload.pushTitle = data.pushTitle.trim();
      }
      if (data.pushBody?.trim()) {
        payload.pushBody = data.pushBody.trim();
      }

      const response = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create template');
      }

      toast.success('Template created successfully');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const smsBody = watch('smsBody') || '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <IconBox color="primary" size="sm">
              <FileText className="h-4 w-4" />
            </IconBox>
            New Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable message template for patient communications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" required error={errors.name?.message}>
                <Input {...register('name')} placeholder="e.g., Appointment Reminder" />
              </FormField>

              <FormField label="Category" required error={errors.category?.message}>
                <Select
                  value={watch('category')}
                  onValueChange={(v) =>
                    setValue('category', v as CreateTemplateFormData['category'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Description" error={errors.description?.message}>
              <Input
                {...register('description')}
                placeholder="Brief description of this template..."
              />
            </FormField>

            {/* Channel Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sms" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="push" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Push
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sms" className="space-y-4 mt-4">
                <FormField label="SMS Body" error={errors.smsBody?.message}>
                  <Textarea
                    {...register('smsBody')}
                    placeholder="Type your SMS message..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {smsBody.length}/160 characters
                    {smsBody.length > 160 && ` (${Math.ceil(smsBody.length / 160)} segments)`}
                  </p>
                </FormField>
                <p className="text-xs text-muted-foreground">
                  Available variables: {`{{firstName}}`}, {`{{lastName}}`}, {`{{appointmentDate}}`},{' '}
                  {`{{appointmentTime}}`}, {`{{providerName}}`}
                </p>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <FormField label="Email Subject" error={errors.emailSubject?.message}>
                  <Input
                    {...register('emailSubject')}
                    placeholder="Email subject line..."
                  />
                </FormField>
                <FormField label="Email Body" error={errors.emailBody?.message}>
                  <Textarea
                    {...register('emailBody')}
                    placeholder="Type your email message..."
                    rows={6}
                  />
                </FormField>
                <p className="text-xs text-muted-foreground">
                  Available variables: {`{{firstName}}`}, {`{{lastName}}`}, {`{{appointmentDate}}`},{' '}
                  {`{{appointmentTime}}`}, {`{{providerName}}`}, {`{{clinicName}}`}
                </p>
              </TabsContent>

              <TabsContent value="push" className="space-y-4 mt-4">
                <FormField label="Push Title" error={errors.pushTitle?.message}>
                  <Input
                    {...register('pushTitle')}
                    placeholder="Notification title..."
                  />
                </FormField>
                <FormField label="Push Body" error={errors.pushBody?.message}>
                  <Textarea
                    {...register('pushBody')}
                    placeholder="Notification message..."
                    rows={3}
                  />
                </FormField>
              </TabsContent>
            </Tabs>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Template is active and can be used</Label>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
