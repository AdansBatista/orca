'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  Save,
  AlertCircle,
  Loader2,
  Clock,
  DollarSign,
  Zap,
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageHeader, PageContent } from '@/components/layout';

interface Vendor {
  id: string;
  name: string;
  code: string;
}

const categoryOptions = [
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
  description: string;
  sku: string;
  category: string;
  vendorId: string;
  standardTurnaround: string;
  rushTurnaround: string;
  basePrice: string;
  rushUpchargePercent: string;
  isActive: boolean;
}

/**
 * Inner component that uses useSearchParams
 * Must be wrapped in Suspense for Next.js 15 App Router
 */
function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get('vendorId');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sku: '',
    category: 'RETAINER',
    vendorId: preselectedVendorId || '',
    standardTurnaround: '7',
    rushTurnaround: '',
    basePrice: '',
    rushUpchargePercent: '50',
    isActive: true,
  });

  // Load vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/lab/vendors?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setVendors(result.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      }
    };
    fetchVendors();
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.standardTurnaround || isNaN(parseInt(formData.standardTurnaround))) {
      newErrors.standardTurnaround = 'Standard turnaround must be a number';
    }

    if (formData.rushTurnaround && isNaN(parseInt(formData.rushTurnaround))) {
      newErrors.rushTurnaround = 'Rush turnaround must be a number';
    }

    if (formData.basePrice && isNaN(parseFloat(formData.basePrice))) {
      newErrors.basePrice = 'Base price must be a number';
    }

    if (formData.rushUpchargePercent && isNaN(parseFloat(formData.rushUpchargePercent))) {
      newErrors.rushUpchargePercent = 'Rush upcharge must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create product
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        category: formData.category,
        vendorId: formData.vendorId || null,
        standardTurnaround: parseInt(formData.standardTurnaround),
        rushTurnaround: formData.rushTurnaround ? parseInt(formData.rushTurnaround) : null,
        isActive: formData.isActive,
      };

      const productResponse = await fetch('/api/lab/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      const productResult = await productResponse.json();

      if (!productResult.success) {
        throw new Error(productResult.error?.message || 'Failed to create product');
      }

      const productId = productResult.data.id;

      // Create fee schedule if vendor and price are provided
      if (formData.vendorId && formData.basePrice) {
        const feePayload = {
          vendorId: formData.vendorId,
          productId,
          basePrice: parseFloat(formData.basePrice),
          rushUpchargePercent: formData.rushUpchargePercent ? parseFloat(formData.rushUpchargePercent) : 50,
          effectiveDate: new Date().toISOString(),
          isActive: true,
        };

        // Note: We need a fee schedule API endpoint - for now, we'll skip this
        // await fetch('/api/lab/fee-schedules', { ... });
        console.log('Fee payload (not saved):', feePayload);
      }

      router.push(`/lab/products/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Product"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Products', href: '/lab/products' },
          { label: 'New Product' },
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
              Save Product
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-3xl mx-auto space-y-6">
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
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
              <CardDescription>
                Enter the product details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Product Name" required error={errors.name}>
                <Input
                  placeholder="e.g., Hawley Retainer"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  placeholder="Describe this product..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category" required error={errors.category}>
                  <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger>
                      <SelectValue />
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

                <FormField label="SKU">
                  <Input
                    placeholder="Product SKU"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Lab Vendor" description="Optional - leave empty for clinic-wide product">
                <Select value={formData.vendorId} onValueChange={(v) => updateField('vendorId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific vendor</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">[{vendor.code}]</span>
                          {vendor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div>
                    <Label htmlFor="active-toggle" className="font-medium">
                      Active Product
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Inactive products cannot be added to orders
                    </p>
                  </div>
                </div>
                <Switch
                  id="active-toggle"
                  checked={formData.isActive}
                  onCheckedChange={(v) => updateField('isActive', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Turnaround Times */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Turnaround Times
              </CardTitle>
              <CardDescription>
                Set expected production times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Standard Turnaround (Days)" required error={errors.standardTurnaround}>
                  <Input
                    type="number"
                    min={1}
                    placeholder="7"
                    value={formData.standardTurnaround}
                    onChange={(e) => updateField('standardTurnaround', e.target.value)}
                  />
                </FormField>

                <FormField label="Rush Turnaround (Days)" error={errors.rushTurnaround}>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warning-600" />
                    <Input
                      type="number"
                      min={1}
                      placeholder="3"
                      value={formData.rushTurnaround}
                      onChange={(e) => updateField('rushTurnaround', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>
                Set the base price for this product (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Base Price" error={errors.basePrice}>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={formData.basePrice}
                      onChange={(e) => updateField('basePrice', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Rush Upcharge (%)" error={errors.rushUpchargePercent}>
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    placeholder="50"
                    value={formData.rushUpchargePercent}
                    onChange={(e) => updateField('rushUpchargePercent', e.target.value)}
                  />
                </FormField>
              </div>

              {formData.basePrice && formData.rushUpchargePercent && (
                <div className="p-3 bg-warning-50 rounded-lg text-sm">
                  <p className="text-warning-800">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Rush price: ${(parseFloat(formData.basePrice) * (1 + parseFloat(formData.rushUpchargePercent) / 100)).toFixed(2)}
                  </p>
                </div>
              )}
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
                  Save Product
                </>
              )}
            </Button>
          </div>
        </div>
      </PageContent>
    </>
  );
}

/**
 * Loading fallback for Suspense boundary
 */
function NewProductLoading() {
  return (
    <>
      <PageHeader
        title="Add Product"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Products', href: '/lab/products' },
          { label: 'New Product' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContent>
    </>
  );
}

/**
 * Main page component wrapped in Suspense boundary
 *
 * IMPORTANT: useSearchParams() requires a Suspense boundary in Next.js 15 App Router.
 * @see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
 */
export default function NewProductPage() {
  return (
    <Suspense fallback={<NewProductLoading />}>
      <NewProductContent />
    </Suspense>
  );
}
