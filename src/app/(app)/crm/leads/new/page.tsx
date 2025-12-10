'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Save } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const sourceOptions = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'REFERRAL_DENTIST', label: 'Dentist Referral' },
  { value: 'REFERRAL_PATIENT', label: 'Patient Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'INSURANCE_DIRECTORY', label: 'Insurance Directory' },
  { value: 'OTHER', label: 'Other' },
];

const contactOptions = [
  { value: 'PHONE', label: 'Phone' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TEXT', label: 'Text/SMS' },
];

const patientTypeOptions = [
  { value: 'NEW_PATIENT', label: 'New Patient' },
  { value: 'TRANSFER', label: 'Transfer Patient' },
  { value: 'RETURNING', label: 'Returning Patient' },
];

const urgencyOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'within_month', label: 'Within a Month' },
  { value: 'exploring', label: 'Just Exploring' },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'PHONE',
    source: 'PHONE_CALL',
    sourceDetails: '',
    patientType: 'NEW_PATIENT',
    patientAge: '',
    isMinor: false,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    primaryConcern: '',
    treatmentInterest: '',
    urgency: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.isMinor && !formData.guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required for minors';
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
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          sourceDetails: formData.sourceDetails || null,
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
          guardianName: formData.guardianName || null,
          guardianPhone: formData.guardianPhone || null,
          guardianEmail: formData.guardianEmail || null,
          primaryConcern: formData.primaryConcern || null,
          treatmentInterest: formData.treatmentInterest || null,
          urgency: formData.urgency || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create lead');
      }

      router.push(`/crm/leads/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add New Lead"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Leads', href: '/crm/leads' },
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

          {/* Contact Information */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Doe"
                />
              </FormField>

              <FormField label="Phone" required error={errors.phone}>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </FormField>

              <FormField label="Email" error={errors.email}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </FormField>

              <FormField label="Preferred Contact Method">
                <Select
                  value={formData.preferredContact}
                  onValueChange={(v) => handleChange('preferredContact', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Lead Source */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Lead Source</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Source" required>
                <Select
                  value={formData.source}
                  onValueChange={(v) => handleChange('source', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Source Details">
                <Input
                  value={formData.sourceDetails}
                  onChange={(e) => handleChange('sourceDetails', e.target.value)}
                  placeholder="Campaign name, referrer name, etc."
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Patient Information</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Patient Type">
                  <Select
                    value={formData.patientType}
                    onValueChange={(v) => handleChange('patientType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {patientTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Age">
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.patientAge}
                    onChange={(e) => handleChange('patientAge', e.target.value)}
                    placeholder="25"
                  />
                </FormField>

                <FormField label="Urgency">
                  <Select
                    value={formData.urgency}
                    onValueChange={(v) => handleChange('urgency', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMinor"
                  checked={formData.isMinor}
                  onCheckedChange={(checked) => handleChange('isMinor', checked === true)}
                />
                <Label htmlFor="isMinor">Patient is a minor</Label>
              </div>

              {formData.isMinor && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <FormField label="Guardian Name" required error={errors.guardianName}>
                    <Input
                      value={formData.guardianName}
                      onChange={(e) => handleChange('guardianName', e.target.value)}
                      placeholder="Parent/Guardian name"
                    />
                  </FormField>

                  <FormField label="Guardian Phone">
                    <Input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => handleChange('guardianPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </FormField>

                  <FormField label="Guardian Email">
                    <Input
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => handleChange('guardianEmail', e.target.value)}
                      placeholder="guardian@example.com"
                    />
                  </FormField>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interest */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Interest & Concerns</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Primary Concern">
                <Input
                  value={formData.primaryConcern}
                  onChange={(e) => handleChange('primaryConcern', e.target.value)}
                  placeholder="Crooked teeth, overbite, spacing issues..."
                />
              </FormField>

              <FormField label="Treatment Interest">
                <Input
                  value={formData.treatmentInterest}
                  onChange={(e) => handleChange('treatmentInterest', e.target.value)}
                  placeholder="Braces, Invisalign, retainer..."
                />
              </FormField>

              <FormField label="Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes about this lead..."
                  rows={3}
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
              {isSubmitting ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
