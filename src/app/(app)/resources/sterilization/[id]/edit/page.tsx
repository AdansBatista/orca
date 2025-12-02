'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Loader2, ArrowLeft, AlertTriangle, Save } from 'lucide-react';
import type { Equipment, SterilizationCycleType, CycleStatus, SterilizationCycle } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
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
import { Alert } from '@/components/ui/alert';

const cycleTypes: { value: SterilizationCycleType; label: string }[] = [
  { value: 'STEAM_GRAVITY', label: 'Steam Gravity' },
  { value: 'STEAM_PREVACUUM', label: 'Steam Pre-Vacuum' },
  { value: 'STEAM_FLASH', label: 'Flash/Immediate' },
  { value: 'CHEMICAL', label: 'Chemical' },
  { value: 'DRY_HEAT', label: 'Dry Heat' },
  { value: 'VALIDATION', label: 'Validation' },
];

const statusOptions: { value: CycleStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ABORTED', label: 'Aborted' },
  { value: 'VOID', label: 'Void' },
];

function formatDateTimeLocal(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EditCyclePage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [cycle, setCycle] = useState<SterilizationCycle | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    equipmentId: '',
    cycleType: 'STEAM_PREVACUUM' as SterilizationCycleType,
    startTime: '',
    endTime: '',
    temperature: 0,
    pressure: 0,
    exposureTime: 0,
    dryingTime: 0,
    status: 'IN_PROGRESS' as CycleStatus,
    mechanicalPass: null as boolean | null,
    chemicalPass: null as boolean | null,
    biologicalPass: null as boolean | null,
    notes: '',
    failureReason: '',
  });

  // Fetch cycle and equipment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cycleResponse, equipmentResponse] = await Promise.all([
          fetch(`/api/resources/sterilization/cycles/${cycleId}`),
          fetch('/api/resources/equipment?pageSize=100&category=STERILIZATION'),
        ]);

        const cycleResult = await cycleResponse.json();
        const equipmentResult = await equipmentResponse.json();

        if (!cycleResult.success) {
          throw new Error(cycleResult.error?.message || 'Failed to fetch cycle');
        }

        const cycleData = cycleResult.data;
        setCycle(cycleData);

        // Populate form with existing data
        setFormData({
          equipmentId: cycleData.equipmentId || '',
          cycleType: cycleData.cycleType,
          startTime: formatDateTimeLocal(cycleData.startTime),
          endTime: formatDateTimeLocal(cycleData.endTime),
          temperature: cycleData.temperature ? Number(cycleData.temperature) : 0,
          pressure: cycleData.pressure ? Number(cycleData.pressure) : 0,
          exposureTime: cycleData.exposureTime ? Number(cycleData.exposureTime) : 0,
          dryingTime: cycleData.dryingTime ? Number(cycleData.dryingTime) : 0,
          status: cycleData.status,
          mechanicalPass: cycleData.mechanicalPass,
          chemicalPass: cycleData.chemicalPass,
          biologicalPass: cycleData.biologicalPass,
          notes: cycleData.notes || '',
          failureReason: cycleData.failureReason || '',
        });

        if (equipmentResult.success) {
          setEquipment(equipmentResult.data.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Please select equipment';
    }
    if (formData.status === 'FAILED' && !formData.failureReason) {
      newErrors.failureReason = 'Please provide a failure reason';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/resources/sterilization/cycles/${cycleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: formData.equipmentId,
          cycleType: formData.cycleType,
          startTime: new Date(formData.startTime),
          endTime: formData.endTime ? new Date(formData.endTime) : null,
          temperature: formData.temperature || null,
          pressure: formData.pressure || null,
          exposureTime: formData.exposureTime || null,
          dryingTime: formData.dryingTime || null,
          status: formData.status,
          mechanicalPass: formData.mechanicalPass,
          chemicalPass: formData.chemicalPass,
          biologicalPass: formData.biologicalPass,
          notes: formData.notes || null,
          failureReason: formData.status === 'FAILED' ? formData.failureReason : null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update cycle');
      }

      router.push(`/resources/sterilization/${cycleId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Sterilization Cycle"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !cycle) {
    return (
      <>
        <PageHeader
          title="Edit Sterilization Cycle"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Sterilization', href: '/resources/sterilization' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost" className="border-error-200 bg-error-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-600 mb-4" />
              <h3 className="font-semibold text-error-900 mb-2">Failed to load cycle</h3>
              <p className="text-error-700 mb-4">{error || 'Cycle not found'}</p>
              <div className="flex justify-center gap-3">
                <Link href="/resources/sterilization">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sterilization
                  </Button>
                </Link>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Sterilization Cycle"
        description={`Editing ${cycle.cycleNumber}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: cycle.cycleNumber, href: `/resources/sterilization/${cycleId}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {saveError && (
            <Alert variant="destructive">
              {saveError}
            </Alert>
          )}

          {/* Equipment and Type */}
          <Card>
            <CardHeader>
              <CardTitle size="sm" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Cycle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Equipment" required error={errors.equipmentId}>
                  <Select
                    value={formData.equipmentId}
                    onValueChange={(v) => setFormData({ ...formData, equipmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sterilization equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Cycle Type" required>
                  <Select
                    value={formData.cycleType}
                    onValueChange={(v) => setFormData({ ...formData, cycleType: v as SterilizationCycleType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cycleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Start Time" required>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </FormField>

                <FormField label="End Time">
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Status" required>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as CycleStatus })}
                >
                  <SelectTrigger className="w-48">
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

          {/* Cycle Parameters */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Cycle Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <FormField label="Temperature (°C)">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Pressure (PSI)">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pressure}
                    onChange={(e) =>
                      setFormData({ ...formData, pressure: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Exposure (min)">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exposureTime}
                    onChange={(e) =>
                      setFormData({ ...formData, exposureTime: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Drying (min)">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dryingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dryingTime: Number(e.target.value) })
                    }
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Indicator Results */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Indicator Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Mechanical">
                  <Select
                    value={
                      formData.mechanicalPass === null
                        ? 'pending'
                        : formData.mechanicalPass
                          ? 'passed'
                          : 'failed'
                    }
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        mechanicalPass: v === 'pending' ? null : v === 'passed',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Chemical">
                  <Select
                    value={
                      formData.chemicalPass === null
                        ? 'pending'
                        : formData.chemicalPass
                          ? 'passed'
                          : 'failed'
                    }
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        chemicalPass: v === 'pending' ? null : v === 'passed',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Biological">
                  <Select
                    value={
                      formData.biologicalPass === null
                        ? 'pending'
                        : formData.biologicalPass
                          ? 'passed'
                          : 'failed'
                    }
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        biologicalPass: v === 'pending' ? null : v === 'passed',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this cycle..."
                  rows={3}
                />
              </FormField>

              {formData.status === 'FAILED' && (
                <FormField label="Failure Reason" required error={errors.failureReason}>
                  <Textarea
                    value={formData.failureReason}
                    onChange={(e) => setFormData({ ...formData, failureReason: e.target.value })}
                    placeholder="Describe the reason for failure..."
                    rows={2}
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
