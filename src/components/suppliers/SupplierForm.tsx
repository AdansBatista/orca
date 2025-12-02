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
  createSupplierSchema,
  type CreateSupplierInput,
} from '@/lib/validations/equipment';

interface SupplierFormProps {
  initialData?: Partial<CreateSupplierInput>;
  supplierId?: string;
  mode: 'create' | 'edit';
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const orderMethodOptions = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PORTAL', label: 'Online Portal' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'FAX', label: 'Fax' },
  { value: 'EDI', label: 'EDI' },
];

export function SupplierForm({ initialData, supplierId, mode }: SupplierFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSupplierInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSupplierSchema) as any,
    defaultValues: {
      status: 'ACTIVE',
      orderMethod: 'EMAIL',
      defaultLeadTimeDays: 7,
      taxExempt: false,
      isPreferred: false,
      ...initialData,
    },
  });

  const onSubmit = async (data: CreateSupplierInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/suppliers/${supplierId}`
        : '/api/resources/suppliers';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save supplier');
      }

      router.push(`/resources/suppliers/${result.data.id}`);
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
          <FormField label="Supplier Name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Henry Schein Dental" />
          </FormField>

          <FormField label="Supplier Code" required error={errors.code?.message}>
            <Input
              {...register('code')}
              placeholder="HENRY_SCHEIN"
              className="uppercase"
            />
          </FormField>

          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status') || 'ACTIVE'}
              onValueChange={(v) => setValue('status', v as CreateSupplierInput['status'])}
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

          <FormField label="Account Number" error={errors.accountNumber?.message}>
            <Input {...register('accountNumber')} placeholder="Optional" />
          </FormField>

          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              id="isPreferred"
              checked={watch('isPreferred')}
              onCheckedChange={(checked) => setValue('isPreferred', checked)}
            />
            <Label htmlFor="isPreferred">Preferred supplier</Label>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Contact Name" error={errors.contactName?.message}>
            <Input {...register('contactName')} placeholder="Primary contact name" />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="orders@supplier.com" />
          </FormField>

          <FormField label="Phone" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="(555) 123-4567" />
          </FormField>

          <FormField label="Fax" error={errors.fax?.message}>
            <Input {...register('fax')} placeholder="(555) 123-4568" />
          </FormField>

          <FormField label="Website" error={errors.website?.message} className="md:col-span-2">
            <Input {...register('website')} type="url" placeholder="https://www.supplier.com" />
          </FormField>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Street Address" error={errors.address?.message} className="md:col-span-2">
            <Input {...register('address')} placeholder="123 Supply Drive" />
          </FormField>

          <FormField label="City" error={errors.city?.message}>
            <Input {...register('city')} placeholder="New York" />
          </FormField>

          <FormField label="State/Province" error={errors.state?.message}>
            <Input {...register('state')} placeholder="NY" />
          </FormField>

          <FormField label="Postal Code" error={errors.postalCode?.message}>
            <Input {...register('postalCode')} placeholder="10001" />
          </FormField>

          <FormField label="Country" error={errors.country?.message}>
            <Input {...register('country')} placeholder="USA" />
          </FormField>
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Order Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Preferred Order Method" error={errors.orderMethod?.message}>
            <Select
              value={watch('orderMethod') || 'EMAIL'}
              onValueChange={(v) => setValue('orderMethod', v as CreateSupplierInput['orderMethod'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orderMethodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Lead Time (Days)" error={errors.defaultLeadTimeDays?.message}>
            <Input
              {...register('defaultLeadTimeDays', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="7"
            />
          </FormField>

          <FormField label="Minimum Order ($)" error={errors.minimumOrder?.message}>
            <Input
              {...register('minimumOrder', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Free Shipping Threshold ($)" error={errors.freeShippingThreshold?.message}>
            <Input
              {...register('freeShippingThreshold', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
            <Input {...register('paymentTerms')} placeholder="e.g., Net 30" />
          </FormField>

          <div className="flex items-center gap-3">
            <Switch
              id="taxExempt"
              checked={watch('taxExempt')}
              onCheckedChange={(checked) => setValue('taxExempt', checked)}
            />
            <Label htmlFor="taxExempt">Tax exempt</Label>
          </div>
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
              placeholder="Additional notes about this supplier..."
              rows={4}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Supplier'}
        </Button>
      </div>
    </form>
  );
}
