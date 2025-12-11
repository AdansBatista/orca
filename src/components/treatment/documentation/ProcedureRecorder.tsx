'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Stethoscope, Search, Clock, DollarSign } from 'lucide-react';

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

export interface ProcedureData {
  id?: string;
  procedureCode: string;
  procedureName: string;
  toothNumbers?: string[];
  quadrant?: string;
  arch?: string;
  fee?: number;
  notes?: string;
  performedById?: string;
  performedByName?: string;
}

interface ProcedureRecorderProps {
  procedures: ProcedureData[];
  onChange: (procedures: ProcedureData[]) => void;
  patientId?: string;
  progressNoteId?: string;
  readOnly?: boolean;
  providers?: { id: string; name: string }[];
}

// Common orthodontic ADA procedure codes
const commonProcedures = [
  { code: 'D8010', name: 'Limited Orthodontic Treatment - Primary Dentition', category: 'Limited' },
  { code: 'D8020', name: 'Limited Orthodontic Treatment - Transitional Dentition', category: 'Limited' },
  { code: 'D8030', name: 'Limited Orthodontic Treatment - Adolescent Dentition', category: 'Limited' },
  { code: 'D8040', name: 'Limited Orthodontic Treatment - Adult Dentition', category: 'Limited' },
  { code: 'D8070', name: 'Comprehensive Orthodontic Treatment - Transitional Dentition', category: 'Comprehensive' },
  { code: 'D8080', name: 'Comprehensive Orthodontic Treatment - Adolescent Dentition', category: 'Comprehensive' },
  { code: 'D8090', name: 'Comprehensive Orthodontic Treatment - Adult Dentition', category: 'Comprehensive' },
  { code: 'D8210', name: 'Removable Appliance Therapy', category: 'Appliance' },
  { code: 'D8220', name: 'Fixed Appliance Therapy', category: 'Appliance' },
  { code: 'D8660', name: 'Pre-Orthodontic Treatment Examination', category: 'Exam' },
  { code: 'D8670', name: 'Periodic Orthodontic Treatment Visit', category: 'Visit' },
  { code: 'D8680', name: 'Orthodontic Retention', category: 'Retention' },
  { code: 'D8681', name: 'Removable Orthodontic Retainer Adjustment', category: 'Retention' },
  { code: 'D8690', name: 'Orthodontic Treatment (Removal of Appliances)', category: 'Debond' },
  { code: 'D8691', name: 'Repair of Orthodontic Appliance', category: 'Repair' },
  { code: 'D8692', name: 'Replacement of Lost/Broken Retainer', category: 'Retention' },
  { code: 'D8693', name: 'Re-bonding/Re-cementing Fixed Retainer', category: 'Retention' },
  { code: 'D8694', name: 'Repair of Fixed Retainer', category: 'Retention' },
  { code: 'D8695', name: 'Removal of Fixed Orthodontic Appliances for Reasons Other Than Completion of Treatment', category: 'Removal' },
  { code: 'D8696', name: 'Repair of Orthodontic Appliance (Not by Original Provider)', category: 'Repair' },
  { code: 'D8697', name: 'Repair of Broken Retainer (Not by Original Provider)', category: 'Repair' },
  { code: 'D8698', name: 'Re-cement/Re-bond Fixed Retainer (Not by Original Provider)', category: 'Retention' },
  { code: 'D8699', name: 'Re-bonding of Bracket', category: 'Repair' },
  { code: 'D8701', name: 'Repair of Fixed Retainer (Including Reattachment)', category: 'Retention' },
  { code: 'D8702', name: 'Replacement of Lost/Broken Retainer (Clear/Removable)', category: 'Retention' },
  { code: 'D8703', name: 'Replacement of Lost/Broken Retainer (Hawley)', category: 'Retention' },
  { code: 'D8704', name: 'Custom Athletic Mouthguard', category: 'Appliance' },
];

const quadrants = [
  { value: 'UR', label: 'Upper Right (UR)' },
  { value: 'UL', label: 'Upper Left (UL)' },
  { value: 'LR', label: 'Lower Right (LR)' },
  { value: 'LL', label: 'Lower Left (LL)' },
];

const arches = [
  { value: 'UPPER', label: 'Upper Arch' },
  { value: 'LOWER', label: 'Lower Arch' },
  { value: 'BOTH', label: 'Both Arches' },
];

export function ProcedureRecorder({
  procedures,
  onChange,
  readOnly = false,
  providers = [],
}: ProcedureRecorderProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProcedureData>({
    defaultValues: {
      procedureCode: '',
      procedureName: '',
      toothNumbers: [],
      quadrant: '',
      arch: '',
      fee: 0,
      notes: '',
      performedById: '',
    },
  });

  const selectedCode = watch('procedureCode');
  const selectedProcedure = commonProcedures.find((p) => p.code === selectedCode);

  const filteredProcedures = commonProcedures.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (data: ProcedureData) => {
    const newProcedure: ProcedureData = {
      ...data,
      id: `temp-${Date.now()}`,
      procedureName: selectedProcedure?.name || data.procedureName,
    };
    onChange([...procedures, newProcedure]);
    reset();
    setShowAddForm(false);
    setSearchTerm('');
  };

  const handleRemove = (index: number) => {
    const updated = procedures.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleQuickAdd = (procedure: typeof commonProcedures[0]) => {
    const newProcedure: ProcedureData = {
      id: `temp-${Date.now()}`,
      procedureCode: procedure.code,
      procedureName: procedure.name,
    };
    onChange([...procedures, newProcedure]);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Limited': 'info',
      'Comprehensive': 'primary',
      'Appliance': 'warning',
      'Exam': 'secondary',
      'Visit': 'success',
      'Retention': 'accent',
      'Debond': 'error',
      'Repair': 'warning',
      'Removal': 'error',
    };
    return colors[category] || 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Procedures Performed
        </CardTitle>
        <CardDescription>Record procedures using ADA codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recorded Procedures */}
        {procedures.length > 0 ? (
          <div className="space-y-2">
            {procedures.map((procedure, index) => (
              <div
                key={procedure.id || index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" size="sm">
                      {procedure.procedureCode}
                    </Badge>
                    {procedure.fee && procedure.fee > 0 && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(procedure.fee)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{procedure.procedureName}</p>
                  {(procedure.quadrant || procedure.arch || (procedure.toothNumbers && procedure.toothNumbers.length > 0)) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {procedure.arch && (
                        <Badge variant="soft-primary" size="sm">
                          {procedure.arch}
                        </Badge>
                      )}
                      {procedure.quadrant && (
                        <Badge variant="soft-primary" size="sm">
                          {procedure.quadrant}
                        </Badge>
                      )}
                      {procedure.toothNumbers && procedure.toothNumbers.length > 0 && (
                        <Badge variant="soft-primary" size="sm">
                          Teeth: {procedure.toothNumbers.join(', ')}
                        </Badge>
                      )}
                    </div>
                  )}
                  {procedure.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{procedure.notes}</p>
                  )}
                  {procedure.performedByName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Performed by: {procedure.performedByName}
                    </p>
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
            No procedures recorded yet.
          </p>
        )}

        {/* Add Form */}
        {!readOnly && (
          <>
            {showAddForm ? (
              <form
                onSubmit={handleSubmit(handleAdd)}
                className="p-4 rounded-lg border border-dashed space-y-4"
              >
                {/* Search/Select Procedure */}
                <div>
                  <FormField label="Search Procedures">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by code, name, or category..."
                        className="pl-10"
                      />
                    </div>
                  </FormField>
                  {searchTerm && (
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {filteredProcedures.length > 0 ? (
                        filteredProcedures.map((proc) => (
                          <button
                            key={proc.code}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setValue('procedureCode', proc.code);
                              setValue('procedureName', proc.name);
                              setSearchTerm('');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={`soft-${getCategoryColor(proc.category)}` as "soft-primary" | "soft-secondary"}
                                size="sm"
                              >
                                {proc.code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {proc.category}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{proc.name}</p>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-3">
                          No procedures found. You can enter a custom code below.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Procedure Display */}
                {selectedCode && (
                  <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{selectedCode}</Badge>
                      <span className="text-sm font-medium">
                        {selectedProcedure?.name || watch('procedureName')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Arch">
                    <Select
                      value={watch('arch') || ''}
                      onValueChange={(v) => setValue('arch', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select arch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {arches.map((arch) => (
                          <SelectItem key={arch.value} value={arch.value}>
                            {arch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Quadrant">
                    <Select
                      value={watch('quadrant') || ''}
                      onValueChange={(v) => setValue('quadrant', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quadrant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quadrants.map((q) => (
                          <SelectItem key={q.value} value={q.value}>
                            {q.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Fee">
                    <Input
                      {...register('fee', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                    />
                  </FormField>
                </div>

                <FormField label="Tooth Numbers (comma-separated)">
                  <Input
                    placeholder="e.g., 3, 14, 19"
                    onChange={(e) => {
                      const teeth = e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                      setValue('toothNumbers', teeth);
                    }}
                  />
                </FormField>

                {providers.length > 0 && (
                  <FormField label="Performed By">
                    <Select
                      value={watch('performedById') || ''}
                      onValueChange={(v) => {
                        setValue('performedById', v);
                        const provider = providers.find((p) => p.id === v);
                        setValue('performedByName', provider?.name || '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider..." />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                <FormField label="Notes">
                  <Textarea
                    {...register('notes')}
                    placeholder="Additional notes about the procedure..."
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
                      setSearchTerm('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!selectedCode}>
                    Add Procedure
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
                Add Procedure
              </Button>
            )}
          </>
        )}

        {/* Quick Add Common Procedures */}
        {!readOnly && !showAddForm && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick add common procedures:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'D8670', name: 'Periodic Visit' },
                { code: 'D8691', name: 'Appliance Repair' },
                { code: 'D8699', name: 'Re-bond Bracket' },
              ].map((proc) => {
                const fullProc = commonProcedures.find((p) => p.code === proc.code);
                if (!fullProc) return null;
                return (
                  <Button
                    key={proc.code}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAdd(fullProc)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {proc.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
