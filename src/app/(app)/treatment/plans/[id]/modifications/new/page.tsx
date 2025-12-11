'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle, Info } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  version: number;
  status: string;
  totalFee: number | null;
  estimatedDuration: number | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const modificationTypeOptions = [
  { value: 'MINOR_ADJUSTMENT', label: 'Minor Adjustment', description: 'Small changes that don\'t affect overall treatment' },
  { value: 'PHASE_ADDITION', label: 'Phase Addition', description: 'Adding a new treatment phase' },
  { value: 'PHASE_REMOVAL', label: 'Phase Removal', description: 'Removing a treatment phase' },
  { value: 'APPLIANCE_CHANGE', label: 'Appliance Change', description: 'Changing the type of appliance used', requiresConsent: true },
  { value: 'DURATION_EXTENSION', label: 'Duration Extension', description: 'Extending the treatment timeline', requiresAck: true },
  { value: 'DURATION_REDUCTION', label: 'Duration Reduction', description: 'Shortening the treatment timeline' },
  { value: 'TREATMENT_UPGRADE', label: 'Treatment Upgrade', description: 'Upgrading to a more comprehensive approach', requiresConsent: true },
  { value: 'TREATMENT_DOWNGRADE', label: 'Treatment Downgrade', description: 'Simplifying the treatment approach' },
  { value: 'FEE_ADJUSTMENT', label: 'Fee Adjustment', description: 'Changing the treatment cost', requiresAck: true },
  { value: 'PROVIDER_CHANGE', label: 'Provider Change', description: 'Changing the assigned provider' },
  { value: 'GOAL_MODIFICATION', label: 'Goal Modification', description: 'Changing treatment objectives' },
  { value: 'CLINICAL_PROTOCOL', label: 'Clinical Protocol', description: 'Changing clinical approach/technique' },
  { value: 'OTHER', label: 'Other', description: 'Other type of modification' },
];

const VERSION_CREATING_TYPES = ['APPLIANCE_CHANGE', 'DURATION_EXTENSION', 'TREATMENT_UPGRADE', 'TREATMENT_DOWNGRADE', 'FEE_ADJUSTMENT'];
const ACKNOWLEDGMENT_REQUIRED_TYPES = ['APPLIANCE_CHANGE', 'DURATION_EXTENSION', 'TREATMENT_UPGRADE', 'FEE_ADJUSTMENT'];
const CONSENT_REQUIRED_TYPES = ['APPLIANCE_CHANGE', 'TREATMENT_UPGRADE'];

export default function NewModificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    modificationType: '',
    changeDescription: '',
    reason: '',
    newFee: '',
    newDuration: '',
    forceAcknowledgment: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/treatment-plans/${id}`);
        const data = await res.json();
        if (data.success) {
          setTreatmentPlan(data.data);
          // Pre-fill current values
          setFormData(prev => ({
            ...prev,
            newFee: data.data.totalFee?.toString() || '',
            newDuration: data.data.estimatedDuration?.toString() || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const selectedType = modificationTypeOptions.find(t => t.value === formData.modificationType);
  const createsNewVersion = VERSION_CREATING_TYPES.includes(formData.modificationType);
  const requiresAcknowledgment = ACKNOWLEDGMENT_REQUIRED_TYPES.includes(formData.modificationType) || formData.forceAcknowledgment;
  const requiresConsent = CONSENT_REQUIRED_TYPES.includes(formData.modificationType);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.modificationType) {
      newErrors.modificationType = 'Modification type is required';
    }
    if (!formData.changeDescription.trim()) {
      newErrors.changeDescription = 'Description is required';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Validate fee if FEE_ADJUSTMENT
    if (formData.modificationType === 'FEE_ADJUSTMENT' && formData.newFee) {
      const fee = parseFloat(formData.newFee);
      if (isNaN(fee) || fee < 0) {
        newErrors.newFee = 'Please enter a valid fee amount';
      }
    }

    // Validate duration if DURATION_EXTENSION or DURATION_REDUCTION
    if (['DURATION_EXTENSION', 'DURATION_REDUCTION'].includes(formData.modificationType) && formData.newDuration) {
      const duration = parseInt(formData.newDuration);
      if (isNaN(duration) || duration < 1 || duration > 60) {
        newErrors.newDuration = 'Please enter a valid duration (1-60 months)';
      }
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
      // Build changed fields
      const changedFields: Record<string, { old: unknown; new: unknown }> = {};
      const planUpdates: Record<string, unknown> = {};

      if (formData.modificationType === 'FEE_ADJUSTMENT' && formData.newFee && treatmentPlan) {
        const newFee = parseFloat(formData.newFee);
        changedFields.totalFee = { old: treatmentPlan.totalFee, new: newFee };
        planUpdates.totalFee = newFee;
      }

      if (['DURATION_EXTENSION', 'DURATION_REDUCTION'].includes(formData.modificationType) && formData.newDuration && treatmentPlan) {
        const newDuration = parseInt(formData.newDuration);
        changedFields.estimatedDuration = { old: treatmentPlan.estimatedDuration, new: newDuration };
        planUpdates.estimatedDuration = newDuration;
      }

      const response = await fetch(`/api/treatment-plans/${id}/modifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modificationType: formData.modificationType,
          changeDescription: formData.changeDescription,
          reason: formData.reason,
          previousFee: treatmentPlan?.totalFee,
          newFee: formData.newFee ? parseFloat(formData.newFee) : null,
          changedFields: Object.keys(changedFields).length > 0 ? changedFields : null,
          planUpdates: Object.keys(planUpdates).length > 0 ? planUpdates : null,
          forceAcknowledgment: formData.forceAcknowledgment,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create modification');
      }

      router.push(`/treatment/plans/${id}/modifications/${result.data.modification.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="New Modification" compact />
        <PageContent density="comfortable">
          <div className="max-w-3xl space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!treatmentPlan) {
    return (
      <>
        <PageHeader title="Plan Not Found" compact />
        <PageContent>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Treatment plan not found</p>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="New Plan Modification"
        description={`${treatmentPlan.planName} (v${treatmentPlan.version})`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: treatmentPlan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Modifications', href: `/treatment/plans/${id}/modifications` },
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

          {/* Current Plan Info */}
          <Card variant="ghost">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Version</p>
                  <p className="text-lg font-semibold">v{treatmentPlan.version}</p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-sm text-muted-foreground">Current Fee</p>
                  <p className="text-lg font-semibold">
                    {treatmentPlan.totalFee ? `$${treatmentPlan.totalFee.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">
                    {treatmentPlan.estimatedDuration ? `${treatmentPlan.estimatedDuration} months` : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modification Type */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Modification Type</CardTitle>
            </CardHeader>
            <CardContent compact>
              <FormField label="Type of Modification" required error={errors.modificationType}>
                <Select
                  value={formData.modificationType}
                  onValueChange={(v) => handleChange('modificationType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select modification type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modificationTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.label}</span>
                          {type.requiresConsent && (
                            <Badge variant="destructive" className="text-xs">Requires Consent</Badge>
                          )}
                          {type.requiresAck && !type.requiresConsent && (
                            <Badge variant="warning" className="text-xs">Requires Acknowledgment</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedType.description}</p>
                )}
              </FormField>

              {/* Impact badges */}
              {formData.modificationType && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {createsNewVersion && (
                    <Badge variant="info">
                      <Info className="h-3 w-3 mr-1" />
                      Creates new version (v{treatmentPlan.version} → v{treatmentPlan.version + 1})
                    </Badge>
                  )}
                  {requiresAcknowledgment && (
                    <Badge variant="warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requires patient acknowledgment
                    </Badge>
                  )}
                  {requiresConsent && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requires new consent
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modification Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Modification Details</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Description" required error={errors.changeDescription}>
                <Textarea
                  value={formData.changeDescription}
                  onChange={(e) => handleChange('changeDescription', e.target.value)}
                  placeholder="Describe what is being changed..."
                  rows={3}
                />
              </FormField>

              <FormField label="Reason for Change" required error={errors.reason}>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="Explain why this change is necessary..."
                  rows={3}
                />
              </FormField>

              {/* Fee change field */}
              {formData.modificationType === 'FEE_ADJUSTMENT' && (
                <FormField label="New Total Fee" error={errors.newFee}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.newFee}
                      onChange={(e) => handleChange('newFee', e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  {formData.newFee && treatmentPlan.totalFee && (
                    <p className={`text-sm mt-1 ${parseFloat(formData.newFee) > treatmentPlan.totalFee ? 'text-destructive' : 'text-success'}`}>
                      Change: {parseFloat(formData.newFee) > treatmentPlan.totalFee ? '+' : ''}
                      ${(parseFloat(formData.newFee) - treatmentPlan.totalFee).toLocaleString()}
                    </p>
                  )}
                </FormField>
              )}

              {/* Duration change field */}
              {['DURATION_EXTENSION', 'DURATION_REDUCTION'].includes(formData.modificationType) && (
                <FormField label="New Duration (months)" error={errors.newDuration}>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.newDuration}
                    onChange={(e) => handleChange('newDuration', e.target.value)}
                    placeholder="Enter new duration..."
                  />
                  {formData.newDuration && treatmentPlan.estimatedDuration && (
                    <p className={`text-sm mt-1 ${parseInt(formData.newDuration) > treatmentPlan.estimatedDuration ? 'text-warning' : 'text-success'}`}>
                      Change: {parseInt(formData.newDuration) > treatmentPlan.estimatedDuration ? '+' : ''}
                      {parseInt(formData.newDuration) - treatmentPlan.estimatedDuration} months
                    </p>
                  )}
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Acknowledgment Options */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Acknowledgment Settings</CardTitle>
            </CardHeader>
            <CardContent compact>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forceAcknowledgment"
                  checked={formData.forceAcknowledgment || ACKNOWLEDGMENT_REQUIRED_TYPES.includes(formData.modificationType)}
                  disabled={ACKNOWLEDGMENT_REQUIRED_TYPES.includes(formData.modificationType)}
                  onCheckedChange={(checked) => handleChange('forceAcknowledgment', checked === true)}
                />
                <Label htmlFor="forceAcknowledgment">
                  Require patient acknowledgment for this modification
                </Label>
              </div>
              {ACKNOWLEDGMENT_REQUIRED_TYPES.includes(formData.modificationType) && (
                <p className="text-sm text-muted-foreground mt-2">
                  This modification type automatically requires acknowledgment
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Modification'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
