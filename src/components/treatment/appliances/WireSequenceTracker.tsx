'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Plus, Trash2, ArrowRight, CheckCircle, Clock, Cable } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface WireData {
  id?: string;
  sequenceNumber: number;
  arch: 'UPPER' | 'LOWER';
  wireType: string;
  wireSize: string;
  material: string;
  insertedDate: Date;
  removedDate?: Date;
  status: 'ACTIVE' | 'REMOVED' | 'SCHEDULED';
  durationDays?: number;
  notes?: string;
}

interface WireSequenceTrackerProps {
  wires: WireData[];
  onChange: (wires: WireData[]) => void;
  readOnly?: boolean;
}

const wireTypes = [
  { value: 'ROUND', label: 'Round' },
  { value: 'RECTANGULAR', label: 'Rectangular' },
  { value: 'SQUARE', label: 'Square' },
  { value: 'REVERSE_CURVE', label: 'Reverse Curve' },
  { value: 'OVERLAY', label: 'Overlay' },
  { value: 'PIGGYBACK', label: 'Piggyback' },
];

const wireSizes = [
  // Round wires
  { value: '0.012', label: '.012" Round', type: 'ROUND' },
  { value: '0.014', label: '.014" Round', type: 'ROUND' },
  { value: '0.016', label: '.016" Round', type: 'ROUND' },
  { value: '0.018', label: '.018" Round', type: 'ROUND' },
  { value: '0.020', label: '.020" Round', type: 'ROUND' },
  // Rectangular wires
  { value: '0.016x0.016', label: '.016 x .016"', type: 'RECTANGULAR' },
  { value: '0.016x0.022', label: '.016 x .022"', type: 'RECTANGULAR' },
  { value: '0.017x0.025', label: '.017 x .025"', type: 'RECTANGULAR' },
  { value: '0.018x0.025', label: '.018 x .025"', type: 'RECTANGULAR' },
  { value: '0.019x0.025', label: '.019 x .025"', type: 'RECTANGULAR' },
  { value: '0.021x0.025', label: '.021 x .025"', type: 'RECTANGULAR' },
  // Square wires
  { value: '0.016x0.016_SQ', label: '.016 x .016" Square', type: 'SQUARE' },
  { value: '0.018x0.018_SQ', label: '.018 x .018" Square', type: 'SQUARE' },
];

const wireMaterials = [
  { value: 'NITI', label: 'NiTi (Nickel Titanium)' },
  { value: 'NITI_HEAT_ACTIVATED', label: 'Heat-Activated NiTi' },
  { value: 'NITI_COPPER', label: 'Copper NiTi' },
  { value: 'STAINLESS_STEEL', label: 'Stainless Steel' },
  { value: 'TMA', label: 'TMA (Beta Titanium)' },
  { value: 'BRAIDED_SS', label: 'Braided Stainless Steel' },
  { value: 'COAXIAL', label: 'Coaxial' },
];

// Typical wire progression
const typicalSequence = [
  { wireSize: '0.014', material: 'NITI', description: 'Initial leveling and alignment' },
  { wireSize: '0.016', material: 'NITI', description: 'Continued alignment' },
  { wireSize: '0.016x0.022', material: 'NITI', description: 'Rotational control' },
  { wireSize: '0.017x0.025', material: 'NITI', description: 'Torque expression begins' },
  { wireSize: '0.019x0.025', material: 'STAINLESS_STEEL', description: 'Working wire - space closure' },
  { wireSize: '0.021x0.025', material: 'STAINLESS_STEEL', description: 'Finishing and detailing' },
];

export function WireSequenceTracker({
  wires,
  onChange,
  readOnly = false,
}: WireSequenceTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedArch, setSelectedArch] = useState<'UPPER' | 'LOWER'>('UPPER');

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<WireData>>({
    defaultValues: {
      arch: 'UPPER',
      wireType: 'ROUND',
      wireSize: '0.014',
      material: 'NITI',
      status: 'ACTIVE',
      insertedDate: new Date(),
    },
  });

  const watchedWireType = watch('wireType');
  const filteredSizes = wireSizes.filter((s) => !watchedWireType || s.type === watchedWireType || watchedWireType === 'PIGGYBACK' || watchedWireType === 'OVERLAY');

  const upperWires = wires.filter((w) => w.arch === 'UPPER').sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const lowerWires = wires.filter((w) => w.arch === 'LOWER').sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const getNextSequenceNumber = (arch: 'UPPER' | 'LOWER') => {
    const archWires = arch === 'UPPER' ? upperWires : lowerWires;
    return archWires.length > 0 ? Math.max(...archWires.map((w) => w.sequenceNumber)) + 1 : 1;
  };

  const handleAdd = (data: Partial<WireData>) => {
    const newWire: WireData = {
      id: `temp-${Date.now()}`,
      sequenceNumber: getNextSequenceNumber(data.arch as 'UPPER' | 'LOWER'),
      arch: data.arch as 'UPPER' | 'LOWER',
      wireType: data.wireType || 'ROUND',
      wireSize: data.wireSize || '0.014',
      material: data.material || 'NITI',
      insertedDate: data.insertedDate || new Date(),
      status: 'ACTIVE',
      notes: data.notes,
    };

    // Set previous active wire as removed
    const updated = wires.map((w) => {
      if (w.arch === newWire.arch && w.status === 'ACTIVE') {
        const inserted = new Date(w.insertedDate);
        const removed = new Date();
        return {
          ...w,
          status: 'REMOVED' as const,
          removedDate: removed,
          durationDays: Math.floor((removed.getTime() - inserted.getTime()) / (1000 * 60 * 60 * 24)),
        };
      }
      return w;
    });

    onChange([...updated, newWire]);
    reset();
    setShowAddForm(false);
  };

  const handleRemove = (wireId: string) => {
    onChange(wires.filter((w) => w.id !== wireId));
  };

  const handleMarkRemoved = (wireId: string) => {
    const updated = wires.map((w) => {
      if (w.id === wireId) {
        const inserted = new Date(w.insertedDate);
        const removed = new Date();
        return {
          ...w,
          status: 'REMOVED' as const,
          removedDate: removed,
          durationDays: Math.floor((removed.getTime() - inserted.getTime()) / (1000 * 60 * 60 * 24)),
        };
      }
      return w;
    });
    onChange(updated);
  };

  const getStatusBadge = (status: WireData['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'REMOVED':
        return <Badge variant="secondary" size="sm">Removed</Badge>;
      case 'SCHEDULED':
        return <Badge variant="info" size="sm"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
    }
  };

  const getMaterialLabel = (material: string) => {
    return wireMaterials.find((m) => m.value === material)?.label || material;
  };

  const getSizeLabel = (size: string) => {
    return wireSizes.find((s) => s.value === size)?.label || size;
  };

  const getCurrentProgress = (archWires: WireData[]) => {
    const activeWire = archWires.find((w) => w.status === 'ACTIVE');
    if (!activeWire) return { phase: 'Not Started', progress: 0 };

    // Estimate progress based on wire size
    const sizeOrder = ['0.012', '0.014', '0.016', '0.016x0.022', '0.017x0.025', '0.018x0.025', '0.019x0.025', '0.021x0.025'];
    const currentIndex = sizeOrder.indexOf(activeWire.wireSize);
    const progress = currentIndex >= 0 ? Math.round(((currentIndex + 1) / sizeOrder.length) * 100) : 50;

    let phase = 'Initial';
    if (currentIndex <= 1) phase = 'Initial Leveling';
    else if (currentIndex <= 3) phase = 'Alignment';
    else if (currentIndex <= 5) phase = 'Working';
    else phase = 'Finishing';

    return { phase, progress };
  };

  const renderWireSequence = (archWires: WireData[], archName: string) => {
    const { phase, progress } = getCurrentProgress(archWires);
    const activeWire = archWires.find((w) => w.status === 'ACTIVE');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{archName} Arch</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">{phase}</Badge>
            <Badge variant="soft-primary" size="sm">{progress}% Complete</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Wire Timeline */}
        <div className="space-y-2">
          {archWires.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No wires recorded for this arch.
            </p>
          ) : (
            archWires.map((wire, index) => (
              <div
                key={wire.id || index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  wire.status === 'ACTIVE' ? 'bg-success-50 border border-success-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                  {wire.sequenceNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getSizeLabel(wire.wireSize)}</span>
                    {getStatusBadge(wire.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getMaterialLabel(wire.material)} • {wire.wireType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inserted: {format(new Date(wire.insertedDate), 'MMM d, yyyy')}
                    {wire.removedDate && ` • Removed: ${format(new Date(wire.removedDate), 'MMM d, yyyy')}`}
                    {wire.durationDays && ` • ${wire.durationDays} days`}
                  </p>
                  {wire.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{wire.notes}</p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    {wire.status === 'ACTIVE' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRemoved(wire.id!)}
                      >
                        Mark Removed
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-error-500"
                      onClick={() => handleRemove(wire.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <Cable className="h-4 w-4" />
          Wire Sequence Tracker
        </CardTitle>
        <CardDescription>Track archwire progression through treatment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upper Arch */}
        {renderWireSequence(upperWires, 'Upper')}

        {/* Lower Arch */}
        {renderWireSequence(lowerWires, 'Lower')}

        {/* Add Form */}
        {!readOnly && (
          <>
            {showAddForm ? (
              <form
                onSubmit={handleSubmit(handleAdd)}
                className="p-4 rounded-lg border border-dashed space-y-4"
              >
                <h4 className="font-medium">Add New Wire</h4>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Arch">
                    <Select
                      value={watch('arch') || 'UPPER'}
                      onValueChange={(v) => setValue('arch', v as 'UPPER' | 'LOWER')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPPER">Upper</SelectItem>
                        <SelectItem value="LOWER">Lower</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Wire Type">
                    <Select
                      value={watch('wireType') || 'ROUND'}
                      onValueChange={(v) => setValue('wireType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                  <FormField label="Wire Size">
                    <Select
                      value={watch('wireSize') || '0.014'}
                      onValueChange={(v) => setValue('wireSize', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Material">
                    <Select
                      value={watch('material') || 'NITI'}
                      onValueChange={(v) => setValue('material', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                <FormField label="Notes">
                  <Textarea
                    {...register('notes')}
                    placeholder="Additional notes about the wire..."
                    rows={2}
                  />
                </FormField>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add Wire
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Wire Change
              </Button>
            )}
          </>
        )}

        {/* Typical Wire Sequence Reference */}
        {!readOnly && (
          <details className="mt-4">
            <summary className="text-sm text-primary-600 cursor-pointer hover:underline">
              View typical wire sequence
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-muted/30 space-y-2">
              {typicalSequence.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{wireSizes.find(s => s.value === step.wireSize)?.label}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{getMaterialLabel(step.material)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
