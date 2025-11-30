'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  createStaffProfileSchema,
  type CreateStaffProfileInput,
} from '@/lib/validations/staff';

interface StaffProfileFormProps {
  initialData?: Partial<CreateStaffProfileInput>;
  staffId?: string;
  mode: 'create' | 'edit';
}

const employmentTypeOptions = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PRN', label: 'PRN (As Needed)' },
  { value: 'TEMP', label: 'Temporary' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'PENDING', label: 'Pending Start' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const providerTypeOptions = [
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

export function StaffProfileForm({ initialData, staffId, mode }: StaffProfileFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStaffProfileInput>({
    resolver: zodResolver(createStaffProfileSchema),
    defaultValues: {
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      country: 'CA',
      isProvider: false,
      ...initialData,
      hireDate: initialData?.hireDate
        ? new Date(initialData.hireDate)
        : new Date(),
    },
  });

  const isProvider = watch('isProvider');

  const onSubmit = async (data: CreateStaffProfileInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/staff/${staffId}` : '/api/staff';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save staff profile');
      }

      router.push(`/staff/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card variant="ghost" className="border-error-200 bg-error-50">
          <CardContent className="p-4 text-error-700">{error}</CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Employee Number" required error={errors.employeeNumber?.message}>
            <Input {...register('employeeNumber')} placeholder="EMP001" />
          </FormField>

          <FormField label="Email" required error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="john@clinic.com" />
          </FormField>

          <FormField label="First Name" required error={errors.firstName?.message}>
            <Input {...register('firstName')} placeholder="John" />
          </FormField>

          <FormField label="Last Name" required error={errors.lastName?.message}>
            <Input {...register('lastName')} placeholder="Doe" />
          </FormField>

          <FormField label="Middle Name" error={errors.middleName?.message}>
            <Input {...register('middleName')} placeholder="Optional" />
          </FormField>

          <FormField label="Preferred Name" error={errors.preferredName?.message}>
            <Input {...register('preferredName')} placeholder="Optional" />
          </FormField>

          <FormField label="Phone" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="(555) 123-4567" />
          </FormField>

          <FormField label="Mobile Phone" error={errors.mobilePhone?.message}>
            <Input {...register('mobilePhone')} placeholder="(555) 987-6543" />
          </FormField>

          <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
            <Input {...register('dateOfBirth')} type="date" />
          </FormField>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Employment Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Employment Type" required error={errors.employmentType?.message}>
            <Select
              value={watch('employmentType')}
              onValueChange={(v) => setValue('employmentType', v as CreateStaffProfileInput['employmentType'])}
            >
              <SelectTrigger>
                <SelectValue />
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

          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as CreateStaffProfileInput['status'])}
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

          <FormField label="Hire Date" required error={errors.hireDate?.message}>
            <Input {...register('hireDate')} type="date" />
          </FormField>

          <FormField label="Title" error={errors.title?.message}>
            <Input {...register('title')} placeholder="e.g., Senior Orthodontist" />
          </FormField>

          <FormField label="Department" error={errors.department?.message}>
            <Input {...register('department')} placeholder="e.g., Clinical" />
          </FormField>
        </CardContent>
      </Card>

      {/* Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Provider Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="isProvider"
              checked={isProvider}
              onCheckedChange={(checked) => setValue('isProvider', checked)}
            />
            <Label htmlFor="isProvider">This staff member is a provider</Label>
          </div>

          {isProvider && (
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              <FormField label="Provider Type" error={errors.providerType?.message}>
                <Select
                  value={watch('providerType') || ''}
                  onValueChange={(v) => setValue('providerType', v as CreateStaffProfileInput['providerType'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="NPI Number" error={errors.npiNumber?.message}>
                <Input {...register('npiNumber')} placeholder="10-digit NPI" maxLength={10} />
              </FormField>

              <FormField label="DEA Number" error={errors.deaNumber?.message}>
                <Input {...register('deaNumber')} placeholder="DEA registration number" />
              </FormField>

              <FormField label="State License Number" error={errors.stateLicenseNumber?.message}>
                <Input {...register('stateLicenseNumber')} placeholder="License number" />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Street Address" error={errors.address?.message} className="md:col-span-2">
            <Input {...register('address')} placeholder="123 Main St" />
          </FormField>

          <FormField label="City" error={errors.city?.message}>
            <Input {...register('city')} placeholder="Toronto" />
          </FormField>

          <FormField label="State/Province" error={errors.state?.message}>
            <Input {...register('state')} placeholder="ON" />
          </FormField>

          <FormField label="Postal Code" error={errors.postalCode?.message}>
            <Input {...register('postalCode')} placeholder="M5V 1A1" />
          </FormField>

          <FormField label="Country" error={errors.country?.message}>
            <Input {...register('country')} placeholder="CA" />
          </FormField>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes about this staff member..."
              rows={4}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Staff'}
        </Button>
      </div>
    </form>
  );
}
