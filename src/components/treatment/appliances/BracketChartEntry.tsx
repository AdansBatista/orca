'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';

export interface BracketData {
  toothNumber: number;
  bracketType: string;
  bracketBrand?: string;
  prescription?: string;
  torque?: number;
  angulation?: number;
  bondedDate?: Date;
  status: 'NOT_PLACED' | 'BONDED' | 'DEBONDED' | 'REBONDED' | 'REMOVED';
  notes?: string;
}

interface BracketChartEntryProps {
  brackets: BracketData[];
  onChange: (brackets: BracketData[]) => void;
  arch: 'upper' | 'lower';
  readOnly?: boolean;
  onSave?: (brackets: BracketData[]) => void;
}

const bracketTypes = [
  { value: 'METAL_STANDARD', label: 'Metal Standard' },
  { value: 'METAL_SELF_LIGATING', label: 'Metal Self-Ligating' },
  { value: 'CERAMIC_STANDARD', label: 'Ceramic Standard' },
  { value: 'CERAMIC_SELF_LIGATING', label: 'Ceramic Self-Ligating' },
  { value: 'LINGUAL', label: 'Lingual' },
  { value: 'TUBE', label: 'Molar Tube' },
  { value: 'BAND', label: 'Molar Band' },
  { value: 'BUTTON', label: 'Button' },
  { value: 'HOOK', label: 'Hook' },
];

const bracketBrands = [
  '3M Unitek',
  'American Orthodontics',
  'Dentsply Sirona',
  'GAC',
  'Henry Schein',
  'Ormco',
  'RMO',
  'TP Orthodontics',
  'Other',
];

const prescriptions = [
  { value: 'ROTH', label: 'Roth' },
  { value: 'MBT', label: 'MBT' },
  { value: 'DAMON', label: 'Damon' },
  { value: 'STANDARD_EDGEWISE', label: 'Standard Edgewise' },
  { value: 'ANDREWS', label: 'Andrews' },
  { value: 'CUSTOM', label: 'Custom' },
];

const statusColors: Record<BracketData['status'], string> = {
  NOT_PLACED: 'secondary',
  BONDED: 'success',
  DEBONDED: 'warning',
  REBONDED: 'info',
  REMOVED: 'error',
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Alternative numbering (Universal system - US)
const upperTeethUS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const lowerTeethUS = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

export function BracketChartEntry({
  brackets,
  onChange,
  arch,
  readOnly = false,
  onSave,
}: BracketChartEntryProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [numberingSystem, setNumberingSystem] = useState<'FDI' | 'UNIVERSAL'>('FDI');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<number[]>([]);

  const teeth = arch === 'upper'
    ? (numberingSystem === 'FDI' ? upperTeeth : upperTeethUS)
    : (numberingSystem === 'FDI' ? lowerTeeth : lowerTeethUS);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<BracketData>>({
    defaultValues: {
      bracketType: 'METAL_STANDARD',
      prescription: 'MBT',
      status: 'NOT_PLACED',
    },
  });

  const getBracketForTooth = (toothNumber: number) => {
    return brackets.find((b) => b.toothNumber === toothNumber);
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly) return;

    if (bulkMode) {
      setBulkSelection((prev) =>
        prev.includes(toothNumber)
          ? prev.filter((t) => t !== toothNumber)
          : [...prev, toothNumber]
      );
    } else {
      setSelectedTooth(toothNumber);
      const existing = getBracketForTooth(toothNumber);
      if (existing) {
        setValue('bracketType', existing.bracketType);
        setValue('bracketBrand', existing.bracketBrand);
        setValue('prescription', existing.prescription);
        setValue('torque', existing.torque);
        setValue('angulation', existing.angulation);
        setValue('status', existing.status);
        setValue('notes', existing.notes);
      } else {
        reset();
      }
    }
  };

  const handleSaveTooth = (data: Partial<BracketData>) => {
    if (!selectedTooth) return;

    const newBracket: BracketData = {
      toothNumber: selectedTooth,
      bracketType: data.bracketType || 'METAL_STANDARD',
      bracketBrand: data.bracketBrand,
      prescription: data.prescription,
      torque: data.torque,
      angulation: data.angulation,
      bondedDate: data.status === 'BONDED' ? new Date() : undefined,
      status: data.status || 'NOT_PLACED',
      notes: data.notes,
    };

    const updated = brackets.filter((b) => b.toothNumber !== selectedTooth);
    updated.push(newBracket);
    onChange(updated);
    setSelectedTooth(null);
    reset();
  };

  const handleBulkApply = (data: Partial<BracketData>) => {
    const updated = brackets.filter((b) => !bulkSelection.includes(b.toothNumber));

    bulkSelection.forEach((toothNumber) => {
      updated.push({
        toothNumber,
        bracketType: data.bracketType || 'METAL_STANDARD',
        bracketBrand: data.bracketBrand,
        prescription: data.prescription,
        torque: data.torque,
        angulation: data.angulation,
        bondedDate: data.status === 'BONDED' ? new Date() : undefined,
        status: data.status || 'NOT_PLACED',
        notes: data.notes,
      });
    });

    onChange(updated);
    setBulkSelection([]);
    setBulkMode(false);
    reset();
  };

  const getToothColor = (toothNumber: number) => {
    const bracket = getBracketForTooth(toothNumber);
    if (!bracket) return 'bg-muted hover:bg-muted/80';

    const colors: Record<BracketData['status'], string> = {
      NOT_PLACED: 'bg-muted hover:bg-muted/80',
      BONDED: 'bg-success-100 text-success-700 hover:bg-success-200',
      DEBONDED: 'bg-warning-100 text-warning-700 hover:bg-warning-200',
      REBONDED: 'bg-info-100 text-info-700 hover:bg-info-200',
      REMOVED: 'bg-error-100 text-error-700 hover:bg-error-200',
    };
    return colors[bracket.status];
  };

  const isSelected = (toothNumber: number) => {
    if (bulkMode) return bulkSelection.includes(toothNumber);
    return selectedTooth === toothNumber;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm">
              {arch === 'upper' ? 'Upper' : 'Lower'} Arch Bracket Chart
            </CardTitle>
            <CardDescription>Click on a tooth to view/edit bracket information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={numberingSystem}
              onValueChange={(v) => setNumberingSystem(v as 'FDI' | 'UNIVERSAL')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FDI">FDI</SelectItem>
                <SelectItem value="UNIVERSAL">Universal</SelectItem>
              </SelectContent>
            </Select>
            {!readOnly && (
              <Button
                variant={bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setBulkSelection([]);
                }}
              >
                {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tooth Chart Visualization */}
        <div className="relative">
          <div className="flex justify-center gap-1">
            {teeth.map((toothNumber) => {
              const bracket = getBracketForTooth(toothNumber);
              return (
                <button
                  key={toothNumber}
                  type="button"
                  onClick={() => handleToothClick(toothNumber)}
                  disabled={readOnly && !bulkMode}
                  className={`
                    w-10 h-14 rounded-lg flex flex-col items-center justify-center
                    text-xs font-medium transition-all
                    ${getToothColor(toothNumber)}
                    ${isSelected(toothNumber) ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                    ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <span className="font-bold">{toothNumber}</span>
                  {bracket && (
                    <span className="text-[10px] mt-0.5">
                      {bracket.bracketType.slice(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(statusColors).map(([status, color]) => (
            <Badge key={status} variant={color as "success" | "warning" | "info" | "error" | "secondary"} size="sm">
              {status.replace('_', ' ')}
            </Badge>
          ))}
        </div>

        {/* Bulk Mode Selection Info */}
        {bulkMode && bulkSelection.length > 0 && (
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-sm">
              <strong>{bulkSelection.length}</strong> teeth selected: {bulkSelection.join(', ')}
            </p>
          </div>
        )}

        {/* Edit Form */}
        {!readOnly && (selectedTooth || (bulkMode && bulkSelection.length > 0)) && (
          <form
            onSubmit={handleSubmit(bulkMode ? handleBulkApply : handleSaveTooth)}
            className="p-4 rounded-lg border border-dashed space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {bulkMode
                  ? `Edit ${bulkSelection.length} Teeth`
                  : `Tooth ${selectedTooth}`}
              </h4>
              {!bulkMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTooth(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Bracket Type">
                <Select
                  value={watch('bracketType') || ''}
                  onValueChange={(v) => setValue('bracketType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bracketTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Brand">
                <Select
                  value={watch('bracketBrand') || ''}
                  onValueChange={(v) => setValue('bracketBrand', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bracketBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Prescription">
                <Select
                  value={watch('prescription') || ''}
                  onValueChange={(v) => setValue('prescription', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prescription..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prescriptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Torque (°)">
                <Input
                  {...register('torque', { valueAsNumber: true })}
                  type="number"
                  step={1}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Angulation (°)">
                <Input
                  {...register('angulation', { valueAsNumber: true })}
                  type="number"
                  step={1}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Status">
                <Select
                  value={watch('status') || 'NOT_PLACED'}
                  onValueChange={(v) => setValue('status', v as BracketData['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_PLACED">Not Placed</SelectItem>
                    <SelectItem value="BONDED">Bonded</SelectItem>
                    <SelectItem value="DEBONDED">Debonded</SelectItem>
                    <SelectItem value="REBONDED">Rebonded</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Notes">
              <Textarea {...register('notes')} placeholder="Additional notes..." rows={2} />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button type="submit" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {bulkMode ? 'Apply to Selected' : 'Save'}
              </Button>
            </div>
          </form>
        )}

        {/* Summary */}
        <div className="grid gap-2 sm:grid-cols-4 pt-4 border-t">
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-2xl font-bold">{brackets.filter((b) => b.status === 'BONDED').length}</p>
            <p className="text-xs text-muted-foreground">Bonded</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-2xl font-bold">{brackets.filter((b) => b.status === 'DEBONDED').length}</p>
            <p className="text-xs text-muted-foreground">Debonded</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-2xl font-bold">{brackets.filter((b) => b.status === 'REBONDED').length}</p>
            <p className="text-xs text-muted-foreground">Rebonded</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-2xl font-bold">{teeth.length - brackets.length}</p>
            <p className="text-xs text-muted-foreground">Not Placed</p>
          </div>
        </div>

        {/* Save All Button */}
        {!readOnly && onSave && (
          <div className="flex justify-end pt-4">
            <Button onClick={() => onSave(brackets)}>
              <Save className="h-4 w-4 mr-2" />
              Save Bracket Chart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
