'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleDot, ArrowLeft, Save, Info } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
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

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const elasticTypes = [
  { value: 'CLASS_II', label: 'Class II', description: 'Correct Class II malocclusion' },
  { value: 'CLASS_III', label: 'Class III', description: 'Correct Class III malocclusion' },
  { value: 'VERTICAL', label: 'Vertical', description: 'Open/deep bite correction' },
  { value: 'CROSS', label: 'Cross', description: 'Crossbite correction' },
  { value: 'BOX', label: 'Box', description: 'Four-point elastic configuration' },
  { value: 'TRIANGLE', label: 'Triangle', description: 'Three-point elastic configuration' },
  { value: 'ZIG_ZAG', label: 'Zig-Zag', description: 'Alternating attachment pattern' },
  { value: 'CUSTOM', label: 'Custom', description: 'Custom configuration' },
];

const elasticSizes = [
  { value: 'LIGHT_1_8', label: '1/8" Light (2 oz)', force: '2 oz' },
  { value: 'LIGHT_3_16', label: '3/16" Light (2 oz)', force: '2 oz' },
  { value: 'MEDIUM_1_4', label: '1/4" Medium (4 oz)', force: '4 oz' },
  { value: 'MEDIUM_5_16', label: '5/16" Medium (4 oz)', force: '4 oz' },
  { value: 'HEAVY_3_8', label: '3/8" Heavy (6 oz)', force: '6 oz' },
  { value: 'HEAVY_1_2', label: '1/2" Heavy (6 oz)', force: '6 oz' },
];

function NewElasticPrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Form state
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [elasticType, setElasticType] = useState('');
  const [elasticSize, setElasticSize] = useState('');
  const [fromTooth, setFromTooth] = useState('');
  const [toTooth, setToTooth] = useState('');
  const [wearSchedule, setWearSchedule] = useState('Full-time (remove only for eating and brushing)');
  const [hoursPerDay, setHoursPerDay] = useState('22');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patients?pageSize=100&sortBy=lastName&sortOrder=asc');
        const data = await res.json();
        if (data.success) {
          setPatients(data.data.items);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/elastic-prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          elasticType,
          elasticSize,
          fromTooth: parseInt(fromTooth),
          toTooth: parseInt(toTooth),
          wearSchedule,
          hoursPerDay: parseInt(hoursPerDay),
          startDate: new Date(startDate),
          instructions: instructions || null,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/treatment/appliances/elastics/${data.data.id}`);
      } else if (data.error?.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data.error.details.fieldErrors).forEach(([key, value]) => {
          fieldErrors[key] = (value as string[])[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: data.error?.message || 'Failed to create prescription' });
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = elasticTypes.find((t) => t.value === elasticType);

  return (
    <>
      <PageHeader
        title="New Elastic Prescription"
        description="Create a new elastic wear prescription"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Elastics', href: '/treatment/appliances/elastics' },
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

          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField label="Patient" required error={errors.patientId}>
                <Select value={patientId} onValueChange={setPatientId} disabled={loadingPatients}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPatients ? 'Loading...' : 'Select patient'} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Elastic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Elastic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Elastic Type" required error={errors.elasticType}>
                  <Select value={elasticType} onValueChange={setElasticType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {elasticTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Elastic Size" required error={errors.elasticSize}>
                  <Select value={elasticSize} onValueChange={setElasticSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {elasticSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {selectedType && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedType.label}:</strong> {selectedType.description}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="From Tooth #" required error={errors.fromTooth}>
                  <Input
                    type="number"
                    min={1}
                    max={32}
                    value={fromTooth}
                    onChange={(e) => setFromTooth(e.target.value)}
                    placeholder="e.g., 6"
                  />
                </FormField>

                <FormField label="To Tooth #" required error={errors.toTooth}>
                  <Input
                    type="number"
                    min={1}
                    max={32}
                    value={toTooth}
                    onChange={(e) => setToTooth(e.target.value)}
                    placeholder="e.g., 27"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Wear Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wear Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Wear Schedule" required error={errors.wearSchedule}>
                <Select value={wearSchedule} onValueChange={setWearSchedule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time (remove only for eating and brushing)">
                      Full-time (remove only for eating and brushing)
                    </SelectItem>
                    <SelectItem value="Nighttime only">Nighttime only</SelectItem>
                    <SelectItem value="20+ hours per day">20+ hours per day</SelectItem>
                    <SelectItem value="As instructed">As instructed</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Hours Per Day" required error={errors.hoursPerDay}>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(e.target.value)}
                  />
                </FormField>

                <FormField label="Start Date" required error={errors.startDate}>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Special Instructions" error={errors.instructions}>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any special instructions for the patient..."
                  rows={3}
                />
              </FormField>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Prescription is active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Tooth Number Reference */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CircleDot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Universal Tooth Numbering:</strong>
                  <p className="mt-1">
                    Upper right: 1-8 | Upper left: 9-16 | Lower left: 17-24 | Lower right: 25-32
                  </p>
                  <p className="mt-1">
                    Common configurations: Class II (Upper 6 to Lower 6),
                    Triangle (3 teeth), Box (4 teeth square pattern)
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
              {loading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}

export default function NewElasticPrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewElasticPrescriptionForm />
    </Suspense>
  );
}
