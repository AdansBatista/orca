'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEmploymentRecordSchema, type CreateEmploymentRecordInput } from '@/lib/validations/staff';

interface EmploymentRecordFormProps {
  staffProfileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const recordTypeOptions = [
  { value: 'HIRE', label: 'Hire' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'DEMOTION', label: 'Demotion' },
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'DEPARTMENT_CHANGE', label: 'Department Change' },
  { value: 'TITLE_CHANGE', label: 'Title Change' },
  { value: 'EMPLOYMENT_TYPE_CHANGE', label: 'Employment Type Change' },
  { value: 'LEAVE_START', label: 'Leave Started' },
  { value: 'LEAVE_END', label: 'Leave Ended' },
  { value: 'REHIRE', label: 'Rehire' },
  { value: 'OTHER', label: 'Other' },
];

const employmentTypeOptions = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PRN', label: 'PRN' },
  { value: 'TEMP', label: 'Temporary' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending' },
];

// Record types that show position change fields
const positionChangeTypes = ['PROMOTION', 'DEMOTION', 'TRANSFER', 'TITLE_CHANGE', 'DEPARTMENT_CHANGE'];
const typeChangeTypes = ['EMPLOYMENT_TYPE_CHANGE'];
const statusChangeTypes = ['STATUS_CHANGE', 'LEAVE_START', 'LEAVE_END', 'TERMINATION', 'RESIGNATION'];

export function EmploymentRecordForm({ staffProfileId, onSuccess, onCancel }: EmploymentRecordFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEmploymentRecordInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEmploymentRecordSchema) as any,
    defaultValues: {
      staffProfileId,
      effectiveDate: new Date(),
    },
  });

  const recordType = watch('recordType');
  const showPositionFields = recordType && positionChangeTypes.includes(recordType);
  const showTypeFields = recordType && typeChangeTypes.includes(recordType);
  const showStatusFields = recordType && statusChangeTypes.includes(recordType);

  const onSubmit = async (data: CreateEmploymentRecordInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${staffProfileId}/employment-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add employment record');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
          {error}
        </div>
      )}

      <FormField label="Record Type" required error={errors.recordType?.message}>
        <Select
          value={watch('recordType')}
          onValueChange={(v) => setValue('recordType', v as CreateEmploymentRecordInput['recordType'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {recordTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Effective Date" required error={errors.effectiveDate?.message}>
        <Input {...register('effectiveDate')} type="date" />
      </FormField>

      {/* Position Change Fields */}
      {showPositionFields && (
        <>
          <div className="grid gap-4 grid-cols-2">
            <FormField label="Previous Title" error={errors.previousTitle?.message}>
              <Input {...register('previousTitle')} placeholder="Previous title" />
            </FormField>
            <FormField label="New Title" error={errors.newTitle?.message}>
              <Input {...register('newTitle')} placeholder="New title" />
            </FormField>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <FormField label="Previous Department" error={errors.previousDepartment?.message}>
              <Input {...register('previousDepartment')} placeholder="Previous dept" />
            </FormField>
            <FormField label="New Department" error={errors.newDepartment?.message}>
              <Input {...register('newDepartment')} placeholder="New dept" />
            </FormField>
          </div>
        </>
      )}

      {/* Employment Type Change Fields */}
      {showTypeFields && (
        <div className="grid gap-4 grid-cols-2">
          <FormField label="Previous Employment Type" error={errors.previousEmploymentType?.message}>
            <Select
              value={watch('previousEmploymentType') || ''}
              onValueChange={(v) => setValue('previousEmploymentType', v as CreateEmploymentRecordInput['previousEmploymentType'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {employmentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="New Employment Type" error={errors.newEmploymentType?.message}>
            <Select
              value={watch('newEmploymentType') || ''}
              onValueChange={(v) => setValue('newEmploymentType', v as CreateEmploymentRecordInput['newEmploymentType'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {employmentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      )}

      {/* Status Change Fields */}
      {showStatusFields && (
        <div className="grid gap-4 grid-cols-2">
          <FormField label="Previous Status" error={errors.previousStatus?.message}>
            <Select
              value={watch('previousStatus') || ''}
              onValueChange={(v) => setValue('previousStatus', v as CreateEmploymentRecordInput['previousStatus'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
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
          <FormField label="New Status" error={errors.newStatus?.message}>
            <Select
              value={watch('newStatus') || ''}
              onValueChange={(v) => setValue('newStatus', v as CreateEmploymentRecordInput['newStatus'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
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
      )}

      <FormField label="Reason" error={errors.reason?.message}>
        <Input {...register('reason')} placeholder="Reason for this change" />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Additional notes..." rows={3} />
      </FormField>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}
