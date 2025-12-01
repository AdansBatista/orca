'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { BlackoutDate } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface BlackoutDateFormData {
  name: string;
  startDate: string;
  endDate: string;
  restrictionType: string;
  description: string;
  isActive: boolean;
}

interface BlackoutDateFormProps {
  blackoutDate?: BlackoutDate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const blackoutTypeOptions = [
  { value: 'BLOCKED', label: 'Blocked - No time-off allowed', description: 'Completely blocks time-off requests' },
  { value: 'RESTRICTED', label: 'Restricted - Approval required', description: 'Requests allowed but flagged for review' },
  { value: 'WARNING', label: 'Warning - Advisory only', description: 'Shows warning but allows requests' },
];

export function BlackoutDateForm({
  blackoutDate,
  open,
  onOpenChange,
  onSubmit,
}: BlackoutDateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultStartDate = blackoutDate
    ? new Date(blackoutDate.startDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const defaultEndDate = blackoutDate
    ? new Date(blackoutDate.endDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<BlackoutDateFormData>({
    name: blackoutDate?.name || '',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    restrictionType: blackoutDate?.restrictionType || 'WARNING',
    description: blackoutDate?.description || '',
    isActive: blackoutDate?.isActive ?? true,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        restrictionType: formData.restrictionType,
        description: formData.description,
        isActive: formData.isActive,
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
            {blackoutDate ? 'Edit Blackout Date' : 'Create Blackout Date'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Name */}
          <FormField label="Name" required>
            <Input
              placeholder="e.g., Thanksgiving Week, Year-End Freeze"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          {/* Date Range */}
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

          {/* Restriction Type */}
          <FormField label="Restriction Type" required>
            <Select
              value={formData.restrictionType}
              onValueChange={(value) => setFormData({ ...formData, restrictionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {blackoutTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {blackoutTypeOptions.find(o => o.value === formData.restrictionType)?.description}
            </p>
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <Textarea
              placeholder="Why is this period blocked or restricted?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

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
              {blackoutDate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
