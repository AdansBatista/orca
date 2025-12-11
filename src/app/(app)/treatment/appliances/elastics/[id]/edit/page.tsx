'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CircleDot } from 'lucide-react';

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

interface ElasticPrescription {
  id: string;
  elasticType: string;
  elasticSize: string;
  fromTooth: number;
  toTooth: number;
  wearSchedule: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  instructions: string | null;
  complianceNotes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const elasticTypes = [
  { value: 'CLASS_II', label: 'Class II' },
  { value: 'CLASS_III', label: 'Class III' },
  { value: 'VERTICAL', label: 'Vertical' },
  { value: 'CROSS', label: 'Cross' },
  { value: 'BOX', label: 'Box' },
  { value: 'TRIANGLE', label: 'Triangle' },
  { value: 'ZIG_ZAG', label: 'Zig-Zag' },
  { value: 'CUSTOM', label: 'Custom' },
];

const elasticSizes = [
  { value: 'LIGHT_1_8', label: '1/8" Light (2 oz)' },
  { value: 'LIGHT_3_16', label: '3/16" Light (2 oz)' },
  { value: 'MEDIUM_1_4', label: '1/4" Medium (4 oz)' },
  { value: 'MEDIUM_5_16', label: '5/16" Medium (4 oz)' },
  { value: 'HEAVY_3_8', label: '3/8" Heavy (6 oz)' },
  { value: 'HEAVY_1_2', label: '1/2" Heavy (6 oz)' },
];

export default function EditElasticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [elastic, setElastic] = useState<ElasticPrescription | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [elasticType, setElasticType] = useState('');
  const [elasticSize, setElasticSize] = useState('');
  const [fromTooth, setFromTooth] = useState('');
  const [toTooth, setToTooth] = useState('');
  const [wearSchedule, setWearSchedule] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [complianceNotes, setComplianceNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchElastic = useCallback(async () => {
    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`);
      const data = await res.json();
      if (data.success) {
        const e = data.data;
        setElastic(e);
        setElasticType(e.elasticType);
        setElasticSize(e.elasticSize);
        setFromTooth(e.fromTooth.toString());
        setToTooth(e.toTooth.toString());
        setWearSchedule(e.wearSchedule);
        setHoursPerDay(e.hoursPerDay.toString());
        setStartDate(e.startDate.split('T')[0]);
        setEndDate(e.endDate ? e.endDate.split('T')[0] : '');
        setInstructions(e.instructions || '');
        setComplianceNotes(e.complianceNotes || '');
        setIsActive(e.isActive);
      }
    } catch (error) {
      console.error('Error fetching elastic:', error);
    } finally {
      setLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchElastic();
  }, [fetchElastic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`/api/elastic-prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elasticType,
          elasticSize,
          fromTooth: parseInt(fromTooth),
          toTooth: parseInt(toTooth),
          wearSchedule,
          hoursPerDay: parseInt(hoursPerDay),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          instructions: instructions || null,
          complianceNotes: complianceNotes || null,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/treatment/appliances/elastics/${id}`);
      } else if (data.error?.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data.error.details.fieldErrors).forEach(([key, value]) => {
          fieldErrors[key] = (value as string[])[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: data.error?.message || 'Failed to update prescription' });
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <>
        <PageHeader title="Edit Elastic Prescription" compact />
        <PageContent>
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </>
    );
  }

  if (!elastic) {
    return (
      <>
        <PageHeader title="Edit Elastic Prescription" compact />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Prescription not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/treatment/appliances/elastics')}
              >
                Back to Elastics
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Elastic Prescription"
        description={`Patient: ${elastic.patient.firstName} ${elastic.patient.lastName}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Elastics', href: '/treatment/appliances/elastics' },
          { label: 'Edit' },
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="From Tooth #" required error={errors.fromTooth}>
                  <Input
                    type="number"
                    min={1}
                    max={32}
                    value={fromTooth}
                    onChange={(e) => setFromTooth(e.target.value)}
                  />
                </FormField>

                <FormField label="To Tooth #" required error={errors.toTooth}>
                  <Input
                    type="number"
                    min={1}
                    max={32}
                    value={toTooth}
                    onChange={(e) => setToTooth(e.target.value)}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormField label="End Date" error={errors.endDate}>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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

              <FormField label="Compliance Notes" error={errors.complianceNotes}>
                <Textarea
                  value={complianceNotes}
                  onChange={(e) => setComplianceNotes(e.target.value)}
                  placeholder="Notes about patient compliance..."
                  rows={2}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
