'use client';

import { useState, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/form-field';
import { createAppointmentTypeSchema } from '@/lib/validations/booking';

// Form schema (reuse from validation but make partial for edit)
const formSchema = createAppointmentTypeSchema;
type FormData = z.infer<typeof formSchema>;

interface AppointmentType {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  defaultDuration: number;
  minDuration?: number | null;
  maxDuration?: number | null;
  color: string;
  icon: string | null;
  requiresChair: boolean;
  requiresRoom: boolean;
  prepTime: number;
  cleanupTime: number;
  isActive: boolean;
  allowOnline: boolean;
  sortOrder: number;
}

export interface AppointmentTypeFormRef {
  submit: () => void;
  isSubmitting: boolean;
}

interface AppointmentTypeFormProps {
  initialData?: AppointmentType | null;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  /** If true, hides the built-in footer buttons (use when providing external footer) */
  hideFooter?: boolean;
  /** Callback to sync submitting state with parent */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

// Preset colors for appointment types
const colorPresets = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export const AppointmentTypeForm = forwardRef<AppointmentTypeFormRef, AppointmentTypeFormProps>(
  function AppointmentTypeForm({ initialData, onSubmit, onCancel, hideFooter, onSubmittingChange }, ref) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      defaultDuration: initialData?.defaultDuration || 30,
      minDuration: initialData?.minDuration || undefined,
      maxDuration: initialData?.maxDuration || undefined,
      color: initialData?.color || '#3B82F6',
      icon: initialData?.icon || '',
      requiresChair: initialData?.requiresChair ?? true,
      requiresRoom: initialData?.requiresRoom ?? false,
      prepTime: initialData?.prepTime || 0,
      cleanupTime: initialData?.cleanupTime || 0,
      isActive: initialData?.isActive ?? true,
      allowOnline: initialData?.allowOnline ?? false,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const selectedColor = watch('color');

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  // Expose submit method to parent via ref
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(handleFormSubmit)(),
    isSubmitting,
  }), [handleSubmit, handleFormSubmit, isSubmitting]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Code"
          required
          error={errors.code?.message}
          description="Unique identifier (uppercase letters, numbers, underscores)"
        >
          <Input
            {...register('code')}
            placeholder="e.g., ADJ, SCAN, BOND"
            className="uppercase"
            disabled={!!initialData} // Don't allow code change on edit
          />
        </FormField>

        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="e.g., Adjustment" />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          placeholder="Brief description of this appointment type"
          rows={2}
        />
      </FormField>

      {/* Duration Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Duration Settings</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Default Duration (min)"
            required
            error={errors.defaultDuration?.message}
          >
            <Input
              type="number"
              {...register('defaultDuration', { valueAsNumber: true })}
              min={5}
              max={480}
            />
          </FormField>

          <FormField label="Min Duration (min)" error={errors.minDuration?.message}>
            <Input
              type="number"
              {...register('minDuration', { valueAsNumber: true })}
              min={5}
              max={480}
              placeholder="Optional"
            />
          </FormField>

          <FormField label="Max Duration (min)" error={errors.maxDuration?.message}>
            <Input
              type="number"
              {...register('maxDuration', { valueAsNumber: true })}
              min={5}
              max={480}
              placeholder="Optional"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Prep Time (min)"
            error={errors.prepTime?.message}
            description="Time needed before appointment"
          >
            <Input
              type="number"
              {...register('prepTime', { valueAsNumber: true })}
              min={0}
              max={60}
            />
          </FormField>

          <FormField
            label="Cleanup Time (min)"
            error={errors.cleanupTime?.message}
            description="Time needed after appointment"
          >
            <Input
              type="number"
              {...register('cleanupTime', { valueAsNumber: true })}
              min={0}
              max={60}
            />
          </FormField>
        </div>
      </div>

      {/* Color Selection */}
      <FormField label="Calendar Color" required error={errors.color?.message}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Input
            {...register('color')}
            placeholder="#3B82F6"
            className="w-32"
          />
        </div>
      </FormField>

      {/* Resource Requirements */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Resource Requirements</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={watch('requiresChair')}
              onCheckedChange={(checked) => setValue('requiresChair', checked)}
            />
            <span className="text-sm">Requires Treatment Chair</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={watch('requiresRoom')}
              onCheckedChange={(checked) => setValue('requiresRoom', checked)}
            />
            <span className="text-sm">Requires Room</span>
          </label>
        </div>
      </div>

      {/* Status & Online Booking */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Availability</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <span className="text-sm">Active (available for booking)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={watch('allowOnline')}
              onCheckedChange={(checked) => setValue('allowOnline', checked)}
            />
            <span className="text-sm">Allow Online Booking</span>
          </label>
        </div>
      </div>

      {/* Sort Order */}
      <FormField
        label="Sort Order"
        error={errors.sortOrder?.message}
        description="Lower numbers appear first in lists"
      >
        <Input
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
          min={0}
          className="w-24"
        />
      </FormField>

      {/* Actions - only show if not using external footer */}
      {!hideFooter && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      )}
    </form>
  );
});
