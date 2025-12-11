'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';

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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import {
  createTreatmentPlanSchema,
  type CreateTreatmentPlanInput,
} from '@/lib/validations/treatment';

interface TreatmentPlanFormProps {
  initialData?: Partial<CreateTreatmentPlanInput>;
  planId?: string;
  mode: 'create' | 'edit';
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  patientNumber: string;
}

interface ProviderOption {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  providerType: string | null;
}

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PRESENTED', label: 'Presented' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'TRANSFERRED', label: 'Transferred' },
];

const planTypeOptions = [
  { value: 'COMPREHENSIVE', label: 'Comprehensive' },
  { value: 'LIMITED', label: 'Limited' },
  { value: 'INTERCEPTIVE', label: 'Interceptive' },
  { value: 'PHASE_1', label: 'Phase 1' },
  { value: 'PHASE_2', label: 'Phase 2' },
  { value: 'RETENTION', label: 'Retention Only' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'OTHER', label: 'Other' },
];

export function TreatmentPlanForm({ initialData, planId, mode }: TreatmentPlanFormProps) {
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTreatmentPlanInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTreatmentPlanSchema) as any,
    defaultValues: {
      status: 'DRAFT',
      diagnosis: [],
      treatmentGoals: [],
      ...initialData,
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : undefined,
      estimatedEndDate: initialData?.estimatedEndDate
        ? new Date(initialData.estimatedEndDate)
        : undefined,
    },
  });

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
        // Silent fail - provider selection is optional
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

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

  // Load initial patient data in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData?.patientId) {
      const fetchPatient = async () => {
        try {
          const response = await fetch(`/api/patients/${initialData.patientId}`);
          const result = await response.json();
          if (result.success) {
            setSelectedPatient(result.data);
          }
        } catch {
          // Silent fail
        }
      };
      fetchPatient();
    }
  }, [mode, initialData?.patientId]);

  const handlePatientSelect = (patient: PatientOption) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setPatientSearch('');
    setShowPatientDropdown(false);
  };

  const onSubmit = async (data: CreateTreatmentPlanInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/treatment-plans/${planId}` : '/api/treatment-plans';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save treatment plan');
      }

      router.push(`/treatment/plans/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card variant="ghost" className="border-error-200 bg-error-50">
          <CardContent className="p-4 text-error-700">{error}</CardContent>
        </Card>
      )}

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Patient</CardTitle>
          <CardDescription>
            {mode === 'create' ? 'Search and select the patient for this treatment plan' : 'Patient for this treatment plan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <PhiProtected fakeData={getFakeName()}>
                  <span className="font-medium">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                </PhiProtected>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.patientNumber} • Born {formatDate(selectedPatient.dateOfBirth)}
                </p>
              </div>
              {mode === 'create' && (
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
                  placeholder="Search by name or patient number..."
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
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {patientOptions.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </PhiProtected>
                      <span className="text-sm text-muted-foreground ml-2">
                        {patient.patientNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showPatientDropdown && loadingPatients && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-3 text-center text-muted-foreground">
                  Searching...
                </div>
              )}
              {showPatientDropdown && !loadingPatients && patientSearch.length >= 2 && patientOptions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-3 text-center text-muted-foreground">
                  No patients found
                </div>
              )}
              {errors.patientId && (
                <p className="text-sm text-error-500 mt-1">{errors.patientId.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Plan Name" required error={errors.planName?.message}>
            <Input {...register('planName')} placeholder="e.g., Full Braces Treatment" />
          </FormField>

          <FormField label="Plan Type" error={errors.planType?.message}>
            <Select
              value={watch('planType') || ''}
              onValueChange={(v) => setValue('planType', v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {planTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as CreateTreatmentPlanInput['status'])}
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

          <FormField label="Chief Complaint" error={errors.chiefComplaint?.message} className="md:col-span-2">
            <Textarea
              {...register('chiefComplaint')}
              placeholder="Patient's primary concern or reason for treatment..."
              rows={2}
            />
          </FormField>

          <FormField label="Treatment Description" error={errors.treatmentDescription?.message} className="md:col-span-2">
            <Textarea
              {...register('treatmentDescription')}
              placeholder="Detailed description of the proposed treatment..."
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Provider Assignment */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Provider Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Primary Provider" error={errors.primaryProviderId?.message}>
            <Select
              value={watch('primaryProviderId') || 'none'}
              onValueChange={(v) => setValue('primaryProviderId', v === 'none' ? null : v)}
              disabled={loadingProviders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProviders ? 'Loading...' : 'Select provider...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No provider assigned</SelectItem>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    Dr. {provider.firstName} {provider.lastName}
                    {provider.providerType && ` (${provider.providerType})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Supervising Provider" error={errors.supervisingProviderId?.message}>
            <Select
              value={watch('supervisingProviderId') || 'none'}
              onValueChange={(v) => setValue('supervisingProviderId', v === 'none' ? null : v)}
              disabled={loadingProviders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProviders ? 'Loading...' : 'Select supervisor...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supervisor</SelectItem>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    Dr. {provider.firstName} {provider.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      {/* Timeline & Estimates */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Timeline & Estimates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Start Date" error={errors.startDate?.message}>
            <Input {...register('startDate')} type="date" />
          </FormField>

          <FormField label="Estimated End Date" error={errors.estimatedEndDate?.message}>
            <Input {...register('estimatedEndDate')} type="date" />
          </FormField>

          <FormField label="Estimated Duration (months)" error={errors.estimatedDuration?.message}>
            <Input
              {...register('estimatedDuration', { valueAsNumber: true })}
              type="number"
              min={1}
              max={60}
              placeholder="e.g., 24"
            />
          </FormField>

          <FormField label="Estimated Visits" error={errors.estimatedVisits?.message}>
            <Input
              {...register('estimatedVisits', { valueAsNumber: true })}
              type="number"
              min={1}
              max={200}
              placeholder="e.g., 30"
            />
          </FormField>

          <FormField label="Total Fee ($)" error={errors.totalFee?.message}>
            <Input
              {...register('totalFee', { valueAsNumber: true })}
              type="number"
              min={0}
              step={0.01}
              placeholder="e.g., 5500.00"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Treatment Plan'}
        </Button>
      </div>
    </form>
  );
}
