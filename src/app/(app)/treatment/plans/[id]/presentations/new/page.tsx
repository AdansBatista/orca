'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Presentation } from 'lucide-react';

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

const outcomeOptions = [
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CONSIDERING', label: 'Still Considering' },
  { value: 'NEEDS_FOLLOWUP', label: 'Needs Follow-up' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
];

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
  treatmentOptions: Array<{
    id: string;
    optionNumber: number;
    optionName: string;
  }>;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
}

export default function NewCasePresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: planId } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [providers, setProviders] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    presenterId: '',
    presentationDate: new Date().toISOString().split('T')[0],
    presentationTime: '09:00',
    duration: '30',
    outcome: 'CONSIDERING',
    attendees: '',
    locationDetails: '',
    treatmentOptionsPresented: [] as string[],
    presentationNotes: '',
    patientQuestions: '',
    patientConcerns: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, providersRes] = await Promise.all([
          fetch(`/api/treatment-plans/${planId}`),
          fetch('/api/staff?isProvider=true&pageSize=100'),
        ]);

        const planData = await planRes.json();
        const providersData = await providersRes.json();

        if (!planData.success) {
          throw new Error(planData.error?.message || 'Failed to fetch treatment plan');
        }

        if (!['DRAFT', 'PRESENTED'].includes(planData.data.status)) {
          setError('Case presentations can only be added to draft or presented plans');
        }

        setPlan(planData.data);

        if (providersData.success) {
          setProviders(providersData.data.items || []);
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
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleOptionPresented = (optionId: string) => {
    setFormData((prev) => ({
      ...prev,
      treatmentOptionsPresented: prev.treatmentOptionsPresented.includes(optionId)
        ? prev.treatmentOptionsPresented.filter((id) => id !== optionId)
        : [...prev.treatmentOptionsPresented, optionId],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.presenterId) {
      newErrors.presenterId = 'Presenter is required';
    }
    if (!formData.presentationDate) {
      newErrors.presentationDate = 'Presentation date is required';
    }
    if (!formData.outcome) {
      newErrors.outcome = 'Outcome is required';
    }
    if (formData.followUpRequired && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required when follow-up is needed';
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
      const presentationDateTime = new Date(
        `${formData.presentationDate}T${formData.presentationTime}`
      );

      const response = await fetch('/api/case-presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentPlanId: planId,
          presenterId: formData.presenterId,
          presentationDate: presentationDateTime.toISOString(),
          duration: formData.duration ? parseInt(formData.duration) : null,
          outcome: formData.outcome,
          attendees: formData.attendees || null,
          locationDetails: formData.locationDetails || null,
          treatmentOptionsPresented: formData.treatmentOptionsPresented,
          presentationNotes: formData.presentationNotes || null,
          patientQuestions: formData.patientQuestions || null,
          patientConcerns: formData.patientConcerns || null,
          followUpRequired: formData.followUpRequired,
          followUpDate: formData.followUpDate || null,
          followUpNotes: formData.followUpNotes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create case presentation');
      }

      router.push(`/treatment/plans/${planId}/presentations/${result.data.id}`);
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

  if (!plan) {
    return (
      <>
        <PageHeader
          title="Cannot Schedule Presentation"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'New Presentation' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {error || 'Treatment plan not found.'}
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
        title="Schedule Case Presentation"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'New Presentation' },
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

          {/* Presentation Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Presentation className="h-4 w-4" />
                Presentation Details
              </CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Presenter" required error={errors.presenterId}>
                  <Select
                    value={formData.presenterId}
                    onValueChange={(v) => handleChange('presenterId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select presenter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.title ? `${provider.title} ` : ''}
                          {provider.firstName} {provider.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Duration (minutes)">
                  <Select
                    value={formData.duration}
                    onValueChange={(v) => handleChange('duration', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Date" required error={errors.presentationDate}>
                  <Input
                    type="date"
                    value={formData.presentationDate}
                    onChange={(e) => handleChange('presentationDate', e.target.value)}
                  />
                </FormField>

                <FormField label="Time">
                  <Input
                    type="time"
                    value={formData.presentationTime}
                    onChange={(e) => handleChange('presentationTime', e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Location / Room">
                <Input
                  value={formData.locationDetails}
                  onChange={(e) => handleChange('locationDetails', e.target.value)}
                  placeholder="e.g., Consultation Room A"
                />
              </FormField>

              <FormField label="Attendees">
                <Input
                  value={formData.attendees}
                  onChange={(e) => handleChange('attendees', e.target.value)}
                  placeholder="e.g., Patient, Parent/Guardian"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Treatment Options */}
          {plan.treatmentOptions && plan.treatmentOptions.length > 0 && (
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Treatment Options to Present</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="space-y-2">
                  {plan.treatmentOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${option.id}`}
                        checked={formData.treatmentOptionsPresented.includes(option.id)}
                        onCheckedChange={() => toggleOptionPresented(option.id)}
                      />
                      <Label htmlFor={`option-${option.id}`}>
                        Option {option.optionNumber}: {option.optionName}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Outcome */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Presentation Outcome</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Outcome" required error={errors.outcome}>
                <Select
                  value={formData.outcome}
                  onValueChange={(v) => handleChange('outcome', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {outcomeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Presentation Notes">
                <Textarea
                  value={formData.presentationNotes}
                  onChange={(e) => handleChange('presentationNotes', e.target.value)}
                  placeholder="Summary of what was discussed..."
                  rows={3}
                />
              </FormField>

              <FormField label="Patient Questions">
                <Textarea
                  value={formData.patientQuestions}
                  onChange={(e) => handleChange('patientQuestions', e.target.value)}
                  placeholder="Questions the patient asked..."
                  rows={2}
                />
              </FormField>

              <FormField label="Patient Concerns">
                <Textarea
                  value={formData.patientConcerns}
                  onChange={(e) => handleChange('patientConcerns', e.target.value)}
                  placeholder="Any concerns expressed by the patient..."
                  rows={2}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Follow-up */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Follow-up</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onCheckedChange={(checked) =>
                    handleChange('followUpRequired', checked === true)
                  }
                />
                <Label htmlFor="followUpRequired">Follow-up required</Label>
              </div>

              {formData.followUpRequired && (
                <>
                  <FormField label="Follow-up Date" required error={errors.followUpDate}>
                    <Input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => handleChange('followUpDate', e.target.value)}
                    />
                  </FormField>

                  <FormField label="Follow-up Notes">
                    <Textarea
                      value={formData.followUpNotes}
                      onChange={(e) => handleChange('followUpNotes', e.target.value)}
                      placeholder="What needs to be discussed in the follow-up..."
                      rows={2}
                    />
                  </FormField>
                </>
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
              {isSubmitting ? 'Saving...' : 'Save Presentation'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
