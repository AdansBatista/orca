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
import { createCertificationSchema, type CreateCertificationInput } from '@/lib/validations/staff';

interface CertificationFormProps {
  staffProfileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const certificationTypeOptions = [
  { value: 'CPR_BLS', label: 'CPR/BLS' },
  { value: 'ACLS', label: 'ACLS' },
  { value: 'PALS', label: 'PALS' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'NITROUS_OXIDE', label: 'Nitrous Oxide' },
  { value: 'LASER_CERTIFICATION', label: 'Laser Certification' },
  { value: 'INVISALIGN', label: 'Invisalign' },
  { value: 'SURESMILE', label: 'SureSmile' },
  { value: 'INCOGNITO', label: 'Incognito' },
  { value: 'DAMON', label: 'Damon System' },
  { value: 'INFECTION_CONTROL', label: 'Infection Control' },
  { value: 'HIPAA', label: 'HIPAA' },
  { value: 'OSHA', label: 'OSHA' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
];

export function CertificationForm({ staffProfileId, onSuccess, onCancel }: CertificationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCertificationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCertificationSchema) as any,
    defaultValues: {
      staffProfileId,
      status: 'ACTIVE',
      issueDate: new Date(),
    },
  });

  const onSubmit = async (data: CreateCertificationInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${staffProfileId}/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add certification');
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

      <FormField label="Certification Type" required error={errors.type?.message}>
        <Select
          value={watch('type')}
          onValueChange={(v) => setValue('type', v as CreateCertificationInput['type'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {certificationTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Certification Name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g., Basic Life Support Provider" />
      </FormField>

      <FormField label="Issuing Organization" required error={errors.issuingOrganization?.message}>
        <Input {...register('issuingOrganization')} placeholder="e.g., American Heart Association" />
      </FormField>

      <div className="grid gap-4 grid-cols-2">
        <FormField label="Level" error={errors.level?.message}>
          <Input {...register('level')} placeholder="e.g., Gold, Level 2" />
        </FormField>

        <FormField label="Score" error={errors.score?.message}>
          <Input {...register('score')} placeholder="If applicable" />
        </FormField>
      </div>

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
          onValueChange={(v) => setValue('status', v as CreateCertificationInput['status'])}
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
          {submitting ? 'Adding...' : 'Add Certification'}
        </Button>
      </div>
    </form>
  );
}
