'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Save } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';

const typeOptions = [
  { value: 'GENERAL_DENTIST', label: 'General Dentist' },
  { value: 'PEDIATRIC_DENTIST', label: 'Pediatric Dentist' },
  { value: 'ORAL_SURGEON', label: 'Oral Surgeon' },
  { value: 'PERIODONTIST', label: 'Periodontist' },
  { value: 'ENDODONTIST', label: 'Endodontist' },
  { value: 'PROSTHODONTIST', label: 'Prosthodontist' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PREFERRED', label: 'Preferred' },
];

export default function NewReferrerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'GENERAL_DENTIST',
    practiceName: '',
    firstName: '',
    lastName: '',
    credentials: '',
    email: '',
    phone: '',
    fax: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.practiceName.trim()) {
      newErrors.practiceName = 'Practice name is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/referrers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
          fax: formData.fax || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null,
          credentials: formData.credentials || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create referrer');
      }

      router.push(`/crm/referrers/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Referring Provider"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Referrers', href: '/crm/referrers' },
          { label: 'New' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <PageContent density="comfortable">
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Provider Information */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Provider Information
              </CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Provider Type" required>
                <Select
                  value={formData.type}
                  onValueChange={(v) => handleChange('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Practice Name" required error={errors.practiceName}>
                <Input
                  value={formData.practiceName}
                  onChange={(e) => handleChange('practiceName', e.target.value)}
                  placeholder="ABC Dental"
                />
              </FormField>

              <FormField label="First Name" required error={errors.firstName}>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </FormField>

              <FormField label="Last Name" required error={errors.lastName}>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Smith"
                />
              </FormField>

              <FormField label="Credentials">
                <Input
                  value={formData.credentials}
                  onChange={(e) => handleChange('credentials', e.target.value)}
                  placeholder="DDS, DMD"
                />
              </FormField>

              <FormField label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleChange('status', v)}
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
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Contact Information</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email" error={errors.email}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="office@abcdental.com"
                />
              </FormField>

              <FormField label="Phone">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </FormField>

              <FormField label="Fax">
                <Input
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => handleChange('fax', e.target.value)}
                  placeholder="(555) 123-4568"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Address</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField label="Street Address">
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </FormField>
              </div>

              <FormField label="City">
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Toronto"
                />
              </FormField>

              <FormField label="Province/State">
                <Input
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="ON"
                />
              </FormField>

              <FormField label="Postal Code">
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="M5V 1A1"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Notes</CardTitle>
            </CardHeader>
            <CardContent compact>
              <FormField label="Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes about this referring provider..."
                  rows={4}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Referrer'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
