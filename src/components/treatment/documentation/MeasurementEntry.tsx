'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MeasurementData {
  id?: string;
  measurementType: string;
  value: number;
  unit: string;
  notes?: string;
}

interface MeasurementEntryProps {
  measurements: MeasurementData[];
  onChange: (measurements: MeasurementData[]) => void;
  patientId?: string;
  progressNoteId?: string;
  readOnly?: boolean;
}

const measurementTypes = [
  { value: 'OVERJET', label: 'Overjet', unit: 'mm', description: 'Horizontal overlap of incisors' },
  { value: 'OVERBITE', label: 'Overbite', unit: 'mm', description: 'Vertical overlap of incisors' },
  { value: 'OVERBITE_PERCENT', label: 'Overbite %', unit: '%', description: 'Percentage overlap' },
  { value: 'CROWDING_UPPER', label: 'Crowding (Upper)', unit: 'mm', description: 'Upper arch crowding' },
  { value: 'CROWDING_LOWER', label: 'Crowding (Lower)', unit: 'mm', description: 'Lower arch crowding' },
  { value: 'SPACING_UPPER', label: 'Spacing (Upper)', unit: 'mm', description: 'Upper arch spacing' },
  { value: 'SPACING_LOWER', label: 'Spacing (Lower)', unit: 'mm', description: 'Lower arch spacing' },
  { value: 'MIDLINE_UPPER', label: 'Midline (Upper)', unit: 'mm', description: 'Upper midline deviation' },
  { value: 'MIDLINE_LOWER', label: 'Midline (Lower)', unit: 'mm', description: 'Lower midline deviation' },
  { value: 'INTERCANINE_WIDTH_UPPER', label: 'Intercanine (Upper)', unit: 'mm', description: 'Upper arch width at canines' },
  { value: 'INTERCANINE_WIDTH_LOWER', label: 'Intercanine (Lower)', unit: 'mm', description: 'Lower arch width at canines' },
  { value: 'INTERMOLAR_WIDTH_UPPER', label: 'Intermolar (Upper)', unit: 'mm', description: 'Upper arch width at molars' },
  { value: 'INTERMOLAR_WIDTH_LOWER', label: 'Intermolar (Lower)', unit: 'mm', description: 'Lower arch width at molars' },
];

const molarRelationships = [
  { value: 'MOLAR_RELATIONSHIP_RIGHT', label: 'Molar (Right)', unit: 'class', description: 'Right molar relationship (Class I, II, III)' },
  { value: 'MOLAR_RELATIONSHIP_LEFT', label: 'Molar (Left)', unit: 'class', description: 'Left molar relationship (Class I, II, III)' },
  { value: 'CANINE_RELATIONSHIP_RIGHT', label: 'Canine (Right)', unit: 'class', description: 'Right canine relationship' },
  { value: 'CANINE_RELATIONSHIP_LEFT', label: 'Canine (Left)', unit: 'class', description: 'Left canine relationship' },
];

export function MeasurementEntry({
  measurements,
  onChange,
  readOnly = false,
}: MeasurementEntryProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<MeasurementData>({
    defaultValues: {
      measurementType: '',
      value: 0,
      unit: 'mm',
      notes: '',
    },
  });

  const selectedType = watch('measurementType');
  const selectedTypeConfig = [...measurementTypes, ...molarRelationships].find(
    (t) => t.value === selectedType
  );

  const handleAdd = (data: MeasurementData) => {
    const newMeasurement: MeasurementData = {
      ...data,
      id: `temp-${Date.now()}`,
      unit: selectedTypeConfig?.unit || 'mm',
    };
    onChange([...measurements, newMeasurement]);
    reset();
    setShowAddForm(false);
  };

  const handleRemove = (index: number) => {
    const updated = measurements.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleValueChange = (index: number, value: number) => {
    const updated = measurements.map((m, i) =>
      i === index ? { ...m, value } : m
    );
    onChange(updated);
  };

  const getTypeLabel = (type: string) => {
    return (
      [...measurementTypes, ...molarRelationships].find((t) => t.value === type)?.label || type
    );
  };

  const usedTypes = measurements.map((m) => m.measurementType);
  const availableTypes = [...measurementTypes, ...molarRelationships].filter(
    (t) => !usedTypes.includes(t.value)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Clinical Measurements
        </CardTitle>
        <CardDescription>Record orthodontic measurements for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Measurements */}
        {measurements.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {measurements.map((measurement, index) => (
              <div
                key={measurement.id || index}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    {getTypeLabel(measurement.measurementType)}
                  </p>
                  {readOnly ? (
                    <p className="text-lg font-bold">
                      {measurement.value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {measurement.unit}
                      </span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={measurement.value}
                        onChange={(e) => handleValueChange(index, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8"
                        step={0.5}
                      />
                      <span className="text-sm text-muted-foreground">{measurement.unit}</span>
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-error-500"
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No measurements recorded yet.
          </p>
        )}

        {/* Add Form */}
        {!readOnly && (
          <>
            {showAddForm ? (
              <form
                onSubmit={handleSubmit(handleAdd)}
                className="p-4 rounded-lg border border-dashed"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Measurement Type">
                    <Select
                      value={selectedType}
                      onValueChange={(v) => setValue('measurementType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          Linear Measurements
                        </div>
                        {measurementTypes
                          .filter((t) => !usedTypes.includes(t.value))
                          .map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                          Relationships
                        </div>
                        {molarRelationships
                          .filter((t) => !usedTypes.includes(t.value))
                          .map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Value">
                    <div className="flex items-center gap-2">
                      <Input
                        {...register('value', { valueAsNumber: true })}
                        type="number"
                        step={0.5}
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {selectedTypeConfig?.unit || 'mm'}
                      </span>
                    </div>
                  </FormField>

                  <div className="flex items-end gap-2">
                    <Button type="submit" size="sm" disabled={!selectedType}>
                      Add
                    </Button>
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
                  </div>
                </div>

                {selectedTypeConfig?.description && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTypeConfig.description}
                  </p>
                )}
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
                disabled={availableTypes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Measurement
              </Button>
            )}
          </>
        )}

        {/* Quick Add Buttons */}
        {!readOnly && !showAddForm && availableTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <p className="text-xs text-muted-foreground w-full mb-1">Quick add:</p>
            {['OVERJET', 'OVERBITE', 'CROWDING_UPPER', 'CROWDING_LOWER']
              .filter((t) => !usedTypes.includes(t))
              .slice(0, 4)
              .map((type) => {
                const config = measurementTypes.find((t) => t.value === type);
                if (!config) return null;
                return (
                  <Button
                    key={type}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange([
                        ...measurements,
                        {
                          id: `temp-${Date.now()}`,
                          measurementType: type,
                          value: 0,
                          unit: config.unit,
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
