'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StaffShift, StaffProfile } from '@prisma/client';

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

interface ShiftFormData {
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  shiftType: string;
  notes: string;
}

interface ShiftFormProps {
  staffProfile?: StaffProfile;
  shift?: StaffShift; // For editing
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  locationId?: string;
}

const shiftTypeOptions = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'OVERTIME', label: 'Overtime' },
  { value: 'ON_CALL', label: 'On Call' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'COVERAGE', label: 'Coverage' },
  { value: 'FLOAT', label: 'Float' },
];

export function ShiftForm({
  staffProfile,
  shift,
  open,
  onOpenChange,
  onSubmit,
  locationId,
}: ShiftFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDate = shift
    ? new Date(shift.shiftDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const defaultStartTime = shift
    ? new Date(shift.startTime).toTimeString().slice(0, 5)
    : '09:00';

  const defaultEndTime = shift
    ? new Date(shift.endTime).toTimeString().slice(0, 5)
    : '17:00';

  const [formData, setFormData] = useState<ShiftFormData>({
    shiftDate: defaultDate,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    breakMinutes: shift?.breakMinutes || 30,
    shiftType: shift?.shiftType || 'REGULAR',
    notes: shift?.notes || '',
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Build datetime objects
      const shiftDate = new Date(formData.shiftDate);
      const [startHours, startMins] = formData.startTime.split(':').map(Number);
      const [endHours, endMins] = formData.endTime.split(':').map(Number);

      const startTime = new Date(shiftDate);
      startTime.setHours(startHours, startMins, 0, 0);

      const endTime = new Date(shiftDate);
      endTime.setHours(endHours, endMins, 0, 0);

      await onSubmit({
        shiftDate,
        startTime,
        endTime,
        breakMinutes: formData.breakMinutes,
        shiftType: formData.shiftType,
        notes: formData.notes,
        locationId: locationId || shift?.locationId || '',
        staffProfileId: staffProfile?.id || shift?.staffProfileId || '',
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
            {shift ? 'Edit Shift' : 'Create New Shift'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Date */}
          <FormField label="Shift Date" required>
            <Input
              type="date"
              value={formData.shiftDate}
              onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
            />
          </FormField>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" required>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </FormField>

            <FormField label="End Time" required>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </FormField>
          </div>

          {/* Break */}
          <FormField label="Break Duration (minutes)">
            <Input
              type="number"
              min={0}
              max={480}
              value={formData.breakMinutes}
              onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
            />
          </FormField>

          {/* Shift Type */}
          <FormField label="Shift Type">
            <Select
              value={formData.shiftType}
              onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {shiftTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Notes */}
          <FormField label="Notes">
            <Textarea
              placeholder="Optional notes about this shift..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {shift ? 'Update Shift' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
