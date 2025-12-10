'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  FileText,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

interface FormFieldSchema {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  schema: {
    fields: FormFieldSchema[];
    settings?: {
      showProgressBar?: boolean;
      requireSignature?: boolean;
      signatureLabel?: string;
      confirmationMessage?: string;
    };
  };
}

interface IntakeData {
  clinic: {
    id: string;
    name: string;
  };
  templates: FormTemplate[];
  lead?: {
    firstName: string;
    lastName: string;
  };
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Record<string, unknown>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedForms, setCompletedForms] = useState<string[]>([]);
  const [allComplete, setAllComplete] = useState(false);

  // Fetch intake token data
  useEffect(() => {
    const fetchIntakeData = async () => {
      try {
        const response = await fetch(`/api/intake/${resolvedParams.token}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Invalid or expired link');
        }

        setIntakeData(result.data);

        // Initialize responses for each template
        const initialResponses: Record<string, Record<string, unknown>> = {};
        result.data.templates.forEach((template: FormTemplate) => {
          initialResponses[template.id] = {};
        });
        setResponses(initialResponses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeData();
  }, [resolvedParams.token]);

  const currentForm = intakeData?.templates[currentFormIndex];
  const progress = intakeData
    ? ((completedForms.length / intakeData.templates.length) * 100)
    : 0;

  const handleFieldChange = (fieldId: string, value: unknown) => {
    if (!currentForm) return;

    setResponses((prev) => ({
      ...prev,
      [currentForm.id]: {
        ...prev[currentForm.id],
        [fieldId]: value,
      },
    }));
  };

  const validateCurrentForm = (): boolean => {
    if (!currentForm) return false;

    const currentResponses = responses[currentForm.id] || {};
    const requiredFields = currentForm.schema.fields.filter((f) => f.required);

    for (const field of requiredFields) {
      const value = currentResponses[field.id];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }

    return true;
  };

  const handleSubmitForm = async () => {
    if (!currentForm || !validateCurrentForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Intake-Token': resolvedParams.token,
        },
        body: JSON.stringify({
          templateId: currentForm.id,
          responses: responses[currentForm.id],
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit form');
      }

      setCompletedForms([...completedForms, currentForm.id]);

      if (result.data.allFormsCompleted) {
        setAllComplete(true);
      } else if (currentFormIndex < (intakeData?.templates.length || 0) - 1) {
        setCurrentFormIndex(currentFormIndex + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldSchema) => {
    const value = responses[currentForm?.id || '']?.[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          </FormField>
        );

      case 'number':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <Input
              type="number"
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          </FormField>
        );

      case 'textarea':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <Textarea
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
          </FormField>
        );

      case 'date':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <Input
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </FormField>
        );

      case 'select':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <Select
              value={(value as string) || ''}
              onValueChange={(v) => handleFieldChange(field.id, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        );

      case 'radio':
        return (
          <FormField key={field.id} label={field.label} required={field.required} description={field.helpText}>
            <RadioGroup
              value={(value as string) || ''}
              onValueChange={(v) => handleFieldChange(field.id, v)}
            >
              {field.options?.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
                  <Label htmlFor={`${field.id}-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-start space-x-2 py-2">
            <Checkbox
              id={field.id}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <div>
              <Label htmlFor={field.id} className="cursor-pointer">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.helpText && (
                <p className="text-sm text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          </div>
        );

      case 'section_header':
        return (
          <div key={field.id} className="pt-4 pb-2">
            <h3 className="text-lg font-semibold">{field.label}</h3>
          </div>
        );

      case 'paragraph':
        return (
          <div key={field.id} className="py-2">
            <p className="text-sm text-muted-foreground">{field.label}</p>
          </div>
        );

      default:
        return (
          <FormField key={field.id} label={field.label} required={field.required}>
            <Input
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          </FormField>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Forms</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success-500" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              {currentForm?.schema.settings?.confirmationMessage ||
                'All forms have been submitted successfully. We will review your information and contact you shortly.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const personName = intakeData?.lead
    ? `${intakeData.lead.firstName} ${intakeData.lead.lastName}`
    : intakeData?.patient
    ? `${intakeData.patient.firstName} ${intakeData.patient.lastName}`
    : 'Patient';

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{intakeData?.clinic.name}</h1>
          <p className="text-muted-foreground">Welcome, {personName}</p>
        </div>

        {/* Progress */}
        {intakeData && intakeData.templates.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Form {currentFormIndex + 1} of {intakeData.templates.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Form Steps */}
        {intakeData && intakeData.templates.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {intakeData.templates.map((template, index) => {
              const isCompleted = completedForms.includes(template.id);
              const isCurrent = index === currentFormIndex;

              return (
                <div
                  key={template.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-success-100 text-success-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {template.name}
                </div>
              );
            })}
          </div>
        )}

        {/* Current Form */}
        {currentForm && (
          <Card>
            <CardHeader>
              <CardTitle>{currentForm.name}</CardTitle>
              {currentForm.description && (
                <CardDescription>{currentForm.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentForm.schema.fields.map(renderField)}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentFormIndex(Math.max(0, currentFormIndex - 1))}
                  disabled={currentFormIndex === 0 || isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button onClick={handleSubmitForm} disabled={!validateCurrentForm() || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : currentFormIndex === (intakeData?.templates.length || 0) - 1 ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
