'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addMinutes, parseISO } from 'date-fns';
import { Search, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getFakeName, getFakePhone, getFakeEmail } from '@/lib/fake-data';
import {
  createAppointmentSchema,
  type CreateAppointmentInput,
} from '@/lib/validations/booking';
import { toast } from 'sonner';

interface AppointmentFormProps {
  initialData?: Partial<CreateAppointmentInput> & { id?: string };
  mode: 'create' | 'edit';
  preselectedDate?: Date;
  preselectedProviderId?: string;
  onSuccess?: () => void;
  initialPatient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
}

interface AppointmentType {
  id: string;
  code: string;
  name: string;
  defaultDuration: number;
  color: string;
  requiresChair: boolean;
  requiresRoom: boolean;
}

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  providerType: string | null;
}

interface Chair {
  id: string;
  name: string;
  roomName: string;
}

interface AvailabilityConflict {
  type: 'provider' | 'chair' | 'room';
  appointmentId: string;
  startTime: string;
  endTime: string;
  details: string;
}

const sourceOptions = [
  { value: 'STAFF', label: 'In Office' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'WAITLIST', label: 'Waitlist' },
  { value: 'TREATMENT_PLAN', label: 'Treatment Plan' },
  { value: 'RECALL', label: 'Recall' },
];

export function AppointmentForm({
  initialData,
  mode,
  preselectedDate,
  preselectedProviderId,
  onSuccess,
  initialPatient,
}: AppointmentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data loading states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    initialPatient ? { ...initialPatient, dateOfBirth: null } : null
  );
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [chairs, setChairs] = useState<Chair[]>([]);
  const [loadingChairs, setLoadingChairs] = useState(false);

  // Availability check
  const [conflicts, setConflicts] = useState<AvailabilityConflict[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Form defaults
  const defaultValues = useMemo(() => {
    const now = preselectedDate || new Date();
    return {
      patientId: initialData?.patientId || '',
      appointmentTypeId: initialData?.appointmentTypeId || '',
      providerId: initialData?.providerId || preselectedProviderId || '',
      chairId: initialData?.chairId || null,
      startTime: initialData?.startTime
        ? new Date(initialData.startTime)
        : now,
      duration: initialData?.duration || 30,
      source: initialData?.source || 'STAFF',
      notes: initialData?.notes || '',
    };
  }, [initialData, preselectedDate, preselectedProviderId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAppointmentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createAppointmentSchema) as any,
    defaultValues,
  });

  const watchedValues = watch();
  const selectedTypeId = watchedValues.appointmentTypeId;
  const selectedType = appointmentTypes.find((t) => t.id === selectedTypeId);

  // Load recent patients on mount (for showing in dropdown before search)
  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const response = await fetch('/api/patients?pageSize=5&sortBy=createdAt&sortOrder=desc');
        const result = await response.json();
        if (result.success) {
          setRecentPatients(result.data.items || []);
        }
      } catch {
        // Silent fail
      }
    };
    fetchRecentPatients();
  }, []);

  // Search patients with debounce
  useEffect(() => {
    if (patientSearch.length < 2) {
      setPatients([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const response = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&pageSize=10`);
        const result = await response.json();
        if (result.success) {
          setPatients(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingPatients(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearch]);

  // Load appointment types
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await fetch('/api/booking/appointment-types?isActive=true&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setAppointmentTypes(result.data.items || []);
        }
      } catch {
        toast.error('Failed to load appointment types');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Load providers
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await fetch('/api/staff?isProvider=true&status=ACTIVE&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setProviders(result.data.items || []);
        }
      } catch {
        toast.error('Failed to load providers');
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // Load chairs
  useEffect(() => {
    const fetchChairs = async () => {
      setLoadingChairs(true);
      try {
        const response = await fetch('/api/resources/chairs?isActive=true&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setChairs(result.data.items || []);
        }
      } catch {
        // Silent fail - chairs are optional
      } finally {
        setLoadingChairs(false);
      }
    };
    fetchChairs();
  }, []);

  // Update duration when appointment type changes
  useEffect(() => {
    if (selectedType && mode === 'create') {
      setValue('duration', selectedType.defaultDuration);
    }
  }, [selectedType, setValue, mode]);

  // Check availability when key fields change
  useEffect(() => {
    const { providerId, startTime, duration, chairId } = watchedValues;

    if (!providerId || !startTime || !duration) {
      setConflicts([]);
      return;
    }

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const endTime = addMinutes(new Date(startTime), duration);
        const response = await fetch('/api/booking/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            startTime: new Date(startTime).toISOString(),
            endTime: endTime.toISOString(),
            chairId: chairId || undefined,
            excludeAppointmentId: initialData?.id,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setConflicts(result.data.conflicts || []);
        }
      } catch {
        // Silent fail
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [
    watchedValues.providerId,
    watchedValues.startTime,
    watchedValues.duration,
    watchedValues.chairId,
    initialData?.id,
  ]);

  // Select patient
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setPatients([]);
    setPatientSearch('');
  };

  const onSubmit = async (data: CreateAppointmentInput) => {
    if (conflicts.length > 0) {
      const confirmed = window.confirm(
        'There are scheduling conflicts. Do you want to proceed anyway?'
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/booking/appointments/${initialData?.id}` : '/api/booking/appointments';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const duration = data.duration || 30;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          duration,
          startTime: new Date(data.startTime).toISOString(),
          endTime: addMinutes(new Date(data.startTime), duration).toISOString(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save appointment');
      }

      toast.success(mode === 'edit' ? 'Appointment updated' : 'Appointment created');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/booking');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for input
  const formatDateTimeLocal = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Availability Conflicts Warning */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Scheduling conflicts detected:</p>
            <ul className="mt-2 space-y-1 text-sm">
              {conflicts.map((conflict, i) => (
                <li key={i}>
                  {conflict.type === 'provider' && 'Provider'}
                  {conflict.type === 'chair' && 'Chair'}
                  {conflict.type === 'room' && 'Room'} conflict: {conflict.details}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </PhiProtected>
                </p>
                {selectedPatient.phone && (
                  <p className="text-sm text-muted-foreground">
                    <PhiProtected fakeData={getFakePhone()}>
                      {selectedPatient.phone}
                    </PhiProtected>
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setValue('patientId', '');
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <FormField label="Search Patient" required error={errors.patientId?.message}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onFocus={() => setShowPatientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 300)}
                  placeholder="Search by name, phone, or email..."
                  className="pl-10"
                />
                {loadingPatients && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Loading...
                  </span>
                )}
                {/* Show search results or recent patients */}
                {showPatientDropdown && (patients.length > 0 || (patientSearch.length < 2 && recentPatients.length > 0)) && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {patientSearch.length < 2 && recentPatients.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                          Recent Patients
                        </div>
                        {recentPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectPatient(patient);
                            }}
                          >
                            <p className="font-medium">
                              <PhiProtected fakeData={getFakeName()}>
                                {patient.firstName} {patient.lastName}
                              </PhiProtected>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {patient.phone && (
                                <PhiProtected fakeData={getFakePhone()}>
                                  {patient.phone}
                                </PhiProtected>
                              )}
                              {patient.phone && patient.email && ' • '}
                              {patient.email && (
                                <PhiProtected fakeData={getFakeEmail()}>
                                  {patient.email}
                                </PhiProtected>
                              )}
                            </p>
                          </button>
                        ))}
                      </>
                    )}
                    {patients.length > 0 && patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectPatient(patient);
                        }}
                      >
                        <p className="font-medium">
                          <PhiProtected fakeData={getFakeName()}>
                            {patient.firstName} {patient.lastName}
                          </PhiProtected>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.phone && (
                            <PhiProtected fakeData={getFakePhone()}>
                              {patient.phone}
                            </PhiProtected>
                          )}
                          {patient.phone && patient.email && ' • '}
                          {patient.email && (
                            <PhiProtected fakeData={getFakeEmail()}>
                              {patient.email}
                            </PhiProtected>
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Appointment Type" required error={errors.appointmentTypeId?.message}>
            <Select
              value={watchedValues.appointmentTypeId}
              onValueChange={(v) => setValue('appointmentTypeId', v)}
              disabled={loadingTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTypes ? 'Loading...' : 'Select type...'} />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                      <span className="text-muted-foreground">({type.defaultDuration}min)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Provider" required error={errors.providerId?.message}>
            <Select
              value={watchedValues.providerId}
              onValueChange={(v) => setValue('providerId', v)}
              disabled={loadingProviders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProviders ? 'Loading...' : 'Select provider...'} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.firstName} {provider.lastName}
                    {provider.title && ` - ${provider.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Date & Time" required error={errors.startTime?.message}>
            <Input
              type="datetime-local"
              value={formatDateTimeLocal(watchedValues.startTime)}
              onChange={(e) => setValue('startTime', new Date(e.target.value))}
            />
          </FormField>

          <FormField label="Duration (minutes)" required error={errors.duration?.message}>
            <Select
              value={String(watchedValues.duration)}
              onValueChange={(v) => setValue('duration', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 30, 45, 60, 90, 120].map((mins) => (
                  <SelectItem key={mins} value={String(mins)}>
                    {mins} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Source" error={errors.source?.message}>
            <Select
              value={watchedValues.source || 'STAFF'}
              onValueChange={(v) => setValue('source', v as CreateAppointmentInput['source'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {selectedType?.requiresChair && (
            <FormField label="Chair" error={errors.chairId?.message}>
              <Select
                value={watchedValues.chairId || 'none'}
                onValueChange={(v) => setValue('chairId', v === 'none' ? null : v)}
                disabled={loadingChairs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingChairs ? 'Loading...' : 'Select chair...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chair assigned</SelectItem>
                  {chairs.map((chair) => (
                    <SelectItem key={chair.id} value={chair.id}>
                      {chair.name} ({chair.roomName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </CardContent>
      </Card>

      {/* Appointment Type Info */}
      {selectedType && (
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedType.color }}
              />
              <div className="flex-1">
                <p className="font-medium">{selectedType.name}</p>
                <p className="text-sm text-muted-foreground">
                  Default: {selectedType.defaultDuration} minutes
                </p>
              </div>
              <div className="flex gap-2">
                {selectedType.requiresChair && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Chair Required
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes for this appointment..."
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Availability Status */}
      {checkingAvailability && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          Checking availability...
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? 'Saving...'
            : mode === 'edit'
              ? 'Update Appointment'
              : 'Create Appointment'}
        </Button>
      </div>
    </form>
  );
}
