'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { TimeOffRequest, StaffProfile } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TimeOffFormData {
  requestType: string;
  startDate: string;
  endDate: string;
  isPartialDay: boolean;
  partialStartTime: string;
  partialEndTime: string;
  reason: string;
  notes: string;
  coverageRequired: boolean;
}

interface TimeOffRequestFormProps {
  staffProfile?: StaffProfile;
  request?: TimeOffRequest; // For editing
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const requestTypeOptions = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'BEREAVEMENT', label: 'Bereavement' },
  { value: 'JURY_DUTY', label: 'Jury Duty' },
  { value: 'MILITARY', label: 'Military' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'FMLA', label: 'FMLA' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
  { value: 'CONTINUING_EDUCATION', label: 'Continuing Education' },
  { value: 'OTHER', label: 'Other' },
];

export function TimeOffRequestForm({
  staffProfile,
  request,
  open,
  onOpenChange,
  onSubmit,
}: TimeOffRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultStartDate = request
    ? new Date(request.startDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const defaultEndDate = request
    ? new Date(request.endDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<TimeOffFormData>({
    requestType: request?.requestType || 'VACATION',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    isPartialDay: request?.isPartialDay || false,
    partialStartTime: '09:00',
    partialEndTime: '13:00',
    reason: request?.reason || '',
    notes: request?.notes || '',
    coverageRequired: request?.coverageRequired ?? true,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      let partialStartTime, partialEndTime;
      if (formData.isPartialDay) {
        const [startH, startM] = formData.partialStartTime.split(':').map(Number);
        const [endH, endM] = formData.partialEndTime.split(':').map(Number);
        partialStartTime = new Date(startDate);
        partialStartTime.setHours(startH, startM, 0, 0);
        partialEndTime = new Date(startDate);
        partialEndTime.setHours(endH, endM, 0, 0);
      }

      await onSubmit({
        staffProfileId: staffProfile?.id || request?.staffProfileId || '',
        requestType: formData.requestType,
        startDate,
        endDate,
        isPartialDay: formData.isPartialDay,
        partialStartTime,
        partialEndTime,
        reason: formData.reason,
        notes: formData.notes,
        coverageRequired: formData.coverageRequired,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {request ? 'Edit Time Off Request' : 'Request Time Off'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Request Type */}
          <FormField label="Type of Leave" required>
            <Select
              value={formData.requestType}
              onValueChange={(value) => setFormData({ ...formData, requestType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {requestTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>

            <FormField label="End Date" required>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </div>

          {/* Partial Day Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="partial-day"
              checked={formData.isPartialDay}
              onCheckedChange={(checked) => setFormData({ ...formData, isPartialDay: checked })}
            />
            <Label htmlFor="partial-day">Partial day (half day)</Label>
          </div>

          {/* Partial Day Times */}
          {formData.isPartialDay && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Time">
                <Input
                  type="time"
                  value={formData.partialStartTime}
                  onChange={(e) => setFormData({ ...formData, partialStartTime: e.target.value })}
                />
              </FormField>

              <FormField label="End Time">
                <Input
                  type="time"
                  value={formData.partialEndTime}
                  onChange={(e) => setFormData({ ...formData, partialEndTime: e.target.value })}
                />
              </FormField>
            </div>
          )}

          {/* Reason */}
          <FormField label="Reason">
            <Textarea
              placeholder="Brief reason for time off (optional)..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </FormField>

          {/* Notes */}
          <FormField label="Additional Notes">
            <Textarea
              placeholder="Any additional notes for the approver..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </FormField>

          {/* Coverage Required */}
          <div className="flex items-center gap-3">
            <Switch
              id="coverage-required"
              checked={formData.coverageRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, coverageRequired: checked })}
            />
            <Label htmlFor="coverage-required">Coverage required for this time off</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {request ? 'Update Request' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
