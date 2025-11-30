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
import { createStaffDocumentSchema, type CreateStaffDocumentInput } from '@/lib/validations/staff';

interface DocumentUploadFormProps {
  staffProfileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'ID', label: 'ID Document' },
  { value: 'TAX', label: 'Tax Document' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'BACKGROUND', label: 'Background Check' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'PERFORMANCE', label: 'Performance Review' },
  { value: 'DISCIPLINARY', label: 'Disciplinary' },
  { value: 'OTHER', label: 'Other' },
];

const accessLevelOptions = [
  { value: 'PUBLIC', label: 'Public - Anyone can view' },
  { value: 'STAFF_ONLY', label: 'Staff Only' },
  { value: 'HR_ONLY', label: 'HR Only' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'CONFIDENTIAL', label: 'Confidential' },
];

export function DocumentUploadForm({ staffProfileId, onSuccess, onCancel }: DocumentUploadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStaffDocumentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createStaffDocumentSchema) as any,
    defaultValues: {
      staffProfileId,
      accessLevel: 'HR_ONLY',
    },
  });

  const onSubmit = async (data: CreateStaffDocumentInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${staffProfileId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add document');
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

      <FormField label="Document Name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g., Employment Contract 2024" />
      </FormField>

      <FormField label="Category" required error={errors.category?.message}>
        <Select
          value={watch('category')}
          onValueChange={(v) => setValue('category', v as CreateStaffDocumentInput['category'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Access Level" required error={errors.accessLevel?.message}>
        <Select
          value={watch('accessLevel')}
          onValueChange={(v) => setValue('accessLevel', v as CreateStaffDocumentInput['accessLevel'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accessLevelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Note: In production, this would be replaced with actual file upload
          using a service like S3 or local storage. For now, we accept a URL. */}
      <FormField
        label="File URL"
        required
        error={errors.fileUrl?.message}
        description="Enter the URL where the document is stored"
      >
        <Input {...register('fileUrl')} placeholder="https://..." />
      </FormField>

      <FormField label="Original Filename" required error={errors.fileName?.message}>
        <Input {...register('fileName')} placeholder="contract.pdf" />
      </FormField>

      <FormField label="MIME Type" error={errors.mimeType?.message}>
        <Input {...register('mimeType')} placeholder="application/pdf" />
      </FormField>

      <FormField label="File Size (bytes)" error={errors.fileSize?.message}>
        <Input
          {...register('fileSize', { valueAsNumber: true })}
          type="number"
          placeholder="0"
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} placeholder="Brief description of this document..." rows={2} />
      </FormField>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Document'}
        </Button>
      </div>
    </form>
  );
}
