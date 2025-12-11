'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  FileSignature,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Shield,
  CreditCard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TreatmentOption {
  id: string;
  optionNumber: number;
  optionName: string;
  applianceType: string;
  totalFee: number;
  insuranceEstimate: number | null;
  patientEstimate: number | null;
  isRecommended: boolean;
}

interface CaseAcceptanceFormProps {
  treatmentPlanId: string;
  options: TreatmentOption[];
  selectedOptionId?: string;
  patientName: string;
  onSuccess?: () => void;
}

interface FormData {
  selectedOptionId: string;
  totalFee: number;
  downPayment: number;
  monthlyPayment: number;
  paymentTerms: number;
  estimatedInsurance: number;
  estimatedPatientResponsibility: number;
  informedConsentSigned: boolean;
  financialAgreementSigned: boolean;
  hipaaAcknowledged: boolean;
  notes: string;
}

export function CaseAcceptanceForm({
  treatmentPlanId,
  options,
  selectedOptionId,
  patientName,
  onSuccess,
}: CaseAcceptanceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find((o) => o.id === selectedOptionId) || options[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      selectedOptionId: selectedOption?.id || '',
      totalFee: selectedOption?.totalFee || 0,
      downPayment: 0,
      monthlyPayment: 0,
      paymentTerms: 24,
      estimatedInsurance: selectedOption?.insuranceEstimate || 0,
      estimatedPatientResponsibility: selectedOption?.patientEstimate || selectedOption?.totalFee || 0,
      informedConsentSigned: false,
      financialAgreementSigned: false,
      hipaaAcknowledged: false,
      notes: '',
    },
  });

  const watchedValues = watch();
  const allConsentsSigned =
    watchedValues.informedConsentSigned &&
    watchedValues.financialAgreementSigned &&
    watchedValues.hipaaAcknowledged;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: FormData) => {
    if (!allConsentsSigned) {
      setError('All consent forms must be signed before accepting the case.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/treatment-plans/${treatmentPlanId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptedOptionId: data.selectedOptionId,
          totalFee: data.totalFee,
          downPayment: data.downPayment || null,
          monthlyPayment: data.monthlyPayment || null,
          paymentTerms: data.paymentTerms || null,
          estimatedInsurance: data.estimatedInsurance || null,
          estimatedPatientResponsibility: data.estimatedPatientResponsibility || null,
          informedConsentSigned: data.informedConsentSigned,
          financialAgreementSigned: data.financialAgreementSigned,
          hipaaAcknowledged: data.hipaaAcknowledged,
          notes: data.notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to accept case');
      }

      onSuccess?.();
      router.push(`/treatment/plans/${treatmentPlanId}`);
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
          <CardContent className="p-4 flex items-center gap-2 text-error-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Selected Treatment */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selected Treatment
          </CardTitle>
          <CardDescription>
            Accepting treatment for {patientName} on {format(new Date(), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedOption ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary-50 border border-primary-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">Option {selectedOption.optionNumber}</span>
                  {selectedOption.isRecommended && (
                    <Badge variant="soft-primary" size="sm">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{selectedOption.optionName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(selectedOption.totalFee)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No treatment option selected.</p>
          )}
        </CardContent>
      </Card>

      {/* Financial Agreement */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FormField label="Total Fee" error={errors.totalFee?.message}>
              <Input
                {...register('totalFee', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
              />
            </FormField>

            <FormField label="Down Payment" error={errors.downPayment?.message}>
              <Input
                {...register('downPayment', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
              />
            </FormField>

            <FormField label="Monthly Payment" error={errors.monthlyPayment?.message}>
              <Input
                {...register('monthlyPayment', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
              />
            </FormField>

            <FormField label="Payment Terms (months)" error={errors.paymentTerms?.message}>
              <Input
                {...register('paymentTerms', { valueAsNumber: true })}
                type="number"
                min={1}
                max={60}
              />
            </FormField>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Estimated Insurance" error={errors.estimatedInsurance?.message}>
              <Input
                {...register('estimatedInsurance', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
              />
            </FormField>

            <FormField
              label="Est. Patient Responsibility"
              error={errors.estimatedPatientResponsibility?.message}
            >
              <Input
                {...register('estimatedPatientResponsibility', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Consents */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Required Consents
          </CardTitle>
          <CardDescription>
            All consents must be acknowledged before case acceptance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={watchedValues.informedConsentSigned}
                onCheckedChange={(checked) =>
                  setValue('informedConsentSigned', checked as boolean)
                }
              />
              <div className="flex-1">
                <p className="font-medium">Informed Consent</p>
                <p className="text-sm text-muted-foreground">
                  Patient has been informed of treatment risks, benefits, alternatives, and has
                  consented to proceed with the proposed treatment.
                </p>
              </div>
              {watchedValues.informedConsentSigned && (
                <CheckCircle className="h-5 w-5 text-success-500" />
              )}
            </label>

            <Separator />

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={watchedValues.financialAgreementSigned}
                onCheckedChange={(checked) =>
                  setValue('financialAgreementSigned', checked as boolean)
                }
              />
              <div className="flex-1">
                <p className="font-medium">Financial Agreement</p>
                <p className="text-sm text-muted-foreground">
                  Patient/Responsible party has reviewed and agreed to the financial terms including
                  total fee, payment schedule, and insurance estimate.
                </p>
              </div>
              {watchedValues.financialAgreementSigned && (
                <CheckCircle className="h-5 w-5 text-success-500" />
              )}
            </label>

            <Separator />

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={watchedValues.hipaaAcknowledged}
                onCheckedChange={(checked) => setValue('hipaaAcknowledged', checked as boolean)}
              />
              <div className="flex-1">
                <p className="font-medium">HIPAA Acknowledgment</p>
                <p className="text-sm text-muted-foreground">
                  Patient has received and acknowledged the Notice of Privacy Practices.
                </p>
              </div>
              {watchedValues.hipaaAcknowledged && (
                <CheckCircle className="h-5 w-5 text-success-500" />
              )}
            </label>
          </div>

          {!allConsentsSigned && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning-50 text-warning-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              All consents must be signed to proceed
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Notes (optional)" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Any additional notes about case acceptance..."
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !allConsentsSigned}>
          <FileSignature className="h-4 w-4 mr-2" />
          {submitting ? 'Processing...' : 'Accept Case'}
        </Button>
      </div>
    </form>
  );
}
