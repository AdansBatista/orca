'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Plus, Loader2 } from 'lucide-react';
import type { Equipment, SterilizationCycleType, CycleStatus } from '@prisma/client';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
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
];

// Default parameters per cycle type
const defaultParameters: Record<SterilizationCycleType, { temp: number; pressure: number; exposure: number; drying: number }> = {
  STEAM_GRAVITY: { temp: 121, pressure: 15, exposure: 30, drying: 15 },
  STEAM_PREVACUUM: { temp: 132, pressure: 27, exposure: 4, drying: 20 },
  STEAM_FLASH: { temp: 132, pressure: 27, exposure: 3, drying: 0 },
  CHEMICAL: { temp: 0, pressure: 0, exposure: 0, drying: 0 },
  DRY_HEAT: { temp: 170, pressure: 0, exposure: 60, drying: 0 },
  VALIDATION: { temp: 132, pressure: 27, exposure: 4, drying: 20 },
};

export default function NewCyclePage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    equipmentId: '',
    cycleType: 'STEAM_PREVACUUM' as SterilizationCycleType,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
    temperature: 132,
    pressure: 27,
    exposureTime: 4,
    dryingTime: 20,
    status: 'IN_PROGRESS' as CycleStatus,
    mechanicalPass: null as boolean | null,
    chemicalPass: null as boolean | null,
    biologicalPass: null as boolean | null,
    notes: '',
    failureReason: '',
  });

  // Fetch equipment for dropdown
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch('/api/resources/equipment?pageSize=100&category=STERILIZATION');
        const result = await response.json();
        if (result.success) {
          setEquipment(result.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
      }
    };
    fetchEquipment();
  }, []);

  // Update parameters when cycle type changes
  const handleCycleTypeChange = (value: SterilizationCycleType) => {
    const params = defaultParameters[value];
    setFormData({
      ...formData,
      cycleType: value,
      temperature: params.temp,
      pressure: params.pressure,
      exposureTime: params.exposure,
      dryingTime: params.drying,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Please select equipment';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/resources/sterilization/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: formData.equipmentId,
          cycleType: formData.cycleType,
          startTime: new Date(formData.startTime),
          endTime: formData.endTime ? new Date(formData.endTime) : undefined,
          temperature: formData.temperature || undefined,
          pressure: formData.pressure || undefined,
          exposureTime: formData.exposureTime || undefined,
          dryingTime: formData.dryingTime || undefined,
          status: formData.status,
          mechanicalPass: formData.mechanicalPass,
          chemicalPass: formData.chemicalPass,
          biologicalPass: formData.biologicalPass,
          notes: formData.notes || undefined,
          failureReason: formData.status === 'FAILED' ? formData.failureReason : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create cycle');
      }

      router.push(`/resources/sterilization/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Sterilization Cycle"
        description="Record a new sterilization cycle"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Sterilization', href: '/resources/sterilization' },
          { label: 'New Cycle' },
        ]}
      />
      <PageContent density="comfortable">
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {error && (
            <Alert variant="destructive">
              {error}
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
                    onValueChange={(v) => handleCycleTypeChange(v as SterilizationCycleType)}
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
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Pressure (PSI)">
                  <Input
                    type="number"
                    value={formData.pressure}
                    onChange={(e) =>
                      setFormData({ ...formData, pressure: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Exposure (min)">
                  <Input
                    type="number"
                    value={formData.exposureTime}
                    onChange={(e) =>
                      setFormData({ ...formData, exposureTime: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Drying (min)">
                  <Input
                    type="number"
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
              <CardTitle size="sm">Indicator Results (Optional)</CardTitle>
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
                <FormField label="Failure Reason" required>
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Cycle
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContent>
    </>
  );
}
