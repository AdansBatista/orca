'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { addWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import type { ScheduleTemplate } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GenerateScheduleDialogProps {
  staffProfileId: string;
  staffName: string;
  defaultTemplateId?: string | null;
  defaultTemplateName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface GenerateResult {
  created: number;
  skipped: number;
  conflictDates?: string[];
}

export function GenerateScheduleDialog({
  staffProfileId,
  staffName,
  defaultTemplateId,
  defaultTemplateName,
  open,
  onOpenChange,
  onSuccess,
}: GenerateScheduleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const nextMonday = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const [templateId, setTemplateId] = useState<string>(defaultTemplateId || '');
  const [startDate, setStartDate] = useState(format(nextMonday, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(addWeeks(nextMonday, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [skipConflicts, setSkipConflicts] = useState(true);

  // Fetch templates
  useEffect(() => {
    if (!open) return;

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/staff/schedule-templates?isActive=true&pageSize=100');
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
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTemplateId(defaultTemplateId || '');
      setResult(null);
      setError(null);
      const nextMonday = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
      setStartDate(format(nextMonday, 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(addWeeks(nextMonday, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    }
  }, [open, defaultTemplateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/staff/${staffProfileId}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: templateId || undefined,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          skipConflicts,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate schedule');
      }

      setResult(data.data.summary);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === templateId) ||
    (defaultTemplateId && templates.find((t) => t.id === defaultTemplateId));

  // Calculate preview info
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeksDiff = Math.ceil(daysDiff / 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Schedule</DialogTitle>
          <DialogDescription>
            Create shifts for {staffName} based on a schedule template
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-full bg-success/10">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Schedule Generated</h3>
              <p className="text-muted-foreground">
                {result.created} shift{result.created !== 1 ? 's' : ''} created successfully
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-warning">
                  {result.skipped} day{result.skipped !== 1 ? 's' : ''} skipped due to existing shifts
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Template Selection */}
            <FormField label="Schedule Template" required>
              <Select
                value={templateId}
                onValueChange={setTemplateId}
                disabled={loadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingTemplates
                      ? 'Loading templates...'
                      : defaultTemplateName
                        ? `Default: ${defaultTemplateName}`
                        : 'Select a template...'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {defaultTemplateId && (
                    <SelectItem value={defaultTemplateId}>
                      {defaultTemplateName} (Default)
                    </SelectItem>
                  )}
                  {templates
                    .filter((t) => t.id !== defaultTemplateId)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>

              <FormField label="End Date" required>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </FormField>
            </div>

            {/* Options */}
            <div className="flex items-center gap-3">
              <Switch
                id="skipConflicts"
                checked={skipConflicts}
                onCheckedChange={setSkipConflicts}
              />
              <label htmlFor="skipConflicts" className="text-sm">
                Skip days that already have shifts
              </label>
            </div>

            {/* Preview */}
            <Card variant="ghost">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Period:</span>{' '}
                    {format(startDateObj, 'MMM d')} - {format(endDateObj, 'MMM d, yyyy')}{' '}
                    <Badge variant="outline" size="sm">{weeksDiff} week{weeksDiff !== 1 ? 's' : ''}</Badge>
                  </p>
                  {selectedTemplate && (
                    <p>
                      <span className="font-medium">Template:</span>{' '}
                      {selectedTemplate.name}
                      {' • '}
                      {(selectedTemplate.shifts as unknown[])?.length || 0} shifts/week
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !templateId}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Shifts
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
