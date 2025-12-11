'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

const wireTypes = [
  { value: 'NITI_ROUND', label: 'NiTi Round' },
  { value: 'NITI_RECTANGULAR', label: 'NiTi Rectangular' },
  { value: 'NITI_HEAT_ACTIVATED', label: 'NiTi Heat-Activated' },
  { value: 'SS_ROUND', label: 'SS Round' },
  { value: 'SS_RECTANGULAR', label: 'SS Rectangular' },
  { value: 'TMA', label: 'TMA' },
  { value: 'BETA_TITANIUM', label: 'Beta Titanium' },
  { value: 'BRAIDED', label: 'Braided' },
  { value: 'COAXIAL', label: 'Coaxial' },
];

const wireMaterials = [
  { value: 'NICKEL_TITANIUM', label: 'Nickel Titanium' },
  { value: 'STAINLESS_STEEL', label: 'Stainless Steel' },
  { value: 'TMA', label: 'TMA' },
  { value: 'BETA_TITANIUM', label: 'Beta Titanium' },
  { value: 'COPPER_NITI', label: 'Copper NiTi' },
];

const commonWireSizes = [
  '0.012"',
  '0.014"',
  '0.016"',
  '0.018"',
  '0.016" x 0.022"',
  '0.017" x 0.025"',
  '0.018" x 0.025"',
  '0.019" x 0.025"',
  '0.021" x 0.025"',
];

interface ApplianceOption {
  id: string;
  applianceType: string;
  arch: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function NewWireRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedApplianceId = searchParams.get('applianceId');

  const [loading, setLoading] = useState(false);
  const [appliances, setAppliances] = useState<ApplianceOption[]>([]);
  const [loadingAppliances, setLoadingAppliances] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [applianceRecordId, setApplianceRecordId] = useState(preselectedApplianceId || '');
  const [wireType, setWireType] = useState('');
  const [wireSize, setWireSize] = useState('');
  const [wireMaterial, setWireMaterial] = useState('');
  const [arch, setArch] = useState<'UPPER' | 'LOWER' | 'BOTH'>('UPPER');
  const [placedDate, setPlacedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sequenceNumber, setSequenceNumber] = useState('');
  const [bends, setBends] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchAppliances = async () => {
      try {
        const res = await fetch('/api/appliances?status=ACTIVE&pageSize=100');
        const data = await res.json();
        if (data.success) {
          setAppliances(data.data.items);
        }
      } catch (error) {
        console.error('Error fetching appliances:', error);
      } finally {
        setLoadingAppliances(false);
      }
    };
    fetchAppliances();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!applianceRecordId) {
      newErrors.applianceRecordId = 'Please select an appliance record';
    }
    if (!wireType) {
      newErrors.wireType = 'Wire type is required';
    }
    if (!wireSize.trim()) {
      newErrors.wireSize = 'Wire size is required';
    }
    if (!wireMaterial) {
      newErrors.wireMaterial = 'Wire material is required';
    }
    if (!placedDate) {
      newErrors.placedDate = 'Placed date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/wires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applianceRecordId,
          wireType,
          wireSize,
          wireMaterial,
          arch,
          placedDate: new Date(placedDate).toISOString(),
          sequenceNumber: sequenceNumber ? parseInt(sequenceNumber) : null,
          bends: bends || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/treatment/appliances/wires/${data.data.id}`);
      } else {
        setErrors({ submit: data.error?.message || 'Failed to create wire record' });
      }
    } catch (error) {
      console.error('Error creating wire record:', error);
      setErrors({ submit: 'Failed to create wire record' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Wire Record"
        description="Record a new archwire placement"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Appliances', href: '/treatment/appliances' },
          { label: 'Wires', href: '/treatment/appliances/wires' },
          { label: 'New' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push('/treatment/appliances/wires')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <PageContent>
        <form onSubmit={handleSubmit}>
          <div className="max-w-2xl space-y-6">
            {/* Appliance Selection */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Appliance Record</CardTitle>
                <CardDescription>
                  Select the bracket/appliance record this wire is associated with
                </CardDescription>
              </CardHeader>
              <CardContent compact>
                <FormField label="Appliance Record" required error={errors.applianceRecordId}>
                  <Select
                    value={applianceRecordId}
                    onValueChange={setApplianceRecordId}
                    disabled={loadingAppliances}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingAppliances ? 'Loading...' : 'Select appliance record'} />
                    </SelectTrigger>
                    <SelectContent>
                      {appliances.map((appliance) => (
                        <SelectItem key={appliance.id} value={appliance.id}>
                          <span className="flex items-center gap-2">
                            <PhiProtected fakeData={getFakeName()}>
                              {appliance.patient.firstName} {appliance.patient.lastName}
                            </PhiProtected>
                            <span className="text-muted-foreground">
                              - {appliance.applianceType} ({appliance.arch})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>

            {/* Wire Details */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Wire Details</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Wire Type" required error={errors.wireType}>
                    <Select value={wireType} onValueChange={setWireType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wire type" />
                      </SelectTrigger>
                      <SelectContent>
                        {wireTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Wire Material" required error={errors.wireMaterial}>
                    <Select value={wireMaterial} onValueChange={setWireMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {wireMaterials.map((material) => (
                          <SelectItem key={material.value} value={material.value}>
                            {material.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Wire Size" required error={errors.wireSize}>
                    <Select value={wireSize} onValueChange={setWireSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonWireSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Arch" required>
                    <Select value={arch} onValueChange={(v) => setArch(v as 'UPPER' | 'LOWER' | 'BOTH')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPPER">Upper</SelectItem>
                        <SelectItem value="LOWER">Lower</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Placed Date" required error={errors.placedDate}>
                    <Input
                      type="date"
                      value={placedDate}
                      onChange={(e) => setPlacedDate(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Sequence Number">
                    <Input
                      type="number"
                      min="1"
                      value={sequenceNumber}
                      onChange={(e) => setSequenceNumber(e.target.value)}
                      placeholder="e.g., 1, 2, 3..."
                    />
                  </FormField>
                </div>

                <FormField label="Bends/Adjustments">
                  <Input
                    value={bends}
                    onChange={(e) => setBends(e.target.value)}
                    placeholder="e.g., Tip back, Step up, Curve of Spee"
                  />
                </FormField>

                <FormField label="Notes">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about the wire placement..."
                    rows={3}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Wire Sequence Guide */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Standard Wire Sequence</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>1.</strong> 0.014" NiTi (Initial alignment)</p>
                  <p><strong>2.</strong> 0.016" NiTi or 0.016" x 0.022" NiTi</p>
                  <p><strong>3.</strong> 0.017" x 0.025" NiTi or 0.018" x 0.025" NiTi</p>
                  <p><strong>4.</strong> 0.019" x 0.025" SS (Working wire)</p>
                  <p><strong>5.</strong> 0.021" x 0.025" SS (Finishing wire)</p>
                  <p><strong>6.</strong> Retainer/Retention phase</p>
                </div>
              </CardContent>
            </Card>

            {errors.submit && (
              <p className="text-sm text-destructive">{errors.submit}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/treatment/appliances/wires')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Wire Record'}
              </Button>
            </div>
          </div>
        </form>
      </PageContent>
    </>
  );
}

export default function NewWireRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewWireRecordForm />
    </Suspense>
  );
}
