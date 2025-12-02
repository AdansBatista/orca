'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, X, Loader2 } from 'lucide-react';
import type { PackageType, SterilizationCycle, InstrumentSet } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PackageFormProps {
  cycleId?: string;
  onSuccess?: (pkg: { id: string; packageNumber: string }) => void;
  onCancel?: () => void;
}

const packageTypeOptions: { value: PackageType; label: string }[] = [
  { value: 'CASSETTE_FULL', label: 'Full Cassette' },
  { value: 'CASSETTE_EXAM', label: 'Exam Cassette' },
  { value: 'POUCH', label: 'Pouch' },
  { value: 'WRAPPED', label: 'Wrapped' },
  { value: 'INDIVIDUAL', label: 'Individual' },
];

export function PackageForm({ cycleId, onSuccess, onCancel }: PackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available data
  const [cycles, setCycles] = useState<SterilizationCycle[]>([]);
  const [instrumentSets, setInstrumentSets] = useState<InstrumentSet[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    cycleId: cycleId || '',
    packageType: 'POUCH' as PackageType,
    instrumentSetId: '',
    instrumentNames: [] as string[],
    itemCount: 1,
    cassetteName: '',
    expirationDays: 30,
    notes: '',
  });

  // New instrument input
  const [newInstrument, setNewInstrument] = useState('');

  // Fetch cycles and instrument sets
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [cyclesRes, setsRes] = await Promise.all([
          fetch('/api/resources/sterilization/cycles?status=COMPLETED&pageSize=50'),
          fetch('/api/resources/sterilization/instrument-sets?status=AVAILABLE&pageSize=100'),
        ]);

        const cyclesData = await cyclesRes.json();
        const setsData = await setsRes.json();

        if (cyclesData.success) {
          setCycles(cyclesData.data.items);
        }
        if (setsData.success) {
          setInstrumentSets(setsData.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // When instrument set is selected, populate instrument names
  const handleInstrumentSetChange = (setId: string) => {
    // Treat "none" as no selection
    const actualSetId = setId === 'none' ? '' : setId;
    setFormData({ ...formData, instrumentSetId: actualSetId });

    if (actualSetId) {
      const selectedSet = instrumentSets.find((s) => s.id === actualSetId);
      if (selectedSet) {
        // Use set name as the instrument name
        setFormData((prev) => ({
          ...prev,
          instrumentSetId: actualSetId,
          instrumentNames: [selectedSet.name],
          itemCount: selectedSet.instrumentCount,
          cassetteName: selectedSet.name,
        }));
      }
    }
  };

  const addInstrument = () => {
    if (newInstrument.trim()) {
      setFormData({
        ...formData,
        instrumentNames: [...formData.instrumentNames, newInstrument.trim()],
      });
      setNewInstrument('');
    }
  };

  const removeInstrument = (index: number) => {
    setFormData({
      ...formData,
      instrumentNames: formData.instrumentNames.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.cycleId) {
      newErrors.cycleId = 'Please select a sterilization cycle';
    }
    if (formData.instrumentNames.length === 0) {
      newErrors.instrumentNames = 'Add at least one instrument';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/resources/sterilization/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: formData.cycleId,
          packageType: formData.packageType,
          instrumentSetId: formData.instrumentSetId || undefined,
          instrumentNames: formData.instrumentNames,
          itemCount: formData.itemCount,
          cassetteName: formData.cassetteName || undefined,
          expirationDays: formData.expirationDays,
          notes: formData.notes || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create package');
      }

      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.push(`/resources/sterilization/packages/${result.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      {/* Cycle Selection */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Sterilization Cycle" required error={errors.cycleId}>
              <Select
                value={formData.cycleId}
                onValueChange={(v) => setFormData({ ...formData, cycleId: v })}
                disabled={!!cycleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a completed cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No completed cycles available
                    </SelectItem>
                  ) : (
                    cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.cycleNumber} - {new Date(cycle.startTime).toLocaleDateString()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Package Type" required>
              <Select
                value={formData.packageType}
                onValueChange={(v) => setFormData({ ...formData, packageType: v as PackageType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packageTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Instrument Set (Optional)">
              <Select
                value={formData.instrumentSetId || 'none'}
                onValueChange={handleInstrumentSetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an instrument set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {instrumentSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} ({set.instrumentCount} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Cassette/Pack Name">
              <Input
                value={formData.cassetteName}
                onChange={(e) => setFormData({ ...formData, cassetteName: e.target.value })}
                placeholder="e.g., Ortho Bonding Set A"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Instruments */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Instruments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Add Instruments" error={errors.instrumentNames}>
            <div className="flex gap-2">
              <Input
                value={newInstrument}
                onChange={(e) => setNewInstrument(e.target.value)}
                placeholder="Enter instrument name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInstrument();
                  }
                }}
              />
              <Button type="button" onClick={addInstrument} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          {formData.instrumentNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.instrumentNames.map((name, index) => (
                <Badge key={index} variant="soft-primary" className="pl-3 pr-1 py-1">
                  {name}
                  <button
                    type="button"
                    onClick={() => removeInstrument(index)}
                    className="ml-1 p-0.5 hover:bg-primary-200 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Item Count">
              <Input
                type="number"
                min="1"
                value={formData.itemCount}
                onChange={(e) => setFormData({ ...formData, itemCount: parseInt(e.target.value) || 1 })}
              />
            </FormField>

            <FormField label="Expiration Days">
              <Input
                type="number"
                min="1"
                max="365"
                value={formData.expirationDays}
                onChange={(e) => setFormData({ ...formData, expirationDays: parseInt(e.target.value) || 30 })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Notes">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this package..."
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
