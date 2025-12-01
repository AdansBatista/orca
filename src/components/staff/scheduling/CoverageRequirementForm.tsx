'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CoverageRequirement } from '@prisma/client';

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
  createCoverageRequirementSchema,
  type CreateCoverageRequirementInput,
} from '@/lib/validations/scheduling';

// Form field values type - matches schema output (with defaults applied)
type CoverageFormValues = CreateCoverageRequirementInput;

interface CoverageRequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCoverageRequirementInput) => Promise<void>;
  requirement?: CoverageRequirement | null;
  locationId: string;
}

const dayOptions = [
  { value: '', label: 'All Days' },
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const providerTypeOptions = [
  { value: '', label: 'Any Provider Type' },
  { value: 'ORTHODONTIST', label: 'Orthodontist' },
  { value: 'GENERAL_DENTIST', label: 'General Dentist' },
  { value: 'ORAL_SURGEON', label: 'Oral Surgeon' },
  { value: 'PERIODONTIST', label: 'Periodontist' },
  { value: 'ENDODONTIST', label: 'Endodontist' },
  { value: 'HYGIENIST', label: 'Hygienist' },
  { value: 'DENTAL_ASSISTANT', label: 'Dental Assistant' },
  { value: 'EFDA', label: 'EFDA' },
  { value: 'OTHER', label: 'Other' },
];

export function CoverageRequirementForm({
  isOpen,
  onClose,
  onSubmit,
  requirement,
  locationId,
}: CoverageRequirementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CoverageFormValues>({
    resolver: zodResolver(createCoverageRequirementSchema) as never,
    defaultValues: {
      name: requirement?.name ?? '',
      description: requirement?.description ?? '',
      locationId: requirement?.locationId ?? locationId,
      department: requirement?.department ?? '',
      providerType: requirement?.providerType ?? '',
      minimumStaff: requirement?.minimumStaff ?? 1,
      optimalStaff: requirement?.optimalStaff ?? undefined,
      maximumStaff: requirement?.maximumStaff ?? undefined,
      dayOfWeek: requirement?.dayOfWeek ?? undefined,
      startTime: requirement?.startTime ?? '',
      endTime: requirement?.endTime ?? '',
      priority: requirement?.priority ?? 1,
      isCritical: requirement?.isCritical ?? false,
      isActive: requirement?.isActive ?? true,
    },
  });

  const isCritical = watch('isCritical');
  const isActive = watch('isActive');

  const handleFormSubmit = async (data: CreateCoverageRequirementInput) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to null/undefined
      const cleanedData = {
        ...data,
        description: data.description || null,
        department: data.department || null,
        providerType: data.providerType || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        optimalStaff: data.optimalStaff ?? null,
        maximumStaff: data.maximumStaff ?? null,
        dayOfWeek: data.dayOfWeek ?? null,
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
            {requirement ? 'Edit Coverage Requirement' : 'New Coverage Requirement'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <FormField label="Name" required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="e.g., Morning Front Desk"
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Describe when and why this coverage is needed"
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Minimum Staff" required error={errors.minimumStaff?.message}>
              <Input
                type="number"
                min={0}
                {...register('minimumStaff', { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="Optimal Staff" error={errors.optimalStaff?.message}>
              <Input
                type="number"
                min={0}
                {...register('optimalStaff', { valueAsNumber: true })}
                placeholder="Optional"
              />
            </FormField>

            <FormField label="Maximum Staff" error={errors.maximumStaff?.message}>
              <Input
                type="number"
                min={0}
                {...register('maximumStaff', { valueAsNumber: true })}
                placeholder="Optional"
              />
            </FormField>
          </div>

          <FormField label="Day of Week" error={errors.dayOfWeek?.message}>
            <Select
              value={watch('dayOfWeek')?.toString() ?? ''}
              onValueChange={(value) => setValue('dayOfWeek', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day..." />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || 'all'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" error={errors.startTime?.message}>
              <Input
                type="time"
                {...register('startTime')}
              />
            </FormField>

            <FormField label="End Time" error={errors.endTime?.message}>
              <Input
                type="time"
                {...register('endTime')}
              />
            </FormField>
          </div>

          <FormField label="Department" error={errors.department?.message}>
            <Input
              {...register('department')}
              placeholder="e.g., Front Desk, Clinical"
            />
          </FormField>

          <FormField label="Provider Type" error={errors.providerType?.message}>
            <Select
              value={watch('providerType') ?? ''}
              onValueChange={(value) => setValue('providerType', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider type..." />
              </SelectTrigger>
              <SelectContent>
                {providerTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || 'any'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Priority (1-10)" error={errors.priority?.message}>
            <Input
              type="number"
              min={1}
              max={10}
              {...register('priority', { valueAsNumber: true })}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Critical Requirement</p>
              <p className="text-sm text-muted-foreground">
                Mark as critical for high-priority alerts
              </p>
            </div>
            <Switch
              checked={isCritical}
              onCheckedChange={(checked) => setValue('isCritical', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active</p>
              <p className="text-sm text-muted-foreground">
                Enable or disable this requirement
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
              {isSubmitting ? 'Saving...' : requirement ? 'Update' : 'Create'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
