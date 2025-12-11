'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RotateCw, ArrowLeft, Save, Info } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ApplianceRecord {
  id: string;
  applianceType: string;
  arch: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const activationTypes = [
  { value: 'Expansion', description: 'Palatal or arch expansion activation' },
  { value: 'Adjustment', description: 'General appliance adjustment' },
  { value: 'Tightening', description: 'Screw or spring tightening' },
  { value: 'Compliance Check', description: 'Patient compliance verification' },
  { value: 'Repair', description: 'Appliance repair or modification' },
  { value: 'Other', description: 'Other activation type' },
];

function NewActivationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applianceIdParam = searchParams.get('applianceId');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [appliances, setAppliances] = useState<ApplianceRecord[]>([]);
  const [loadingAppliances, setLoadingAppliances] = useState(true);

  // Form state
  const [applianceRecordId, setApplianceRecordId] = useState(applianceIdParam || '');
  const [activationDate, setActivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [activationType, setActivationType] = useState('Expansion');
  const [turns, setTurns] = useState('');
  const [millimeters, setMillimeters] = useState('');
  const [instructions, setInstructions] = useState('');
  const [nextActivationDate, setNextActivationDate] = useState('');
  const [isPatientReported, setIsPatientReported] = useState(false);
  const [reportedWearHours, setReportedWearHours] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchAppliances = async () => {
      try {
        // Fetch appliances that can be activated (expanders, etc.)
        const params = new URLSearchParams();
        params.set('status', 'ACTIVE');
        params.set('pageSize', '100');

        const res = await fetch(`/api/appliances?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          // Filter to only activatable types
          const activatableTypes = ['EXPANDER', 'HERBST', 'DISTALIZER', 'FORSUS', 'MARA', 'TWIN_BLOCK', 'HEADGEAR', 'FACEMASK'];
          const filtered = data.data.items.filter((a: ApplianceRecord) =>
            activatableTypes.includes(a.applianceType)
          );
          setAppliances(filtered);
        }
      } catch (error) {
        console.error('Error fetching appliances:', error);
      } finally {
        setLoadingAppliances(false);
      }
    };
    fetchAppliances();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/appliance-activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applianceRecordId,
          activationDate: new Date(activationDate),
          activationType,
          turns: turns ? parseInt(turns) : null,
          millimeters: millimeters ? parseFloat(millimeters) : null,
          instructions: instructions || null,
          nextActivationDate: nextActivationDate ? new Date(nextActivationDate) : null,
          isPatientReported,
          reportedWearHours: reportedWearHours ? parseInt(reportedWearHours) : null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/treatment/appliances/activations/${data.data.id}`);
      } else if (data.error?.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data.error.details.fieldErrors).forEach(([key, value]) => {
          fieldErrors[key] = (value as string[])[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: data.error?.message || 'Failed to record activation' });
      }
    } catch (error) {
      console.error('Error recording activation:', error);
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const selectedAppliance = appliances.find((a) => a.id === applianceRecordId);

  return (
    <>
      <PageHeader
        title="Record Activation"
        description="Record an appliance activation or adjustment"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Activations', href: '/treatment/appliances/activations' },
          { label: 'New' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <PageContent>
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {errors.form && (
            <Alert variant="destructive">
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          )}

          {/* Appliance Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appliance</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField label="Appliance" required error={errors.applianceRecordId}>
                <Select value={applianceRecordId} onValueChange={setApplianceRecordId} disabled={loadingAppliances}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAppliances ? 'Loading...' : 'Select appliance'} />
                  </SelectTrigger>
                  <SelectContent>
                    {appliances.map((appliance) => (
                      <SelectItem key={appliance.id} value={appliance.id}>
                        {appliance.patient.firstName} {appliance.patient.lastName} - {appliance.applianceType} ({appliance.arch})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {selectedAppliance && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedAppliance.applianceType}</strong> for{' '}
                    {selectedAppliance.patient.firstName} {selectedAppliance.patient.lastName} ({selectedAppliance.arch} arch)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Activation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Activation Date" required error={errors.activationDate}>
                  <Input
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Activation Type" required error={errors.activationType}>
                  <Select value={activationType} onValueChange={setActivationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Turns" error={errors.turns}>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={turns}
                    onChange={(e) => setTurns(e.target.value)}
                    placeholder="Number of turns (e.g., 2)"
                  />
                </FormField>

                <FormField label="Millimeters" error={errors.millimeters}>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={20}
                    value={millimeters}
                    onChange={(e) => setMillimeters(e.target.value)}
                    placeholder="Expansion in mm"
                  />
                </FormField>
              </div>

              <FormField label="Instructions for Next Activation" error={errors.instructions}>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Turn 2x daily in the morning and evening..."
                  rows={2}
                />
              </FormField>

              <FormField label="Next Activation Date" error={errors.nextActivationDate}>
                <Input
                  type="date"
                  value={nextActivationDate}
                  onChange={(e) => setNextActivationDate(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Patient Reporting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPatientReported"
                  checked={isPatientReported}
                  onCheckedChange={setIsPatientReported}
                />
                <Label htmlFor="isPatientReported">This is a patient-reported activation</Label>
              </div>

              {isPatientReported && (
                <FormField label="Reported Wear Hours (daily)" error={errors.reportedWearHours}>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    value={reportedWearHours}
                    onChange={(e) => setReportedWearHours(e.target.value)}
                    placeholder="Hours worn per day"
                  />
                </FormField>
              )}

              <FormField label="Notes" error={errors.notes}>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this activation..."
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Expansion Guide */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <RotateCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Typical Expansion Protocol:</strong>
                  <p className="mt-1">
                    Most expanders: 1-2 turns (0.25mm each) per day.
                    Full expansion typically takes 2-4 weeks.
                    Retention period follows for 3-6 months.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Recording...' : 'Record Activation'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

function NewActivationPageLoading() {
  return (
    <>
      <PageHeader
        title="Record Activation"
        description="Record an appliance activation or adjustment"
        compact
      />
      <PageContent>
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

export default function NewActivationPage() {
  return (
    <Suspense fallback={<NewActivationPageLoading />}>
      <NewActivationPageContent />
    </Suspense>
  );
}
