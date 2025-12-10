'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Save,
  Search,
  User,
} from 'lucide-react';

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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface PatientOrLead {
  id: string;
  firstName: string;
  lastName: string;
  type: 'patient' | 'lead';
}

const directionOptions = [
  { value: 'INCOMING', label: 'Incoming (Request from another provider)', icon: ArrowDownLeft },
  { value: 'OUTGOING', label: 'Outgoing (Send to another provider)', icon: ArrowUpRight },
];

const recordTypeOptions = [
  { value: 'XRAYS', label: 'X-Rays' },
  { value: 'PHOTOS', label: 'Photos' },
  { value: 'TREATMENT_RECORDS', label: 'Treatment Records' },
  { value: 'MEDICAL_HISTORY', label: 'Medical History' },
  { value: 'BILLING_RECORDS', label: 'Billing Records' },
  { value: 'ALL', label: 'All Records' },
];

const dateRangeOptions = [
  { value: 'last_year', label: 'Last Year' },
  { value: 'last_2_years', label: 'Last 2 Years' },
  { value: 'last_5_years', label: 'Last 5 Years' },
  { value: 'all', label: 'All Available Records' },
  { value: 'custom', label: 'Custom Range' },
];

export function NewRecordsRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedLeadId = searchParams.get('leadId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientOrLead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PatientOrLead | null>(null);

  const [formData, setFormData] = useState({
    direction: 'INCOMING',
    providerName: '',
    providerPhone: '',
    providerFax: '',
    providerEmail: '',
    providerAddress: '',
    recordTypes: [] as string[],
    dateRange: 'last_5_years',
    notes: '',
    dueDate: '',
    authorizationSigned: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load preselected patient/lead
  useEffect(() => {
    const loadPreselected = async () => {
      if (preselectedPatientId) {
        try {
          const res = await fetch(`/api/patients/${preselectedPatientId}`);
          const result = await res.json();
          if (result.success) {
            setSelectedPerson({
              id: result.data.id,
              firstName: result.data.firstName,
              lastName: result.data.lastName,
              type: 'patient',
            });
          }
        } catch {
          // Ignore errors for preselection
        }
      } else if (preselectedLeadId) {
        try {
          const res = await fetch(`/api/leads/${preselectedLeadId}`);
          const result = await res.json();
          if (result.success) {
            setSelectedPerson({
              id: result.data.id,
              firstName: result.data.firstName,
              lastName: result.data.lastName,
              type: 'lead',
            });
          }
        } catch {
          // Ignore errors for preselection
        }
      }
    };

    loadPreselected();
  }, [preselectedPatientId, preselectedLeadId]);

  // Search for patients/leads
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search both patients and leads
        const [patientsRes, leadsRes] = await Promise.all([
          fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}&pageSize=5`),
          fetch(`/api/leads?search=${encodeURIComponent(searchQuery)}&pageSize=5`),
        ]);

        const [patientsResult, leadsResult] = await Promise.all([
          patientsRes.json(),
          leadsRes.json(),
        ]);

        const results: PatientOrLead[] = [];

        if (patientsResult.success && patientsResult.data?.items) {
          results.push(
            ...patientsResult.data.items.map((p: { id: string; firstName: string; lastName: string }) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              type: 'patient' as const,
            }))
          );
        }

        if (leadsResult.success && leadsResult.data?.items) {
          results.push(
            ...leadsResult.data.items.map((l: { id: string; firstName: string; lastName: string }) => ({
              id: l.id,
              firstName: l.firstName,
              lastName: l.lastName,
              type: 'lead' as const,
            }))
          );
        }

        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

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

  const handleRecordTypeToggle = (type: string) => {
    setFormData((prev) => {
      const current = prev.recordTypes;
      if (type === 'ALL') {
        // If selecting ALL, clear others and select ALL
        return { ...prev, recordTypes: current.includes('ALL') ? [] : ['ALL'] };
      }
      // If selecting specific type, remove ALL and toggle the type
      const withoutAll = current.filter((t) => t !== 'ALL');
      if (current.includes(type)) {
        return { ...prev, recordTypes: withoutAll.filter((t) => t !== type) };
      }
      return { ...prev, recordTypes: [...withoutAll, type] };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPerson) {
      newErrors.person = 'Please select a patient or lead';
    }
    if (!formData.providerName.trim()) {
      newErrors.providerName = 'Provider name is required';
    }
    if (formData.recordTypes.length === 0) {
      newErrors.recordTypes = 'Select at least one record type';
    }
    if (formData.providerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.providerEmail)) {
      newErrors.providerEmail = 'Invalid email address';
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
      const response = await fetch('/api/records-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: formData.direction,
          patientId: selectedPerson?.type === 'patient' ? selectedPerson.id : null,
          leadId: selectedPerson?.type === 'lead' ? selectedPerson.id : null,
          providerName: formData.providerName,
          providerPhone: formData.providerPhone || null,
          providerFax: formData.providerFax || null,
          providerEmail: formData.providerEmail || null,
          providerAddress: formData.providerAddress || null,
          recordTypes: formData.recordTypes,
          dateRange: formData.dateRange,
          notes: formData.notes || null,
          dueDate: formData.dueDate || null,
          authorizationSigned: formData.authorizationSigned,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create records request');
      }

      router.push(`/crm/records/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const DirectionIcon = formData.direction === 'INCOMING' ? ArrowDownLeft : ArrowUpRight;

  return (
    <>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Direction */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <DirectionIcon className="h-4 w-4" />
              Request Direction
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            <FormField label="Direction" required>
              <Select
                value={formData.direction}
                onValueChange={(v) => handleChange('direction', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {directionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <p className="text-sm text-muted-foreground mt-2">
              {formData.direction === 'INCOMING'
                ? 'Request records from another dental/medical provider to our office.'
                : 'Send records from our office to another dental/medical provider.'}
            </p>
          </CardContent>
        </Card>

        {/* Patient/Lead Selection */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient or Lead
            </CardTitle>
          </CardHeader>
          <CardContent compact className="space-y-4">
            {selectedPerson ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <PhiProtected fakeData={getFakeName()}>
                      <p className="font-medium">
                        {selectedPerson.firstName} {selectedPerson.lastName}
                      </p>
                    </PhiProtected>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedPerson.type}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPerson(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <FormField label="Search Patient or Lead" required error={errors.person}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>

                {isSearching && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}

                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {searchResults.map((person) => (
                      <button
                        key={`${person.type}-${person.id}`}
                        type="button"
                        className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3"
                        onClick={() => {
                          setSelectedPerson(person);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium text-sm">
                              {person.firstName} {person.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-xs text-muted-foreground capitalize">
                            {person.type}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Provider Information */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {formData.direction === 'INCOMING' ? 'Requesting From' : 'Sending To'}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField label="Provider/Practice Name" required error={errors.providerName}>
                <Input
                  value={formData.providerName}
                  onChange={(e) => handleChange('providerName', e.target.value)}
                  placeholder="ABC Dental Clinic"
                />
              </FormField>
            </div>

            <FormField label="Phone">
              <Input
                type="tel"
                value={formData.providerPhone}
                onChange={(e) => handleChange('providerPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </FormField>

            <FormField label="Fax">
              <Input
                type="tel"
                value={formData.providerFax}
                onChange={(e) => handleChange('providerFax', e.target.value)}
                placeholder="(555) 123-4568"
              />
            </FormField>

            <FormField label="Email" error={errors.providerEmail}>
              <Input
                type="email"
                value={formData.providerEmail}
                onChange={(e) => handleChange('providerEmail', e.target.value)}
                placeholder="records@abcdental.com"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Address">
                <Textarea
                  value={formData.providerAddress}
                  onChange={(e) => handleChange('providerAddress', e.target.value)}
                  placeholder="123 Main Street&#10;Toronto, ON M5V 1A1"
                  rows={2}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Record Types */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Record Types</CardTitle>
          </CardHeader>
          <CardContent compact className="space-y-4">
            {errors.recordTypes && (
              <p className="text-sm text-destructive">{errors.recordTypes}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recordTypeOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`record-${opt.value}`}
                    checked={formData.recordTypes.includes(opt.value)}
                    onCheckedChange={() => handleRecordTypeToggle(opt.value)}
                  />
                  <Label
                    htmlFor={`record-${opt.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>

            <FormField label="Date Range">
              <Select
                value={formData.dateRange}
                onValueChange={(v) => handleChange('dateRange', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Additional Details</CardTitle>
          </CardHeader>
          <CardContent compact className="space-y-4">
            <FormField label="Due Date">
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </FormField>

            <FormField label="Notes">
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="authorization"
                checked={formData.authorizationSigned}
                onCheckedChange={(checked) =>
                  handleChange('authorizationSigned', checked === true)
                }
              />
              <Label htmlFor="authorization" className="text-sm font-normal cursor-pointer">
                Patient authorization/release has been signed
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </>
  );
}
