'use client';

import { useState, useEffect } from 'react';
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
import {
  createMaintenanceRecordSchema,
  type CreateMaintenanceRecordInput,
} from '@/lib/validations/equipment';

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  initialData?: Partial<CreateMaintenanceRecordInput>;
  recordId?: string;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

const maintenanceTypeOptions = [
  { value: 'PREVENTIVE', label: 'Preventive' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export function MaintenanceForm({
  open,
  onOpenChange,
  equipmentId,
  initialData,
  recordId,
  mode,
  onSuccess,
}: MaintenanceFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMaintenanceRecordInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMaintenanceRecordSchema) as any,
    defaultValues: {
      maintenanceType: 'PREVENTIVE',
      status: 'SCHEDULED',
      ...initialData,
    },
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/resources/suppliers?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setSuppliers(result.data.items || []);
        }
      } catch {
        // Silent fail
      }
    };

    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const onSubmit = async (data: CreateMaintenanceRecordInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/equipment/${equipmentId}/maintenance/${recordId}`
        : `/api/resources/equipment/${equipmentId}/maintenance`;
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save maintenance record');
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

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
              {error}
            </div>
          )}

          {/* Type and Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Maintenance Type" required error={errors.maintenanceType?.message}>
              <Select
                value={watch('maintenanceType') || 'PREVENTIVE'}
                onValueChange={(v) => setValue('maintenanceType', v as CreateMaintenanceRecordInput['maintenanceType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" required error={errors.status?.message}>
              <Select
                value={watch('status') || 'SCHEDULED'}
                onValueChange={(v) => setValue('status', v as CreateMaintenanceRecordInput['status'])}
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
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Scheduled Date" error={errors.scheduledDate?.message}>
              <Input {...register('scheduledDate')} type="date" />
            </FormField>

            <FormField label="Completed Date" error={errors.completedDate?.message}>
              <Input {...register('completedDate')} type="date" />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Describe the maintenance work..."
              rows={3}
            />
          </FormField>

          {/* Performer Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Performed By" error={errors.performedBy?.message}>
              <Input {...register('performedBy')} placeholder="Staff name" />
            </FormField>

            <FormField label="Service Vendor" error={errors.vendorId?.message}>
              <Select
                value={watch('vendorId') || ''}
                onValueChange={(v) => setValue('vendorId', v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Technician Name" error={errors.technicianName?.message}>
              <Input {...register('technicianName')} placeholder="External technician name" />
            </FormField>
          </div>

          {/* Costs */}
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Labor Cost ($)" error={errors.laborCost?.message}>
              <Input
                {...register('laborCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Parts Cost ($)" error={errors.partsCost?.message}>
              <Input
                {...register('partsCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Total Cost ($)" error={errors.totalCost?.message}>
              <Input
                {...register('totalCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
          </div>

          {/* Next Maintenance */}
          <FormField label="Next Maintenance Date" error={errors.nextMaintenanceDate?.message}>
            <Input {...register('nextMaintenanceDate')} type="date" />
          </FormField>

          {/* Notes */}
          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
            />
          </FormField>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
