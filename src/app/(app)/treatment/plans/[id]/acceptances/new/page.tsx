'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileSignature } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';

const consentTypeOptions = [
  { value: 'TREATMENT_CONSENT', label: 'Treatment Consent' },
  { value: 'FINANCIAL_AGREEMENT', label: 'Financial Agreement' },
  { value: 'INFORMED_CONSENT', label: 'Informed Consent' },
  { value: 'HIPAA_AUTHORIZATION', label: 'HIPAA Authorization' },
  { value: 'PHOTO_CONSENT', label: 'Photo/Video Consent' },
  { value: 'COMBINED', label: 'Combined Consent Form' },
];

interface TreatmentOption {
  id: string;
  optionNumber: number;
  optionName: string;
  applianceSystem: string;
  estimatedCost: number | null;
  status: string;
}

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
  treatmentOptions: TreatmentOption[];
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
}

const applianceSystemLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal',
  TRADITIONAL_CERAMIC: 'Traditional Ceramic',
  SELF_LIGATING_METAL: 'Self-Ligating Metal',
  SELF_LIGATING_CERAMIC: 'Self-Ligating Ceramic',
  LINGUAL: 'Lingual',
  INVISALIGN: 'Invisalign',
  CLEAR_ALIGNERS_OTHER: 'Clear Aligners',
  COMBINATION: 'Combination',
  OTHER: 'Other',
};

export default function NewCaseAcceptancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: planId } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    selectedOptionId: '',
    consentType: 'COMBINED',
    financialAgreementAmount: '',
    paymentPlanDetails: '',
    insuranceVerified: false,
    patientResponsibility: '',
    requiresGuardianSignature: false,
    guardianName: '',
    guardianRelationship: '',
    witnessId: '',
    specialConditions: '',
    riskDisclosures: '',
    acknowledgements: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, staffRes] = await Promise.all([
          fetch(`/api/treatment-plans/${planId}`),
          fetch('/api/staff?pageSize=100'),
        ]);

        const planData = await planRes.json();
        const staffData = await staffRes.json();

        if (!planData.success) {
          throw new Error(planData.error?.message || 'Failed to fetch treatment plan');
        }

        if (planData.data.status !== 'PRESENTED') {
          setError('Case acceptance forms can only be created for presented plans');
        }

        setPlan(planData.data);

        // Pre-select the selected or recommended option if available
        const selectedOption = planData.data.treatmentOptions?.find(
          (o: TreatmentOption) => o.status === 'SELECTED'
        );
        const recommendedOption = planData.data.treatmentOptions?.find(
          (o: TreatmentOption) => o.status === 'PRESENTED'
        );

        if (selectedOption) {
          setFormData((prev) => ({
            ...prev,
            selectedOptionId: selectedOption.id,
            financialAgreementAmount: selectedOption.estimatedCost?.toString() || '',
          }));
        } else if (recommendedOption) {
          setFormData((prev) => ({
            ...prev,
            selectedOptionId: recommendedOption.id,
            financialAgreementAmount: recommendedOption.estimatedCost?.toString() || '',
          }));
        }

        // Check if patient is a minor
        if (planData.data.patient?.dateOfBirth) {
          const age = Math.floor(
            (Date.now() - new Date(planData.data.patient.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
          if (age < 18) {
            setFormData((prev) => ({
              ...prev,
              requiresGuardianSignature: true,
            }));
          }
        }

        if (staffData.success) {
          setStaff(staffData.data.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update financial amount when option changes
    if (field === 'selectedOptionId' && plan?.treatmentOptions) {
      const option = plan.treatmentOptions.find((o) => o.id === value);
      if (option?.estimatedCost) {
        setFormData((prev) => ({
          ...prev,
          financialAgreementAmount: option.estimatedCost?.toString() || '',
        }));
      }
    }

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

    if (!formData.selectedOptionId) {
      newErrors.selectedOptionId = 'Please select a treatment option';
    }
    if (!formData.consentType) {
      newErrors.consentType = 'Consent type is required';
    }
    if (formData.requiresGuardianSignature && !formData.guardianName) {
      newErrors.guardianName = 'Guardian name is required for minor patients';
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
      const response = await fetch('/api/case-acceptances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentPlanId: planId,
          selectedOptionId: formData.selectedOptionId || null,
          consentType: formData.consentType,
          financialAgreementAmount: formData.financialAgreementAmount
            ? parseFloat(formData.financialAgreementAmount)
            : null,
          paymentPlanDetails: formData.paymentPlanDetails || null,
          insuranceVerified: formData.insuranceVerified,
          patientResponsibility: formData.patientResponsibility
            ? parseFloat(formData.patientResponsibility)
            : null,
          requiresGuardianSignature: formData.requiresGuardianSignature,
          guardianName: formData.guardianName || null,
          guardianRelationship: formData.guardianRelationship || null,
          witnessId: formData.witnessId || null,
          specialConditions: formData.specialConditions || null,
          riskDisclosures: formData.riskDisclosures || null,
          acknowledgements: formData.acknowledgements,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create case acceptance');
      }

      router.push(`/treatment/plans/${planId}/acceptances/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Loading..." compact />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading treatment plan...
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  if (!plan || plan.status !== 'PRESENTED') {
    return (
      <>
        <PageHeader
          title="Cannot Create Acceptance"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: plan?.planNumber || 'Plan', href: `/treatment/plans/${planId}` },
            { label: 'New Acceptance' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {error || 'Case acceptance forms can only be created for presented plans.'}
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Create Case Acceptance"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'New Acceptance' },
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

          {/* Treatment Option Selection */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Selected Treatment
              </CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Treatment Option" required error={errors.selectedOptionId}>
                <Select
                  value={formData.selectedOptionId}
                  onValueChange={(v) => handleChange('selectedOptionId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.treatmentOptions?.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            Option {option.optionNumber}: {option.optionName}
                          </span>
                          {option.status === 'SELECTED' && (
                            <Badge variant="success" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {formData.selectedOptionId && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  {(() => {
                    const selectedOpt = plan.treatmentOptions?.find(
                      (o) => o.id === formData.selectedOptionId
                    );
                    if (!selectedOpt) return null;
                    return (
                      <>
                        <p className="font-medium">{selectedOpt.optionName}</p>
                        <p className="text-sm text-muted-foreground">
                          {applianceSystemLabels[selectedOpt.applianceSystem]}
                        </p>
                        {selectedOpt.estimatedCost && (
                          <p className="text-sm mt-1">
                            Estimated Cost: ${selectedOpt.estimatedCost.toLocaleString()}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <FormField label="Consent Type" required error={errors.consentType}>
                <Select
                  value={formData.consentType}
                  onValueChange={(v) => handleChange('consentType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Financial Agreement */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Financial Agreement</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Total Treatment Cost ($)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.financialAgreementAmount}
                    onChange={(e) => handleChange('financialAgreementAmount', e.target.value)}
                    placeholder="e.g., 5000"
                  />
                </FormField>

                <FormField label="Patient Responsibility ($)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.patientResponsibility}
                    onChange={(e) => handleChange('patientResponsibility', e.target.value)}
                    placeholder="After insurance"
                  />
                </FormField>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insuranceVerified"
                  checked={formData.insuranceVerified}
                  onCheckedChange={(checked) =>
                    handleChange('insuranceVerified', checked === true)
                  }
                />
                <Label htmlFor="insuranceVerified">Insurance benefits verified</Label>
              </div>

              <FormField label="Payment Plan Details">
                <Textarea
                  value={formData.paymentPlanDetails}
                  onChange={(e) => handleChange('paymentPlanDetails', e.target.value)}
                  placeholder="e.g., $500 down, $200/month for 24 months"
                  rows={2}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Guardian/Witness */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Signatures Required</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresGuardianSignature"
                  checked={formData.requiresGuardianSignature}
                  onCheckedChange={(checked) =>
                    handleChange('requiresGuardianSignature', checked === true)
                  }
                />
                <Label htmlFor="requiresGuardianSignature">
                  Requires parent/guardian signature (patient is a minor)
                </Label>
              </div>

              {formData.requiresGuardianSignature && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <FormField label="Guardian Name" required error={errors.guardianName}>
                    <Input
                      value={formData.guardianName}
                      onChange={(e) => handleChange('guardianName', e.target.value)}
                      placeholder="Parent/Guardian full name"
                    />
                  </FormField>

                  <FormField label="Relationship to Patient">
                    <Input
                      value={formData.guardianRelationship}
                      onChange={(e) => handleChange('guardianRelationship', e.target.value)}
                      placeholder="e.g., Mother, Father, Legal Guardian"
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Witness (optional)">
                <Select
                  value={formData.witnessId}
                  onValueChange={(v) => handleChange('witnessId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a witness..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.title ? `${member.title} ` : ''}
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Additional Information</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Risk Disclosures">
                <Textarea
                  value={formData.riskDisclosures}
                  onChange={(e) => handleChange('riskDisclosures', e.target.value)}
                  placeholder="Any specific risks discussed with the patient..."
                  rows={2}
                />
              </FormField>

              <FormField label="Special Conditions">
                <Textarea
                  value={formData.specialConditions}
                  onChange={(e) => handleChange('specialConditions', e.target.value)}
                  placeholder="Any special conditions or terms agreed upon..."
                  rows={2}
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
              {isSubmitting ? 'Creating...' : 'Create Acceptance Form'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
