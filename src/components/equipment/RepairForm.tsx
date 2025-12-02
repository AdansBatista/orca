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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  createRepairRecordSchema,
  type CreateRepairRecordInput,
} from '@/lib/validations/equipment';

interface RepairFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  initialData?: Partial<CreateRepairRecordInput>;
  recordId?: string;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

const severityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const statusOptions = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'DIAGNOSED', label: 'Diagnosed' },
  { value: 'AWAITING_PARTS', label: 'Awaiting Parts' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANNOT_REPAIR', label: 'Cannot Repair' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function RepairForm({
  open,
  onOpenChange,
  equipmentId,
  initialData,
  recordId,
  mode,
  onSuccess,
}: RepairFormProps) {
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
  } = useForm<CreateRepairRecordInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createRepairRecordSchema) as any,
    defaultValues: {
      severity: 'MEDIUM',
      status: 'REPORTED',
      coveredByWarranty: false,
      partsReplaced: [],
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

  const onSubmit = async (data: CreateRepairRecordInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/equipment/${equipmentId}/repairs/${recordId}`
        : `/api/resources/equipment/${equipmentId}/repairs`;
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save repair record');
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
            {mode === 'edit' ? 'Edit Repair Record' : 'Report Issue'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
              {error}
            </div>
          )}

          {/* Issue Description */}
          <FormField label="Issue Description" required error={errors.issueDescription?.message}>
            <Textarea
              {...register('issueDescription')}
              placeholder="Describe the issue in detail..."
              rows={3}
            />
          </FormField>

          {/* Severity and Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Severity" required error={errors.severity?.message}>
              <Select
                value={watch('severity') || 'MEDIUM'}
                onValueChange={(v) => setValue('severity', v as CreateRepairRecordInput['severity'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" required error={errors.status?.message}>
              <Select
                value={watch('status') || 'REPORTED'}
                onValueChange={(v) => setValue('status', v as CreateRepairRecordInput['status'])}
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

          {/* Scheduling */}
          <FormField label="Scheduled Date" error={errors.scheduledDate?.message}>
            <Input {...register('scheduledDate')} type="date" />
          </FormField>

          {/* Diagnosis & Resolution */}
          <FormField label="Diagnosis" error={errors.diagnosis?.message}>
            <Textarea
              {...register('diagnosis')}
              placeholder="What was found during diagnosis..."
              rows={2}
            />
          </FormField>

          <FormField label="Work Performed" error={errors.workPerformed?.message}>
            <Textarea
              {...register('workPerformed')}
              placeholder="Describe the repair work performed..."
              rows={2}
            />
          </FormField>

          <FormField label="Resolution Notes" error={errors.resolutionNotes?.message}>
            <Textarea
              {...register('resolutionNotes')}
              placeholder="Final resolution notes..."
              rows={2}
            />
          </FormField>

          {/* Vendor/Service Information */}
          <div className="grid gap-4 md:grid-cols-2">
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
              <Input {...register('technicianName')} placeholder="Technician name" />
            </FormField>

            <FormField label="Service Ticket #" error={errors.serviceTicketNumber?.message}>
              <Input {...register('serviceTicketNumber')} placeholder="Ticket number" />
            </FormField>
          </div>

          {/* Costs */}
          <div className="grid gap-4 md:grid-cols-4">
            <FormField label="Labor ($)" error={errors.laborCost?.message}>
              <Input
                {...register('laborCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Parts ($)" error={errors.partsCost?.message}>
              <Input
                {...register('partsCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Travel ($)" error={errors.travelCost?.message}>
              <Input
                {...register('travelCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Total ($)" error={errors.totalCost?.message}>
              <Input
                {...register('totalCost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
          </div>

          {/* Warranty */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                id="coveredByWarranty"
                checked={watch('coveredByWarranty')}
                onCheckedChange={(checked) => setValue('coveredByWarranty', checked)}
              />
              <Label htmlFor="coveredByWarranty">Covered by Warranty</Label>
            </div>

            {watch('coveredByWarranty') && (
              <FormField label="Warranty Claim #" error={errors.warrantyClaimNumber?.message}>
                <Input {...register('warrantyClaimNumber')} placeholder="Claim number" />
              </FormField>
            )}
          </div>

          {/* Downtime Tracking */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Equipment Down Start" error={errors.equipmentDownStart?.message}>
              <Input {...register('equipmentDownStart')} type="datetime-local" />
            </FormField>

            <FormField label="Equipment Down End" error={errors.equipmentDownEnd?.message}>
              <Input {...register('equipmentDownEnd')} type="datetime-local" />
            </FormField>
          </div>

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
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Report Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
