'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCredentialSchema, type CreateCredentialInput } from '@/lib/validations/staff';

interface CredentialFormProps {
  staffProfileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const credentialTypeOptions = [
  { value: 'STATE_LICENSE', label: 'State License' },
  { value: 'DEA_REGISTRATION', label: 'DEA Registration' },
  { value: 'NPI', label: 'NPI' },
  { value: 'BOARD_CERTIFICATION', label: 'Board Certification' },
  { value: 'SPECIALTY_CERTIFICATION', label: 'Specialty Certification' },
  { value: 'RADIOLOGY_LICENSE', label: 'Radiology License' },
  { value: 'SEDATION_PERMIT', label: 'Sedation Permit' },
  { value: 'CONTROLLED_SUBSTANCE', label: 'Controlled Substance' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RENEWAL_PENDING', label: 'Renewal Pending' },
];

export function CredentialForm({ staffProfileId, onSuccess, onCancel }: CredentialFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCredentialInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCredentialSchema) as any,
    defaultValues: {
      staffProfileId,
      status: 'ACTIVE',
      issueDate: new Date(),
    },
  });

  const onSubmit = async (data: CreateCredentialInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${staffProfileId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add credential');
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

      <FormField label="Credential Type" required error={errors.type?.message}>
        <Select
          value={watch('type')}
          onValueChange={(v) => setValue('type', v as CreateCredentialInput['type'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {credentialTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Credential Name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g., Ontario Dental License" />
      </FormField>

      <FormField label="Credential Number" required error={errors.number?.message}>
        <Input {...register('number')} placeholder="License or registration number" />
      </FormField>

      <FormField label="Issuing Authority" required error={errors.issuingAuthority?.message}>
        <Input {...register('issuingAuthority')} placeholder="e.g., Ontario Dental Association" />
      </FormField>

      <FormField label="Issuing State/Province" error={errors.issuingState?.message}>
        <Input {...register('issuingState')} placeholder="e.g., ON" />
      </FormField>

      <div className="grid gap-4 grid-cols-2">
        <FormField label="Issue Date" required error={errors.issueDate?.message}>
          <Input {...register('issueDate')} type="date" />
        </FormField>

        <FormField label="Expiration Date" error={errors.expirationDate?.message}>
          <Input {...register('expirationDate')} type="date" />
        </FormField>
      </div>

      <FormField label="Status" required error={errors.status?.message}>
        <Select
          value={watch('status')}
          onValueChange={(v) => setValue('status', v as CreateCredentialInput['status'])}
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Credential'}
        </Button>
      </div>
    </form>
  );
}
