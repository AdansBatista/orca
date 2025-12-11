'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

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

const applianceSystemOptions = [
  { value: 'TRADITIONAL_METAL', label: 'Traditional Metal Braces' },
  { value: 'TRADITIONAL_CERAMIC', label: 'Traditional Ceramic Braces' },
  { value: 'SELF_LIGATING_METAL', label: 'Self-Ligating Metal Braces' },
  { value: 'SELF_LIGATING_CERAMIC', label: 'Self-Ligating Ceramic Braces' },
  { value: 'LINGUAL', label: 'Lingual Braces' },
  { value: 'INVISALIGN', label: 'Invisalign' },
  { value: 'CLEAR_ALIGNERS_OTHER', label: 'Clear Aligners (Other)' },
  { value: 'COMBINATION', label: 'Combination Treatment' },
  { value: 'OTHER', label: 'Other' },
];

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
}

export default function NewTreatmentOptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: planId } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    optionName: '',
    description: '',
    applianceSystem: 'TRADITIONAL_METAL',
    applianceDetails: '',
    estimatedDuration: '',
    estimatedVisits: '',
    estimatedCost: '',
    isRecommended: false,
    recommendationNotes: '',
    advantages: [] as string[],
    disadvantages: [] as string[],
  });

  const [newAdvantage, setNewAdvantage] = useState('');
  const [newDisadvantage, setNewDisadvantage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/treatment-plans/${planId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment plan');
        }

        if (result.data.status !== 'DRAFT') {
          setError('Treatment options can only be added to draft plans');
        }

        setPlan(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

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

  const addAdvantage = () => {
    if (newAdvantage.trim()) {
      setFormData((prev) => ({
        ...prev,
        advantages: [...prev.advantages, newAdvantage.trim()],
      }));
      setNewAdvantage('');
    }
  };

  const removeAdvantage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      advantages: prev.advantages.filter((_, i) => i !== index),
    }));
  };

  const addDisadvantage = () => {
    if (newDisadvantage.trim()) {
      setFormData((prev) => ({
        ...prev,
        disadvantages: [...prev.disadvantages, newDisadvantage.trim()],
      }));
      setNewDisadvantage('');
    }
  };

  const removeDisadvantage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      disadvantages: prev.disadvantages.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.optionName.trim()) {
      newErrors.optionName = 'Option name is required';
    }
    if (!formData.applianceSystem) {
      newErrors.applianceSystem = 'Appliance system is required';
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
      const response = await fetch(`/api/treatment-plans/${planId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: formData.optionName,
          description: formData.description || null,
          applianceSystem: formData.applianceSystem,
          applianceDetails: formData.applianceDetails || null,
          estimatedDuration: formData.estimatedDuration
            ? parseInt(formData.estimatedDuration)
            : null,
          estimatedVisits: formData.estimatedVisits
            ? parseInt(formData.estimatedVisits)
            : null,
          estimatedCost: formData.estimatedCost
            ? parseFloat(formData.estimatedCost)
            : null,
          isRecommended: formData.isRecommended,
          recommendationNotes: formData.recommendationNotes || null,
          advantages: formData.advantages,
          disadvantages: formData.disadvantages,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create treatment option');
      }

      router.push(`/treatment/plans/${planId}/options/${result.data.id}`);
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

  if (!plan || plan.status !== 'DRAFT') {
    return (
      <>
        <PageHeader
          title="Cannot Add Option"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: plan?.planNumber || 'Plan', href: `/treatment/plans/${planId}` },
            { label: 'New Option' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {error || 'Treatment options can only be added to draft plans.'}
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
        title="New Treatment Option"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'Options', href: `/treatment/plans/${planId}/options` },
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

          {/* Basic Information */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Option Details</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <FormField label="Option Name" required error={errors.optionName}>
                <Input
                  value={formData.optionName}
                  onChange={(e) => handleChange('optionName', e.target.value)}
                  placeholder="e.g., Metal Braces - Standard"
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this treatment option..."
                  rows={3}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Appliance System" required error={errors.applianceSystem}>
                  <Select
                    value={formData.applianceSystem}
                    onValueChange={(v) => handleChange('applianceSystem', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {applianceSystemOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Appliance Details">
                  <Input
                    value={formData.applianceDetails}
                    onChange={(e) => handleChange('applianceDetails', e.target.value)}
                    placeholder="e.g., Damon Q system"
                  />
                </FormField>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onCheckedChange={(checked) =>
                    handleChange('isRecommended', checked === true)
                  }
                />
                <Label htmlFor="isRecommended">Mark as recommended option</Label>
              </div>

              {formData.isRecommended && (
                <FormField label="Recommendation Notes">
                  <Textarea
                    value={formData.recommendationNotes}
                    onChange={(e) => handleChange('recommendationNotes', e.target.value)}
                    placeholder="Why is this option recommended for this patient?"
                    rows={2}
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Estimates */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Estimates</CardTitle>
            </CardHeader>
            <CardContent compact>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Duration (months)">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleChange('estimatedDuration', e.target.value)}
                    placeholder="e.g., 18"
                  />
                </FormField>

                <FormField label="Estimated Visits">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.estimatedVisits}
                    onChange={(e) => handleChange('estimatedVisits', e.target.value)}
                    placeholder="e.g., 20"
                  />
                </FormField>

                <FormField label="Estimated Cost ($)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimatedCost}
                    onChange={(e) => handleChange('estimatedCost', e.target.value)}
                    placeholder="e.g., 5000"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Advantages */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Advantages</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newAdvantage}
                  onChange={(e) => setNewAdvantage(e.target.value)}
                  placeholder="Add an advantage..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAdvantage();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addAdvantage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.advantages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.advantages.map((adv, index) => (
                    <Badge
                      key={index}
                      variant="success"
                      className="flex items-center gap-1"
                    >
                      {adv}
                      <button
                        type="button"
                        onClick={() => removeAdvantage(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disadvantages */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Disadvantages / Considerations</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newDisadvantage}
                  onChange={(e) => setNewDisadvantage(e.target.value)}
                  placeholder="Add a disadvantage or consideration..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDisadvantage();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addDisadvantage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.disadvantages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.disadvantages.map((dis, index) => (
                    <Badge
                      key={index}
                      variant="warning"
                      className="flex items-center gap-1"
                    >
                      {dis}
                      <button
                        type="button"
                        onClick={() => removeDisadvantage(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
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
              {isSubmitting ? 'Saving...' : 'Save Option'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
