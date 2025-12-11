'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, SmilePlus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const alignerSystemOptions = [
  { value: 'Invisalign', label: 'Invisalign' },
  { value: 'ClearCorrect', label: 'ClearCorrect' },
  { value: 'SureSmile', label: 'SureSmile' },
  { value: '3M Clarity', label: '3M Clarity' },
  { value: 'Spark', label: 'Spark' },
  { value: 'uLab', label: 'uLab' },
  { value: 'Other', label: 'Other' },
];

const statusOptions = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
];

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

function NewAlignerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || '',
    alignerSystem: 'Invisalign',
    caseNumber: '',
    totalAligners: '',
    currentAligner: '1',
    changeFrequency: '14',
    status: 'SUBMITTED',
    startDate: new Date().toISOString().split('T')[0],
    estimatedEndDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`/api/patients?search=${patientSearch}&pageSize=20`);
        const data = await res.json();
        if (data.success) {
          setPatients(data.data.items);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    if (patientSearch.length >= 2) {
      fetchPatients();
    }
  }, [patientSearch]);

  // Load preselected patient
  useEffect(() => {
    if (preselectedPatientId) {
      const fetchPatient = async () => {
        try {
          const res = await fetch(`/api/patients/${preselectedPatientId}`);
          const data = await res.json();
          if (data.success) {
            setSelectedPatient(data.data);
          }
        } catch (err) {
          console.error('Error fetching patient:', err);
        }
      };
      fetchPatient();
    }
  }, [preselectedPatientId]);

  // Calculate estimated end date when relevant fields change
  useEffect(() => {
    if (formData.startDate && formData.totalAligners && formData.changeFrequency) {
      const startDate = new Date(formData.startDate);
      const totalDays =
        parseInt(formData.totalAligners) * parseInt(formData.changeFrequency);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays);
      setFormData((prev) => ({
        ...prev,
        estimatedEndDate: endDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.startDate, formData.totalAligners, formData.changeFrequency]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    if (!formData.alignerSystem) {
      newErrors.alignerSystem = 'Aligner system is required';
    }
    if (!formData.totalAligners || parseInt(formData.totalAligners) < 1) {
      newErrors.totalAligners = 'Total aligners must be at least 1';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
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
      const response = await fetch('/api/aligners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          alignerSystem: formData.alignerSystem,
          caseNumber: formData.caseNumber || null,
          totalAligners: parseInt(formData.totalAligners),
          currentAligner: parseInt(formData.currentAligner),
          changeFrequency: parseInt(formData.changeFrequency),
          status: formData.status,
          startDate: formData.startDate,
          estimatedEndDate: formData.estimatedEndDate || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create aligner case');
      }

      router.push(`/treatment/appliances/aligners/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Aligner Case"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Aligners', href: '/treatment/appliances/aligners' },
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

          {/* Patient Selection */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Patient</CardTitle>
            </CardHeader>
            <CardContent compact>
              <FormField label="Select Patient" required error={errors.patientId}>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <p className="font-medium">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">ID: {selectedPatient.id}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        handleChange('patientId', '');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search patients...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search by name..."
                          value={patientSearch}
                          onValueChange={setPatientSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {patientSearch.length < 2
                              ? 'Type at least 2 characters to search'
                              : 'No patients found'}
                          </CommandEmpty>
                          <CommandGroup>
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={patient.id}
                                onSelect={() => {
                                  setSelectedPatient(patient);
                                  handleChange('patientId', patient.id);
                                  setPatientOpen(false);
                                }}
                              >
                                {patient.firstName} {patient.lastName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </FormField>
            </CardContent>
          </Card>

          {/* Aligner Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <SmilePlus className="h-4 w-4" />
                Aligner Details
              </CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Aligner System" required error={errors.alignerSystem}>
                <Select
                  value={formData.alignerSystem}
                  onValueChange={(v) => handleChange('alignerSystem', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {alignerSystemOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Case Number">
                <Input
                  value={formData.caseNumber}
                  onChange={(e) => handleChange('caseNumber', e.target.value)}
                  placeholder="e.g., INV-12345"
                />
              </FormField>

              <FormField label="Total Aligners" required error={errors.totalAligners}>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.totalAligners}
                  onChange={(e) => handleChange('totalAligners', e.target.value)}
                  placeholder="e.g., 20"
                />
              </FormField>

              <FormField label="Starting Aligner #">
                <Input
                  type="number"
                  min="1"
                  value={formData.currentAligner}
                  onChange={(e) => handleChange('currentAligner', e.target.value)}
                />
              </FormField>

              <FormField label="Change Frequency (days)">
                <Select
                  value={formData.changeFrequency}
                  onValueChange={(v) => handleChange('changeFrequency', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="10">10 days</SelectItem>
                    <SelectItem value="14">14 days (standard)</SelectItem>
                    <SelectItem value="21">21 days</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleChange('status', v)}
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
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Dates</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start Date" required error={errors.startDate}>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </FormField>

              <FormField label="Estimated End Date">
                <Input
                  type="date"
                  value={formData.estimatedEndDate}
                  onChange={(e) => handleChange('estimatedEndDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-calculated based on total aligners and change frequency
                </p>
              </FormField>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Notes</CardTitle>
            </CardHeader>
            <CardContent compact>
              <FormField label="Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes about this aligner case..."
                  rows={3}
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
              {isSubmitting ? 'Saving...' : 'Save Aligner Case'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

function NewAlignerPageLoading() {
  return (
    <>
      <PageHeader
        title="New Aligner Case"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Aligners', href: '/treatment/appliances/aligners' },
          { label: 'New' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-3xl space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContent>
    </>
  );
}

export default function NewAlignerPage() {
  return (
    <Suspense fallback={<NewAlignerPageLoading />}>
      <NewAlignerPageContent />
    </Suspense>
  );
}
