'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Equipment {
  id: string;
  name: string;
  equipmentNumber: string;
}

const validationTypes = [
  { value: 'BOWIE_DICK_TEST', label: 'Bowie-Dick Test', frequency: 1 },
  { value: 'CALIBRATION', label: 'Calibration', frequency: 365 },
  { value: 'ANNUAL_VALIDATION', label: 'Annual Validation', frequency: 365 },
  { value: 'PREVENTIVE_MAINTENANCE', label: 'Preventive Maintenance', frequency: 90 },
  { value: 'INSTALLATION_QUALIFICATION', label: 'Installation Qualification (IQ)', frequency: null },
  { value: 'OPERATIONAL_QUALIFICATION', label: 'Operational Qualification (OQ)', frequency: null },
  { value: 'PERFORMANCE_QUALIFICATION', label: 'Performance Qualification (PQ)', frequency: null },
  { value: 'LEAK_RATE_TEST', label: 'Leak Rate Test', frequency: 30 },
  { value: 'REPAIR_VERIFICATION', label: 'Repair Verification', frequency: null },
];

const resultOptions = [
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'CONDITIONAL', label: 'Conditional (Pass with Notes)' },
];

export default function NewValidationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    equipmentId: '',
    validationType: '',
    validationDate: format(new Date(), 'yyyy-MM-dd'),
    result: 'PASS',
    performedBy: '',
    vendorName: '',
    technicianName: '',
    certificateNumber: '',
    certificateExpiry: '',
    notes: '',
    failureDetails: '',
    correctiveAction: '',
  });

  // Fetch sterilization equipment
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await fetch('/api/resources/equipment?category=STERILIZATION&pageSize=100');
        const data = await res.json();
        if (data.success) {
          setEquipment(data.data.items || []);
        }
      } catch {
        console.error('Failed to fetch equipment');
      } finally {
        setLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
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

    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Equipment is required';
    }
    if (!formData.validationType) {
      newErrors.validationType = 'Validation type is required';
    }
    if (!formData.validationDate) {
      newErrors.validationDate = 'Date is required';
    }
    if (!formData.performedBy) {
      newErrors.performedBy = 'Performed by is required';
    }
    if (formData.result === 'FAIL' && !formData.failureDetails) {
      newErrors.failureDetails = 'Failure details are required for failed validations';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Calculate next validation due based on type
      const selectedType = validationTypes.find((t) => t.value === formData.validationType);
      let nextValidationDue = null;
      if (selectedType?.frequency) {
        const nextDate = new Date(formData.validationDate);
        nextDate.setDate(nextDate.getDate() + selectedType.frequency);
        nextValidationDue = nextDate.toISOString();
      }

      const res = await fetch('/api/resources/sterilization/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          validationDate: new Date(formData.validationDate).toISOString(),
          nextValidationDue,
          certificateExpiry: formData.certificateExpiry
            ? new Date(formData.certificateExpiry).toISOString()
            : null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create validation');
      }

      router.push('/resources/sterilization/validations');
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Log Equipment Validation"
        description="Record a new validation, calibration, or maintenance activity"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'Validations', href: '/resources/sterilization/validations' },
          { label: 'New' },
        ]}
      />
      <PageContent density="comfortable">
        <form onSubmit={handleSubmit}>
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Error Banner */}
            {errors.submit && (
              <Card className="border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
                <CardContent className="py-3">
                  <p className="text-error-700 dark:text-error-400">{errors.submit}</p>
                </CardContent>
              </Card>
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Validation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Equipment" required error={errors.equipmentId}>
                    <Select
                      value={formData.equipmentId}
                      onValueChange={(v) => handleChange('equipmentId', v)}
                      disabled={loadingEquipment}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingEquipment ? 'Loading...' : 'Select equipment'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} ({eq.equipmentNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Validation Type" required error={errors.validationType}>
                    <Select
                      value={formData.validationType}
                      onValueChange={(v) => handleChange('validationType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {validationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Validation Date" required error={errors.validationDate}>
                    <Input
                      type="date"
                      value={formData.validationDate}
                      onChange={(e) => handleChange('validationDate', e.target.value)}
                    />
                  </FormField>

                  <FormField label="Result" required>
                    <Select
                      value={formData.result}
                      onValueChange={(v) => handleChange('result', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resultOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Performer Info */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Performed By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Performed By"
                    required
                    error={errors.performedBy}
                    description="Name of person or company who performed the validation"
                  >
                    <Input
                      value={formData.performedBy}
                      onChange={(e) => handleChange('performedBy', e.target.value)}
                      placeholder="e.g., Service Tech, ABC Medical"
                    />
                  </FormField>

                  <FormField label="Vendor/Company Name">
                    <Input
                      value={formData.vendorName}
                      onChange={(e) => handleChange('vendorName', e.target.value)}
                      placeholder="e.g., Sterilizer Services Inc."
                    />
                  </FormField>
                </div>

                <FormField label="Technician Name">
                  <Input
                    value={formData.technicianName}
                    onChange={(e) => handleChange('technicianName', e.target.value)}
                    placeholder="Technician's name (if applicable)"
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Certificate Info */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Certificate Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Certificate Number">
                    <Input
                      value={formData.certificateNumber}
                      onChange={(e) => handleChange('certificateNumber', e.target.value)}
                      placeholder="e.g., CERT-2024-001234"
                    />
                  </FormField>

                  <FormField label="Certificate Expiry">
                    <Input
                      type="date"
                      value={formData.certificateExpiry}
                      onChange={(e) => handleChange('certificateExpiry', e.target.value)}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Failure Details (conditional) */}
            {formData.result === 'FAIL' && (
              <Card className="border-error-200 dark:border-error-800">
                <CardHeader>
                  <CardTitle size="sm" className="text-error-700 dark:text-error-400">
                    Failure Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    label="Failure Details"
                    required
                    error={errors.failureDetails}
                    description="Describe what failed and why"
                  >
                    <Textarea
                      value={formData.failureDetails}
                      onChange={(e) => handleChange('failureDetails', e.target.value)}
                      placeholder="Describe the failure..."
                      rows={3}
                    />
                  </FormField>

                  <FormField
                    label="Corrective Action"
                    description="What steps were or will be taken to address the failure"
                  >
                    <Textarea
                      value={formData.correctiveAction}
                      onChange={(e) => handleChange('correctiveAction', e.target.value)}
                      placeholder="Describe corrective actions..."
                      rows={3}
                    />
                  </FormField>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField label="Notes">
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Any additional notes or observations..."
                    rows={3}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link href="/resources/sterilization/validations">
                <Button type="button" variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Validation
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </PageContent>
    </>
  );
}
