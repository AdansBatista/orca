'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  createTreatmentChairSchema,
  type CreateTreatmentChairInput,
} from '@/lib/validations/room';

interface ChairFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  initialData?: Partial<CreateTreatmentChairInput>;
  chairId?: string;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'RETIRED', label: 'Retired' },
];

const conditionOptions = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

export function ChairForm({
  open,
  onOpenChange,
  roomId,
  initialData,
  chairId,
  mode,
  onSuccess,
}: ChairFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTreatmentChairInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTreatmentChairSchema) as any,
    defaultValues: {
      roomId,
      status: 'ACTIVE',
      condition: 'GOOD',
      hasDeliveryUnit: true,
      hasSuction: true,
      hasLight: true,
      features: [],
      ...initialData,
    },
  });

  const onSubmit = async (data: CreateTreatmentChairInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/rooms/${roomId}/chairs/${chairId}`
        : `/api/resources/rooms/${roomId}/chairs`;
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save chair');
      }

      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Treatment Chair' : 'Add Treatment Chair'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Chair Name" required error={errors.name?.message}>
              <Input {...register('name')} placeholder="e.g., Chair 1" />
            </FormField>

            <FormField label="Chair Number" required error={errors.chairNumber?.message}>
              <Input
                {...register('chairNumber')}
                placeholder="CH-01"
                className="uppercase"
              />
            </FormField>

            <FormField label="Status" required error={errors.status?.message}>
              <Select
                value={watch('status') || 'ACTIVE'}
                onValueChange={(v) => setValue('status', v as CreateTreatmentChairInput['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Condition" required error={errors.condition?.message}>
              <Select
                value={watch('condition') || 'GOOD'}
                onValueChange={(v) => setValue('condition', v as CreateTreatmentChairInput['condition'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Equipment Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Manufacturer" error={errors.manufacturer?.message}>
              <Input {...register('manufacturer')} placeholder="e.g., A-dec" />
            </FormField>

            <FormField label="Model Number" error={errors.modelNumber?.message}>
              <Input {...register('modelNumber')} placeholder="Model #" />
            </FormField>

            <FormField label="Serial Number" error={errors.serialNumber?.message}>
              <Input {...register('serialNumber')} placeholder="Serial #" />
            </FormField>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Features</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="hasDeliveryUnit"
                  checked={watch('hasDeliveryUnit')}
                  onCheckedChange={(checked) => setValue('hasDeliveryUnit', checked)}
                />
                <Label htmlFor="hasDeliveryUnit" className="font-normal">
                  Delivery Unit
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="hasSuction"
                  checked={watch('hasSuction')}
                  onCheckedChange={(checked) => setValue('hasSuction', checked)}
                />
                <Label htmlFor="hasSuction" className="font-normal">
                  Suction
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="hasLight"
                  checked={watch('hasLight')}
                  onCheckedChange={(checked) => setValue('hasLight', checked)}
                />
                <Label htmlFor="hasLight" className="font-normal">
                  Operatory Light
                </Label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Purchase Date" error={errors.purchaseDate?.message}>
              <Input {...register('purchaseDate')} type="date" />
            </FormField>

            <FormField label="Warranty Expiry" error={errors.warrantyExpiry?.message}>
              <Input {...register('warrantyExpiry')} type="date" />
            </FormField>

            <FormField label="Next Maintenance" error={errors.nextMaintenanceDate?.message}>
              <Input {...register('nextMaintenanceDate')} type="date" />
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes about this chair..."
              rows={3}
            />
          </FormField>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Chair'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
