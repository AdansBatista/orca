'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Save,
  AlertCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Link as LinkIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { PageHeader, PageContent } from '@/components/layout';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
];

const carrierOptions = [
  { value: 'FEDEX', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'USPS', label: 'USPS' },
  { value: 'DHL', label: 'DHL' },
  { value: 'LAB_COURIER', label: 'Lab Courier' },
  { value: 'OTHER', label: 'Other' },
];

const capabilityOptions = [
  { value: 'RETAINER', label: 'Retainers' },
  { value: 'APPLIANCE', label: 'Appliances' },
  { value: 'ALIGNER', label: 'Aligners' },
  { value: 'INDIRECT_BONDING', label: 'Indirect Bonding' },
  { value: 'ARCHWIRE', label: 'Archwires' },
  { value: 'MODEL', label: 'Models' },
  { value: 'SURGICAL', label: 'Surgical' },
  { value: 'OTHER', label: 'Other' },
];

interface FormData {
  name: string;
  code: string;
  legalName: string;
  taxId: string;
  website: string;
  accountNumber: string;
  status: string;
  primaryPhone: string;
  primaryEmail: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  portalUrl: string;
  apiEndpoint: string;
  capabilities: string[];
  specialties: string;
  defaultCarrier: string;
  shippingAccountNumber: string;
  paymentTerms: string;
  billingEmail: string;
}

export default function NewVendorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    legalName: '',
    taxId: '',
    website: '',
    accountNumber: '',
    status: 'ACTIVE',
    primaryPhone: '',
    primaryEmail: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    portalUrl: '',
    apiEndpoint: '',
    capabilities: [],
    specialties: '',
    defaultCarrier: '',
    shippingAccountNumber: '',
    paymentTerms: '30',
    billingEmail: '',
  });

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const toggleCapability = (capability: string) => {
    const current = formData.capabilities;
    if (current.includes(capability)) {
      updateField('capabilities', current.filter((c) => c !== capability));
    } else {
      updateField('capabilities', [...current, capability]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Code must be uppercase letters, numbers, underscores, and hyphens';
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Invalid email format';
    }

    if (formData.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      newErrors.billingEmail = 'Invalid email format';
    }

    if (formData.paymentTerms && isNaN(parseInt(formData.paymentTerms))) {
      newErrors.paymentTerms = 'Payment terms must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        legalName: formData.legalName.trim() || null,
        taxId: formData.taxId.trim() || null,
        website: formData.website.trim() || null,
        accountNumber: formData.accountNumber.trim() || null,
        status: formData.status,
        primaryPhone: formData.primaryPhone.trim() || null,
        primaryEmail: formData.primaryEmail.trim() || null,
        address: {
          street: formData.street.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip: formData.zip.trim() || null,
          country: formData.country.trim() || null,
        },
        portalUrl: formData.portalUrl.trim() || null,
        apiEndpoint: formData.apiEndpoint.trim() || null,
        capabilities: formData.capabilities,
        specialties: formData.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        defaultCarrier: formData.defaultCarrier || null,
        shippingAccountNumber: formData.shippingAccountNumber.trim() || null,
        paymentTerms: formData.paymentTerms ? parseInt(formData.paymentTerms) : 30,
        billingEmail: formData.billingEmail.trim() || null,
      };

      const response = await fetch('/api/lab/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create vendor');
      }

      router.push(`/lab/vendors/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Lab Vendor"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Vendors', href: '/lab/vendors' },
          { label: 'New Vendor' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Vendor
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the vendor's name and identification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Vendor Name" required error={errors.name}>
                  <Input
                    placeholder="e.g., Ortho Lab Solutions"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </FormField>

                <FormField label="Short Code" required error={errors.code}>
                  <Input
                    placeholder="e.g., OLS"
                    value={formData.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Legal Name">
                  <Input
                    placeholder="Full legal business name"
                    value={formData.legalName}
                    onChange={(e) => updateField('legalName', e.target.value)}
                  />
                </FormField>

                <FormField label="Tax ID">
                  <Input
                    placeholder="Tax identification number"
                    value={formData.taxId}
                    onChange={(e) => updateField('taxId', e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Account Number">
                  <Input
                    placeholder="Your account # with this lab"
                    value={formData.accountNumber}
                    onChange={(e) => updateField('accountNumber', e.target.value)}
                  />
                </FormField>

                <FormField label="Status">
                  <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
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

              <FormField label="Website" error={errors.website}>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Primary contact details for order inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Primary Phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="(555) 123-4567"
                      value={formData.primaryPhone}
                      onChange={(e) => updateField('primaryPhone', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Primary Email" error={errors.primaryEmail}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="orders@example.com"
                      value={formData.primaryEmail}
                      onChange={(e) => updateField('primaryEmail', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                <div className="space-y-4">
                  <FormField label="Street Address">
                    <Input
                      placeholder="123 Lab Street"
                      value={formData.street}
                      onChange={(e) => updateField('street', e.target.value)}
                    />
                  </FormField>

                  <div className="grid grid-cols-4 gap-4">
                    <FormField label="City" className="col-span-2">
                      <Input
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </FormField>

                    <FormField label="State">
                      <Input
                        placeholder="CA"
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                      />
                    </FormField>

                    <FormField label="ZIP">
                      <Input
                        placeholder="90210"
                        value={formData.zip}
                        onChange={(e) => updateField('zip', e.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Country">
                    <Input
                      placeholder="USA"
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>
                Select the product categories this lab can produce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {capabilityOptions.map((cap) => (
                  <div key={cap.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={cap.value}
                      checked={formData.capabilities.includes(cap.value)}
                      onCheckedChange={() => toggleCapability(cap.value)}
                    />
                    <Label htmlFor={cap.value} className="text-sm cursor-pointer">
                      {cap.label}
                    </Label>
                  </div>
                ))}
              </div>

              <FormField label="Specialties" description="Comma-separated list of specialties">
                <Textarea
                  placeholder="e.g., Clear aligners, Herbst appliances, Digital workflows"
                  value={formData.specialties}
                  onChange={(e) => updateField('specialties', e.target.value)}
                  rows={2}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Shipping & Billing */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping & Billing
              </CardTitle>
              <CardDescription>
                Configure shipping and payment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Default Carrier">
                  <Select
                    value={formData.defaultCarrier}
                    onValueChange={(v) => updateField('defaultCarrier', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {carrierOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Shipping Account #">
                  <Input
                    placeholder="Carrier account number"
                    value={formData.shippingAccountNumber}
                    onChange={(e) => updateField('shippingAccountNumber', e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Payment Terms (Days)" error={errors.paymentTerms}>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.paymentTerms}
                      onChange={(e) => updateField('paymentTerms', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Billing Email" error={errors.billingEmail}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="billing@example.com"
                      value={formData.billingEmail}
                      onChange={(e) => updateField('billingEmail', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Integration */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Integration
              </CardTitle>
              <CardDescription>
                Lab portal and API integration settings (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Lab Portal URL" description="URL to access the lab's order portal">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://portal.example.com"
                    value={formData.portalUrl}
                    onChange={(e) => updateField('portalUrl', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>

              <FormField label="API Endpoint" description="For automated order submission (if supported)">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={formData.apiEndpoint}
                    onChange={(e) => updateField('apiEndpoint', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Vendor
                </>
              )}
            </Button>
          </div>
        </div>
      </PageContent>
    </>
  );
}
