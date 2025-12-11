'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Shield, Search } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

const retainerTypeOptions = [
  { value: 'HAWLEY', label: 'Hawley' },
  { value: 'ESSIX', label: 'Essix (Clear)' },
  { value: 'VIVERA', label: 'Vivera' },
  { value: 'FIXED_BONDED', label: 'Fixed Bonded' },
  { value: 'SPRING_RETAINER', label: 'Spring Retainer' },
  { value: 'WRAP_AROUND', label: 'Wrap Around' },
];

const archOptions = [
  { value: 'UPPER', label: 'Upper' },
  { value: 'LOWER', label: 'Lower' },
  { value: 'BOTH', label: 'Both' },
];

const statusOptions = [
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'IN_FABRICATION', label: 'In Fabrication' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'ACTIVE', label: 'Active' },
];

const wearScheduleOptions = [
  { value: 'FULL_TIME', label: 'Full Time (22+ hours/day)' },
  { value: 'NIGHTS_ONLY', label: 'Nights Only (8-10 hours)' },
  { value: 'EVERY_OTHER_NIGHT', label: 'Every Other Night' },
  { value: 'FEW_NIGHTS_WEEK', label: 'Few Nights per Week' },
  { value: 'AS_NEEDED', label: 'As Needed' },
];

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

function NewRetainerPageContent() {
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
    retainerType: 'ESSIX',
    arch: 'UPPER',
    material: '',
    status: 'ORDERED',
    wearSchedule: 'FULL_TIME',
    orderedDate: new Date().toISOString().split('T')[0],
    isReplacement: false,
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    if (!formData.retainerType) {
      newErrors.retainerType = 'Retainer type is required';
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
      const response = await fetch('/api/retainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          retainerType: formData.retainerType,
          arch: formData.arch,
          material: formData.material || null,
          status: formData.status,
          wearSchedule: formData.wearSchedule || null,
          orderedDate: formData.orderedDate || null,
          isReplacement: formData.isReplacement,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create retainer record');
      }

      router.push(`/treatment/appliances/retainers/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Order Retainer"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Retainers', href: '/treatment/appliances/retainers' },
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

          {/* Retainer Details */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Retainer Details
              </CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Retainer Type" required error={errors.retainerType}>
                  <Select
                    value={formData.retainerType}
                    onValueChange={(v) => handleChange('retainerType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {retainerTypeOptions.map((opt) => (
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

                <FormField label="Material">
                  <Input
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    placeholder="e.g., Clear plastic, Acrylic"
                  />
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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isReplacement"
                  checked={formData.isReplacement}
                  onCheckedChange={(checked) => handleChange('isReplacement', checked === true)}
                />
                <Label htmlFor="isReplacement">This is a replacement retainer</Label>
              </div>
            </CardContent>
          </Card>

          {/* Retention Protocol */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Retention Protocol</CardTitle>
            </CardHeader>
            <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Wear Schedule">
                <Select
                  value={formData.wearSchedule}
                  onValueChange={(v) => handleChange('wearSchedule', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wearScheduleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Ordered Date">
                <Input
                  type="date"
                  value={formData.orderedDate}
                  onChange={(e) => handleChange('orderedDate', e.target.value)}
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
                  placeholder="Any additional notes about this retainer order..."
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
              {isSubmitting ? 'Saving...' : 'Order Retainer'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

function NewRetainerPageLoading() {
  return (
    <>
      <PageHeader
        title="Order Retainer"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Retainers', href: '/treatment/appliances/retainers' },
          { label: 'New' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="max-w-3xl space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContent>
    </>
  );
}

export default function NewRetainerPage() {
  return (
    <Suspense fallback={<NewRetainerPageLoading />}>
      <NewRetainerPageContent />
    </Suspense>
  );
}
