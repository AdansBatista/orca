'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

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

export interface ClinicalFindingData {
  id?: string;
  findingType: string;
  category: string;
  description: string;
  severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  location?: string;
  toothNumbers?: string[];
  requiresFollowUp: boolean;
  followUpNotes?: string;
}

interface ClinicalFindingFormProps {
  findings: ClinicalFindingData[];
  onChange: (findings: ClinicalFindingData[]) => void;
  readOnly?: boolean;
}

const findingCategories = [
  {
    category: 'MALOCCLUSION',
    label: 'Malocclusion',
    types: [
      'Class I Malocclusion',
      'Class II Division 1',
      'Class II Division 2',
      'Class III Malocclusion',
      'Crossbite - Anterior',
      'Crossbite - Posterior',
      'Open Bite - Anterior',
      'Open Bite - Posterior',
      'Deep Bite',
      'Edge-to-Edge Bite',
    ],
  },
  {
    category: 'CROWDING_SPACING',
    label: 'Crowding/Spacing',
    types: [
      'Crowding - Mild',
      'Crowding - Moderate',
      'Crowding - Severe',
      'Spacing - Generalized',
      'Spacing - Localized',
      'Diastema',
      'Impacted Tooth',
      'Blocked Out Tooth',
    ],
  },
  {
    category: 'TOOTH_POSITION',
    label: 'Tooth Position',
    types: [
      'Rotation',
      'Tipping',
      'Torque Issue',
      'Intrusion Needed',
      'Extrusion Needed',
      'Ectopic Eruption',
      'Supernumerary Tooth',
      'Congenitally Missing Tooth',
    ],
  },
  {
    category: 'SKELETAL',
    label: 'Skeletal',
    types: [
      'Maxillary Protrusion',
      'Maxillary Retrusion',
      'Mandibular Protrusion',
      'Mandibular Retrusion',
      'Vertical Excess',
      'Vertical Deficiency',
      'Asymmetry',
      'Narrow Maxilla',
    ],
  },
  {
    category: 'SOFT_TISSUE',
    label: 'Soft Tissue',
    types: [
      'Lip Incompetence',
      'Tongue Thrust',
      'Tongue Tie',
      'Enlarged Tonsils',
      'Mouth Breathing',
      'Gingival Recession',
      'Gingival Hyperplasia',
      'Frenum Attachment Issue',
    ],
  },
  {
    category: 'TMJ_FUNCTION',
    label: 'TMJ/Function',
    types: [
      'TMJ Clicking',
      'TMJ Popping',
      'TMJ Pain',
      'Limited Opening',
      'Deviation on Opening',
      'Crepitus',
      'Bruxism',
      'Clenching',
    ],
  },
  {
    category: 'APPLIANCE_RELATED',
    label: 'Appliance Related',
    types: [
      'Bracket Debonded',
      'Band Loose',
      'Wire Distorted',
      'Appliance Broken',
      'Aligner Not Tracking',
      'Aligner Damaged',
      'Retainer Issues',
      'Elastics Not Worn',
    ],
  },
  {
    category: 'ORAL_HYGIENE',
    label: 'Oral Hygiene',
    types: [
      'Poor Oral Hygiene',
      'Plaque Accumulation',
      'Calculus Present',
      'White Spot Lesions',
      'Decalcification',
      'Gingivitis',
      'Food Impaction',
    ],
  },
  {
    category: 'OTHER',
    label: 'Other',
    types: [
      'Root Resorption',
      'Ankylosis',
      'Periodontal Concerns',
      'Caries',
      'Restoration Needed',
      'Other - See Notes',
    ],
  },
];

const severityConfig = {
  NORMAL: { label: 'Normal', color: 'success', icon: CheckCircle },
  MILD: { label: 'Mild', color: 'info', icon: Info },
  MODERATE: { label: 'Moderate', color: 'warning', icon: AlertTriangle },
  SEVERE: { label: 'Severe', color: 'error', icon: AlertCircle },
};

export function ClinicalFindingForm({
  findings,
  onChange,
  readOnly = false,
}: ClinicalFindingFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { register, handleSubmit, reset, setValue, watch } = useForm<ClinicalFindingData>({
    defaultValues: {
      findingType: '',
      category: '',
      description: '',
      severity: 'MILD',
      location: '',
      toothNumbers: [],
      requiresFollowUp: false,
      followUpNotes: '',
    },
  });

  const watchedSeverity = watch('severity');
  const watchedFindingType = watch('findingType');
  const watchedRequiresFollowUp = watch('requiresFollowUp');

  const categoryConfig = findingCategories.find((c) => c.category === selectedCategory);

  const handleAdd = (data: ClinicalFindingData) => {
    const newFinding: ClinicalFindingData = {
      ...data,
      id: `temp-${Date.now()}`,
      category: selectedCategory,
    };
    onChange([...findings, newFinding]);
    reset();
    setShowAddForm(false);
    setSelectedCategory('');
  };

  const handleRemove = (index: number) => {
    const updated = findings.filter((_, i) => i !== index);
    onChange(updated);
  };

  const getSeverityBadge = (severity: keyof typeof severityConfig) => {
    const config = severityConfig[severity];
    const Icon = config.icon;
    return (
      <Badge variant={config.color as "success" | "info" | "warning" | "error"} size="sm">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    return findingCategories.find((c) => c.category === category)?.label || category;
  };

  // Group findings by category for display
  const groupedFindings = findings.reduce((acc, finding) => {
    const cat = finding.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(finding);
    return acc;
  }, {} as Record<string, ClinicalFindingData[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Clinical Findings
        </CardTitle>
        <CardDescription>Document clinical observations and findings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Findings */}
        {Object.keys(groupedFindings).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedFindings).map(([category, categoryFindings]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {getCategoryLabel(category)}
                </h4>
                <div className="space-y-2">
                  {categoryFindings.map((finding, idx) => {
                    const globalIndex = findings.findIndex((f) => f.id === finding.id);
                    return (
                      <div
                        key={finding.id || idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{finding.findingType}</span>
                            {getSeverityBadge(finding.severity)}
                            {finding.requiresFollowUp && (
                              <Badge variant="warning" size="sm">
                                Follow-up Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{finding.description}</p>
                          {(finding.location || (finding.toothNumbers && finding.toothNumbers.length > 0)) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {finding.location && (
                                <Badge variant="outline" size="sm">
                                  {finding.location}
                                </Badge>
                              )}
                              {finding.toothNumbers && finding.toothNumbers.length > 0 && (
                                <Badge variant="outline" size="sm">
                                  Teeth: {finding.toothNumbers.join(', ')}
                                </Badge>
                              )}
                            </div>
                          )}
                          {finding.followUpNotes && (
                            <p className="text-xs text-warning-600 mt-2">
                              <strong>Follow-up:</strong> {finding.followUpNotes}
                            </p>
                          )}
                        </div>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-error-500"
                            onClick={() => handleRemove(globalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No clinical findings recorded yet.
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
                {/* Category Selection */}
                <FormField label="Category" required>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => {
                      setSelectedCategory(v);
                      setValue('findingType', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {findingCategories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Finding Type */}
                {selectedCategory && categoryConfig && (
                  <FormField label="Finding Type" required>
                    <Select
                      value={watchedFindingType}
                      onValueChange={(v) => setValue('findingType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select finding..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryConfig.types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* Severity */}
                <FormField label="Severity" required>
                  <Select
                    value={watchedSeverity}
                    onValueChange={(v) => setValue('severity', v as ClinicalFindingData['severity'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Description */}
                <FormField label="Description" required>
                  <Textarea
                    {...register('description', { required: true })}
                    placeholder="Describe the clinical finding in detail..."
                    rows={3}
                  />
                </FormField>

                {/* Location Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Location">
                    <Input
                      {...register('location')}
                      placeholder="e.g., Upper right quadrant"
                    />
                  </FormField>

                  <FormField label="Tooth Numbers">
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
                </div>

                {/* Follow-up Required */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={watchedRequiresFollowUp}
                      onCheckedChange={(checked) => setValue('requiresFollowUp', checked as boolean)}
                    />
                    <span className="text-sm font-medium">Requires Follow-up</span>
                  </label>

                  {watchedRequiresFollowUp && (
                    <FormField label="Follow-up Notes">
                      <Textarea
                        {...register('followUpNotes')}
                        placeholder="Describe recommended follow-up actions..."
                        rows={2}
                      />
                    </FormField>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      reset();
                      setSelectedCategory('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!selectedCategory || !watchedFindingType}
                  >
                    Add Finding
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
                Add Clinical Finding
              </Button>
            )}
          </>
        )}

        {/* Quick Add Common Findings */}
        {!readOnly && !showAddForm && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick add common findings:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'Poor Oral Hygiene', category: 'ORAL_HYGIENE', severity: 'MILD' as const },
                { type: 'Bracket Debonded', category: 'APPLIANCE_RELATED', severity: 'MODERATE' as const },
                { type: 'Elastics Not Worn', category: 'APPLIANCE_RELATED', severity: 'MILD' as const },
              ].map((finding) => (
                <Button
                  key={finding.type}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newFinding: ClinicalFindingData = {
                      id: `temp-${Date.now()}`,
                      findingType: finding.type,
                      category: finding.category,
                      description: finding.type,
                      severity: finding.severity,
                      requiresFollowUp: false,
                    };
                    onChange([...findings, newFinding]);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {finding.type}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
