'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { ScheduleTemplate, EmploymentType } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TemplateShift {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

interface ScheduleTemplateFormData {
  name: string;
  description: string;
  templateType: string;
  employmentType: string;
  isActive: boolean;
  isDefault: boolean;
  shifts: TemplateShift[];
}

interface ScheduleTemplateFormProps {
  template?: ScheduleTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const templateTypeOptions = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXTENDED_HOURS', label: 'Extended Hours' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'CUSTOM', label: 'Custom' },
];

const employmentTypeOptions: { value: EmploymentType | 'any'; label: string }[] = [
  { value: 'any', label: 'Any Employment Type' },
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PRN', label: 'PRN (As Needed)' },
  { value: 'TEMP', label: 'Temporary' },
];

const defaultShift: TemplateShift = {
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 60,
};

export function ScheduleTemplateForm({
  template,
  open,
  onOpenChange,
  onSubmit,
}: ScheduleTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScheduleTemplateFormData>({
    name: '',
    description: '',
    templateType: 'STANDARD',
    employmentType: '',
    isActive: true,
    isDefault: false,
    shifts: [{ ...defaultShift }],
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        templateType: template.templateType,
        employmentType: template.employmentType || '',
        isActive: template.isActive,
        isDefault: template.isDefault,
        shifts: (template.shifts as unknown as TemplateShift[]) || [{ ...defaultShift }],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        templateType: 'STANDARD',
        employmentType: '',
        isActive: true,
        isDefault: false,
        shifts: [{ ...defaultShift }],
      });
    }
  }, [template, open]);

  const handleAddShift = () => {
    setFormData({
      ...formData,
      shifts: [...formData.shifts, { ...defaultShift }],
    });
  };

  const handleRemoveShift = (index: number) => {
    setFormData({
      ...formData,
      shifts: formData.shifts.filter((_, i) => i !== index),
    });
  };

  const handleShiftChange = (index: number, field: keyof TemplateShift, value: number | string) => {
    const updatedShifts = [...formData.shifts];
    updatedShifts[index] = {
      ...updatedShifts[index],
      [field]: value,
    };
    setFormData({ ...formData, shifts: updatedShifts });
  };

  const handleApplyToWeekdays = () => {
    // Take the first shift's time settings and apply to Mon-Fri
    const baseShift = formData.shifts[0] || defaultShift;
    const weekdayShifts: TemplateShift[] = [1, 2, 3, 4, 5].map((day) => ({
      dayOfWeek: day,
      startTime: baseShift.startTime,
      endTime: baseShift.endTime,
      breakMinutes: baseShift.breakMinutes,
    }));
    setFormData({ ...formData, shifts: weekdayShifts });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.shifts.length === 0) {
      alert('Please add at least one shift');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || null,
        templateType: formData.templateType,
        employmentType: formData.employmentType || null,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        shifts: formData.shifts,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total weekly hours
  const weeklyHours = formData.shifts.reduce((total, shift) => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const durationMins = endMins - startMins - shift.breakMinutes;
    return total + durationMins / 60;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Schedule Template' : 'Create Schedule Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <FormField label="Template Name" required>
              <Input
                placeholder="e.g., Full-Time Standard, Part-Time Morning"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Template Type">
                <Select
                  value={formData.templateType}
                  onValueChange={(value) => setFormData({ ...formData, templateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Employment Type">
                <Select
                  value={formData.employmentType || 'any'}
                  onValueChange={(value) => setFormData({ ...formData, employmentType: value === 'any' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Filter templates shown when assigning to staff
                </p>
              </FormField>
            </div>

            <FormField label="Description">
              <Textarea
                placeholder="Brief description of when this template should be used"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </FormField>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <span className="text-sm">Default for type</span>
              </div>
            </div>
          </div>

          {/* Shifts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weekly Shift Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.shifts.length} shift{formData.shifts.length !== 1 ? 's' : ''} • {weeklyHours.toFixed(1)} hours/week
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyToWeekdays}
                >
                  Mon-Fri
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddShift}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Shift
                </Button>
              </div>
            </div>

            <Card variant="ghost">
              <CardContent className="p-3 space-y-2">
                {formData.shifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No shifts defined. Click &quot;Add Shift&quot; to add one.
                  </p>
                ) : (
                  formData.shifts.map((shift, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-background rounded-lg border"
                    >
                      <Select
                        value={shift.dayOfWeek.toString()}
                        onValueChange={(val) => handleShiftChange(index, 'dayOfWeek', parseInt(val))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)}
                          className="w-[110px]"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)}
                          className="w-[110px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="480"
                          value={shift.breakMinutes}
                          onChange={(e) => handleShiftChange(index, 'breakMinutes', parseInt(e.target.value) || 0)}
                          className="w-[70px]"
                        />
                        <span className="text-sm text-muted-foreground">min break</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShift(index)}
                        disabled={formData.shifts.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
