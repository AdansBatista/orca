'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StaffAvailability } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  createAvailabilitySchema,
  type CreateAvailabilityInput,
} from '@/lib/validations/scheduling';

// Form field values type - matches schema output (with defaults applied)
type AvailabilityFormValues = CreateAvailabilityInput;

interface AvailabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAvailabilityInput) => Promise<void>;
  availability?: StaffAvailability | null;
  staffProfileId: string;
}

const dayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const typeOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'PREFERRED', label: 'Preferred' },
  { value: 'IF_NEEDED', label: 'If Needed' },
  { value: 'BLOCKED', label: 'Blocked' },
];

export function AvailabilityForm({
  isOpen,
  onClose,
  onSubmit,
  availability,
  staffProfileId,
}: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(createAvailabilitySchema) as never,
    defaultValues: {
      staffProfileId,
      availabilityType: availability?.availabilityType ?? 'AVAILABLE',
      isRecurring: availability?.isRecurring ?? true,
      dayOfWeek: availability?.dayOfWeek ?? undefined,
      startTime: availability?.startTime ?? '',
      endTime: availability?.endTime ?? '',
      specificDate: availability?.specificDate ? new Date(availability.specificDate) : undefined,
      allDay: availability?.allDay ?? false,
      locationId: availability?.locationId ?? '',
      effectiveFrom: availability?.effectiveFrom ? new Date(availability.effectiveFrom) : undefined,
      effectiveUntil: availability?.effectiveUntil ? new Date(availability.effectiveUntil) : undefined,
      reason: availability?.reason ?? '',
      notes: availability?.notes ?? '',
      isActive: availability?.isActive ?? true,
    },
  });

  const isRecurring = watch('isRecurring');
  const allDay = watch('allDay');
  const isActive = watch('isActive');

  // Reset form when availability changes
  useEffect(() => {
    if (availability) {
      reset({
        staffProfileId,
        availabilityType: availability.availabilityType,
        isRecurring: availability.isRecurring,
        dayOfWeek: availability.dayOfWeek ?? undefined,
        startTime: availability.startTime ?? '',
        endTime: availability.endTime ?? '',
        specificDate: availability.specificDate ? new Date(availability.specificDate) : undefined,
        allDay: availability.allDay,
        locationId: availability.locationId ?? '',
        effectiveFrom: availability.effectiveFrom ? new Date(availability.effectiveFrom) : undefined,
        effectiveUntil: availability.effectiveUntil ? new Date(availability.effectiveUntil) : undefined,
        reason: availability.reason ?? '',
        notes: availability.notes ?? '',
        isActive: availability.isActive,
      });
    } else {
      reset({
        staffProfileId,
        availabilityType: 'AVAILABLE',
        isRecurring: true,
        dayOfWeek: undefined,
        startTime: '',
        endTime: '',
        specificDate: undefined,
        allDay: false,
        locationId: '',
        effectiveFrom: undefined,
        effectiveUntil: undefined,
        reason: '',
        notes: '',
        isActive: true,
      });
    }
  }, [availability, staffProfileId, reset]);

  const handleFormSubmit = async (data: CreateAvailabilityInput) => {
    setIsSubmitting(true);
    try {
      // Clean up data
      const cleanedData = {
        ...data,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        locationId: data.locationId || null,
        reason: data.reason || null,
        notes: data.notes || null,
        effectiveFrom: data.effectiveFrom || null,
        effectiveUntil: data.effectiveUntil || null,
      };
      await onSubmit(cleanedData);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {availability ? 'Edit Availability' : 'Add Availability'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <FormField label="Availability Type" required error={errors.availabilityType?.message}>
            <Select
              value={watch('availabilityType')}
              onValueChange={(value) => setValue('availabilityType', value as CreateAvailabilityInput['availabilityType'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recurring Weekly</p>
              <p className="text-sm text-muted-foreground">
                Repeat every week on the same day
              </p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => setValue('isRecurring', checked)}
            />
          </div>

          {isRecurring ? (
            <FormField label="Day of Week" required error={errors.dayOfWeek?.message}>
              <Select
                value={watch('dayOfWeek')?.toString() ?? ''}
                onValueChange={(value) => setValue('dayOfWeek', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day..." />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : (
            <FormField label="Specific Date" required error={errors.specificDate?.message}>
              <Input
                type="date"
                {...register('specificDate', { valueAsDate: true })}
              />
            </FormField>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">All Day</p>
              <p className="text-sm text-muted-foreground">
                Applies to the entire day
              </p>
            </div>
            <Switch
              checked={allDay}
              onCheckedChange={(checked) => setValue('allDay', checked)}
            />
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Time" error={errors.startTime?.message}>
                <Input type="time" {...register('startTime')} />
              </FormField>
              <FormField label="End Time" error={errors.endTime?.message}>
                <Input type="time" {...register('endTime')} />
              </FormField>
            </div>
          )}

          <FormField label="Reason" error={errors.reason?.message}>
            <Input
              {...register('reason')}
              placeholder="e.g., School pickup, Medical appointment"
            />
          </FormField>

          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
            />
          </FormField>

          {isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Effective From" error={errors.effectiveFrom?.message}>
                <Input type="date" {...register('effectiveFrom', { valueAsDate: true })} />
              </FormField>
              <FormField label="Effective Until" error={errors.effectiveUntil?.message}>
                <Input type="date" {...register('effectiveUntil', { valueAsDate: true })} />
              </FormField>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active</p>
              <p className="text-sm text-muted-foreground">
                Enable or disable this availability
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : availability ? 'Update' : 'Create'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
