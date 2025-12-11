'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Package, Search } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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

const applianceTypeOptions = [
  { value: 'BRACKETS', label: 'Brackets' },
  { value: 'BANDS', label: 'Bands' },
  { value: 'EXPANDER', label: 'Expander' },
  { value: 'HERBST', label: 'Herbst' },
  { value: 'MARA', label: 'MARA' },
  { value: 'HEADGEAR', label: 'Headgear' },
  { value: 'FACEMASK', label: 'Facemask' },
  { value: 'TAD', label: 'TAD' },
  { value: 'ELASTICS', label: 'Elastics' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'POWER_CHAIN', label: 'Power Chain' },
  { value: 'OTHER', label: 'Other' },
];

const archOptions = [
  { value: 'UPPER', label: 'Upper' },
  { value: 'LOWER', label: 'Lower' },
  { value: 'BOTH', label: 'Both' },
];

const statusOptions = [
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'ACTIVE', label: 'Active' },
];

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

function NewBracketPageContent() {
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
    applianceType: 'BRACKETS',
    arch: 'UPPER',
    applianceSystem: '',
    manufacturer: '',
    toothNumbers: '',
    status: 'ACTIVE',
    placedDate: new Date().toISOString().split('T')[0],
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
    if (!formData.applianceType) {
      newErrors.applianceType = 'Appliance type is required';
    }
    if (!formData.arch) {
      newErrors.arch = 'Arch is required';
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
      // Parse tooth numbers from comma-separated string to array
      const toothNumbersArray = formData.toothNumbers
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch('/api/appliances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          applianceType: formData.applianceType,
          arch: formData.arch,
          applianceSystem: formData.applianceSystem || null,
          manufacturer: formData.manufacturer || null,
          toothNumbers: toothNumbersArray,
          status: formData.status,
          placedDate: formData.placedDate || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create appliance record');
      }

      router.push(`/treatment/appliances/brackets/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Appliance"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Brackets', href: '/treatment/appliances/brackets' },
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

          {/* Appliance Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Appliance Details
              </CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Appliance Type" required error={errors.applianceType}>
                <Select
                  value={formData.applianceType}
                  onValueChange={(v) => handleChange('applianceType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applianceTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Arch" required error={errors.arch}>
                <Select
                  value={formData.arch}
                  onValueChange={(v) => handleChange('arch', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {archOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Appliance System">
                <Input
                  value={formData.applianceSystem}
                  onChange={(e) => handleChange('applianceSystem', e.target.value)}
                  placeholder="e.g., Damon, Speed, In-Ovation"
                />
              </FormField>

              <FormField label="Manufacturer">
                <Input
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="e.g., Ormco, 3M, American Orthodontics"
                />
              </FormField>

              <FormField label="Tooth Numbers" className="md:col-span-2">
                <Input
                  value={formData.toothNumbers}
                  onChange={(e) => handleChange('toothNumbers', e.target.value)}
                  placeholder="e.g., 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter tooth numbers separated by commas
                </p>
              </FormField>
            </CardContent>
          </Card>

          {/* Status & Dates */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Status & Dates</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <FormField label="Placed Date">
                <Input
                  type="date"
                  value={formData.placedDate}
                  onChange={(e) => handleChange('placedDate', e.target.value)}
                />
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
                  placeholder="Any additional notes about this appliance..."
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
              {isSubmitting ? 'Saving...' : 'Save Appliance'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

function NewBracketPageLoading() {
  return (
    <>
      <PageHeader
        title="New Appliance"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Brackets', href: '/treatment/appliances/brackets' },
          { label: 'New' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-3xl space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContent>
    </>
  );
}

export default function NewBracketPage() {
  return (
    <Suspense fallback={<NewBracketPageLoading />}>
      <NewBracketPageContent />
    </Suspense>
  );
}
