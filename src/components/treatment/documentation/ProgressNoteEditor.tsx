'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Save, Send, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import {
  createProgressNoteSchema,
  type CreateProgressNoteInput,
} from '@/lib/validations/treatment';

interface ProgressNoteEditorProps {
  initialData?: Partial<CreateProgressNoteInput> & { id?: string };
  noteId?: string;
  mode: 'create' | 'edit';
  patientId?: string;
  treatmentPlanId?: string;
  appointmentId?: string;
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface ProviderOption {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
}

interface NoteTemplate {
  id: string;
  templateName: string;
  templateType: string;
  defaultSubjective: string | null;
  defaultObjective: string | null;
  defaultAssessment: string | null;
  defaultPlan: string | null;
}

const noteTypeOptions = [
  { value: 'INITIAL_EXAM', label: 'Initial Exam' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'RECORDS_APPOINTMENT', label: 'Records' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'DEBOND', label: 'Debond' },
  { value: 'RETENTION_CHECK', label: 'Retention Check' },
  { value: 'OBSERVATION', label: 'Observation' },
  { value: 'GENERAL', label: 'General' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_SIGNATURE', label: 'Ready for Signature' },
];

export function ProgressNoteEditor({
  initialData,
  noteId,
  mode,
  patientId: preselectedPatientId,
  treatmentPlanId: preselectedTreatmentPlanId,
  appointmentId: preselectedAppointmentId,
}: ProgressNoteEditorProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Provider options
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProgressNoteInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createProgressNoteSchema) as any,
    defaultValues: {
      status: 'DRAFT',
      noteDate: new Date(),
      noteType: 'ADJUSTMENT',
      patientId: preselectedPatientId || '',
      treatmentPlanId: preselectedTreatmentPlanId || undefined,
      appointmentId: preselectedAppointmentId || undefined,
      ...initialData,
    },
  });

  const watchedNoteType = watch('noteType');
  const watchedStatus = watch('status');

  // Fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await fetch('/api/staff?status=ACTIVE&isProvider=true&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setProviderOptions(result.data.items || []);
        }
      } catch {
        // Silent fail - provider selection will show empty
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/note-templates?isActive=true&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setTemplates(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Fetch preselected patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (!preselectedPatientId) return;

      try {
        const response = await fetch(`/api/patients/${preselectedPatientId}`);
        const result = await response.json();
        if (result.success && result.data) {
          setSelectedPatient(result.data);
          setValue('patientId', result.data.id);
        }
      } catch {
        // Silent fail
      }
    };

    fetchPatient();
  }, [preselectedPatientId, setValue]);

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (patientSearch.length < 2) {
        setPatientOptions([]);
        return;
      }

      setLoadingPatients(true);
      try {
        const response = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&pageSize=10`);
        const result = await response.json();
        if (result.success) {
          setPatientOptions(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingPatients(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const selectPatient = (patient: PatientOption) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setShowPatientDropdown(false);
    setPatientSearch('');
  };

  const applyTemplate = (template: NoteTemplate) => {
    if (template.defaultSubjective) setValue('subjective', template.defaultSubjective);
    if (template.defaultObjective) setValue('objective', template.defaultObjective);
    if (template.defaultAssessment) setValue('assessment', template.defaultAssessment);
    if (template.defaultPlan) setValue('plan', template.defaultPlan);
  };

  const onSubmit = async (data: CreateProgressNoteInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'create' ? '/api/progress-notes' : `/api/progress-notes/${noteId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save progress note');
      }

      router.push(`/treatment/documentation/notes/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndSign = async () => {
    setValue('status', 'PENDING_SIGNATURE');
    handleSubmit(onSubmit)();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Patient Information</CardTitle>
          </CardHeader>
          <CardContent compact>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <PhiProtected fakeData={getFakeName()}>
                    <p className="font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                  </PhiProtected>
                  <p className="text-sm text-muted-foreground">
                    DOB: {format(new Date(selectedPatient.dateOfBirth), 'MMM d, yyyy')}
                  </p>
                </div>
                {mode === 'create' && !preselectedPatientId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue('patientId', '');
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="pl-9"
                  />
                </div>
                {showPatientDropdown && patientOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {patientOptions.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                        onClick={() => selectPatient(patient)}
                      >
                        <PhiProtected fakeData={getFakeName()}>
                          <span className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </PhiProtected>
                        <span className="text-sm text-muted-foreground ml-2">
                          DOB: {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {loadingPatients && (
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                )}
                {errors.patientId && (
                  <p className="text-sm text-destructive mt-1">{errors.patientId.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note Details */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Note Details</CardTitle>
          </CardHeader>
          <CardContent compact className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Note Type" required error={errors.noteType?.message}>
                <Select
                  value={watchedNoteType}
                  onValueChange={(v) => setValue('noteType', v as CreateProgressNoteInput['noteType'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Note Date" required>
                <Input
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  {...register('noteDate', { valueAsDate: true })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Provider" required error={errors.providerId?.message}>
                <Select
                  value={watch('providerId')}
                  onValueChange={(v) => setValue('providerId', v)}
                  disabled={loadingProviders}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        Dr. {provider.firstName} {provider.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Status">
                <Select
                  value={watchedStatus}
                  onValueChange={(v) => setValue('status', v as CreateProgressNoteInput['status'])}
                >
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
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Apply Template:</span>
              {templates.slice(0, 5).map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {template.templateName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chief Complaint */}
      <Card>
        <CardHeader compact>
          <CardTitle size="sm">Chief Complaint</CardTitle>
          <CardDescription>Patient's primary reason for visit</CardDescription>
        </CardHeader>
        <CardContent compact>
          <Textarea
            placeholder="Enter patient's chief complaint..."
            rows={2}
            {...register('chiefComplaint')}
          />
        </CardContent>
      </Card>

      {/* SOAP Format */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjective */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Badge variant="info">S</Badge>
              Subjective
            </CardTitle>
            <CardDescription>Patient-reported symptoms and history</CardDescription>
          </CardHeader>
          <CardContent compact>
            <Textarea
              placeholder="Patient reports..."
              rows={6}
              {...register('subjective')}
            />
          </CardContent>
        </Card>

        {/* Objective */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Badge variant="warning">O</Badge>
              Objective
            </CardTitle>
            <CardDescription>Clinical findings and observations</CardDescription>
          </CardHeader>
          <CardContent compact>
            <Textarea
              placeholder="Clinical exam reveals..."
              rows={6}
              {...register('objective')}
            />
          </CardContent>
        </Card>

        {/* Assessment */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Badge variant="success">A</Badge>
              Assessment
            </CardTitle>
            <CardDescription>Clinical interpretation and diagnosis</CardDescription>
          </CardHeader>
          <CardContent compact>
            <Textarea
              placeholder="Assessment indicates..."
              rows={6}
              {...register('assessment')}
            />
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Badge variant="secondary">P</Badge>
              Plan
            </CardTitle>
            <CardDescription>Treatment plan and next steps</CardDescription>
          </CardHeader>
          <CardContent compact>
            <Textarea
              placeholder="Plan includes..."
              rows={6}
              {...register('plan')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Procedures Summary */}
      <Card>
        <CardHeader compact>
          <CardTitle size="sm">Procedures Performed</CardTitle>
          <CardDescription>Summary of procedures done during this visit</CardDescription>
        </CardHeader>
        <CardContent compact>
          <Textarea
            placeholder="List procedures performed..."
            rows={3}
            {...register('proceduresSummary')}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndSign}
            disabled={submitting}
          >
            <Send className="h-4 w-4 mr-2" />
            Save & Submit for Signature
          </Button>
        </div>
      </div>
    </form>
  );
}
