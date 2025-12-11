'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, addMonths, differenceInDays } from 'date-fns';
import { Plus, CheckCircle, Clock, AlertTriangle, Shield, Calendar, Trash2 } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';

export interface RetainerData {
  id?: string;
  retainerType: string;
  arch: 'UPPER' | 'LOWER';
  deliveredDate: Date;
  status: 'ACTIVE' | 'REPLACED' | 'LOST' | 'BROKEN' | 'DISCONTINUED';
  wearSchedule: string;
  lastCheckDate?: Date;
  nextCheckDate?: Date;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  notes?: string;
}

export interface RetentionCheckData {
  id?: string;
  checkDate: Date;
  retainerCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  fitAssessment: 'GOOD_FIT' | 'TIGHT' | 'LOOSE' | 'DOES_NOT_FIT';
  wearCompliance: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NON_COMPLIANT';
  stabilityAssessment: 'STABLE' | 'MINOR_RELAPSE' | 'SIGNIFICANT_RELAPSE';
  recommendedAction?: string;
  nextCheckMonths: number;
  notes?: string;
}

interface RetainerTrackerProps {
  retainers: RetainerData[];
  retentionChecks: RetentionCheckData[];
  onRetainersChange: (retainers: RetainerData[]) => void;
  onChecksChange: (checks: RetentionCheckData[]) => void;
  currentPhase: 'INITIAL' | 'TRANSITIONAL' | 'INDEFINITE';
  debondDate?: Date;
  readOnly?: boolean;
}

const retainerTypes = [
  { value: 'ESSIX', label: 'Essix (Clear)' },
  { value: 'HAWLEY', label: 'Hawley' },
  { value: 'FIXED_BONDED', label: 'Fixed/Bonded' },
  { value: 'VIVERA', label: 'Vivera' },
  { value: 'SPRING', label: 'Spring Retainer' },
  { value: 'WRAPAROUND', label: 'Wraparound' },
  { value: 'POSITIONER', label: 'Tooth Positioner' },
];

const wearSchedules = [
  { value: 'FULL_TIME', label: 'Full Time (22+ hrs)', description: 'First 3-6 months' },
  { value: 'NIGHTS_ONLY', label: 'Nights Only', description: 'After initial period' },
  { value: 'EVERY_OTHER_NIGHT', label: 'Every Other Night', description: 'Transitional' },
  { value: 'FEW_NIGHTS_WEEK', label: 'Few Nights/Week', description: 'Long-term maintenance' },
  { value: 'AS_NEEDED', label: 'As Needed', description: 'Indefinite retention' },
];

const conditionColors = {
  EXCELLENT: 'success',
  GOOD: 'info',
  FAIR: 'warning',
  POOR: 'error',
};

const phaseDescriptions = {
  INITIAL: 'Full-time wear (22+ hours)',
  TRANSITIONAL: 'Transitioning to nights only',
  INDEFINITE: 'Long-term retention',
};

export function RetainerTracker({
  retainers,
  retentionChecks,
  onRetainersChange,
  onChecksChange,
  currentPhase,
  debondDate,
  readOnly = false,
}: RetainerTrackerProps) {
  const [showAddRetainer, setShowAddRetainer] = useState(false);
  const [showAddCheck, setShowAddCheck] = useState(false);

  const retainerForm = useForm<Partial<RetainerData>>({
    defaultValues: {
      retainerType: 'ESSIX',
      arch: 'UPPER',
      wearSchedule: 'FULL_TIME',
      status: 'ACTIVE',
      condition: 'EXCELLENT',
    },
  });

  const checkForm = useForm<Partial<RetentionCheckData>>({
    defaultValues: {
      checkDate: new Date(),
      retainerCondition: 'GOOD',
      fitAssessment: 'GOOD_FIT',
      wearCompliance: 'GOOD',
      stabilityAssessment: 'STABLE',
      nextCheckMonths: 6,
    },
  });

  const activeRetainers = retainers.filter((r) => r.status === 'ACTIVE');
  const sortedChecks = [...retentionChecks].sort(
    (a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime()
  );
  const lastCheck = sortedChecks[0];

  // Calculate days since debond
  const daysSinceDebond = debondDate
    ? differenceInDays(new Date(), new Date(debondDate))
    : null;

  const handleAddRetainer = (data: Partial<RetainerData>) => {
    const newRetainer: RetainerData = {
      id: `temp-${Date.now()}`,
      retainerType: data.retainerType || 'ESSIX',
      arch: data.arch || 'UPPER',
      deliveredDate: new Date(),
      status: 'ACTIVE',
      wearSchedule: data.wearSchedule || 'FULL_TIME',
      condition: data.condition || 'EXCELLENT',
      nextCheckDate: addMonths(new Date(), 3),
      notes: data.notes,
    };
    onRetainersChange([...retainers, newRetainer]);
    retainerForm.reset();
    setShowAddRetainer(false);
  };

  const handleAddCheck = (data: Partial<RetentionCheckData>) => {
    const newCheck: RetentionCheckData = {
      id: `temp-${Date.now()}`,
      checkDate: new Date(),
      retainerCondition: data.retainerCondition || 'GOOD',
      fitAssessment: data.fitAssessment || 'GOOD_FIT',
      wearCompliance: data.wearCompliance || 'GOOD',
      stabilityAssessment: data.stabilityAssessment || 'STABLE',
      recommendedAction: data.recommendedAction,
      nextCheckMonths: data.nextCheckMonths || 6,
      notes: data.notes,
    };

    // Update retainer last/next check dates
    const updatedRetainers = retainers.map((r) => {
      if (r.status === 'ACTIVE') {
        return {
          ...r,
          lastCheckDate: new Date(),
          nextCheckDate: addMonths(new Date(), data.nextCheckMonths || 6),
          condition: data.retainerCondition as RetainerData['condition'],
        };
      }
      return r;
    });

    onRetainersChange(updatedRetainers);
    onChecksChange([...retentionChecks, newCheck]);
    checkForm.reset();
    setShowAddCheck(false);
  };

  const handleUpdateRetainerStatus = (retainerId: string, status: RetainerData['status']) => {
    const updated = retainers.map((r) =>
      r.id === retainerId ? { ...r, status } : r
    );
    onRetainersChange(updated);
  };

  const getConditionBadge = (condition: string) => {
    const color = conditionColors[condition as keyof typeof conditionColors] || 'secondary';
    return <Badge variant={color as "success" | "info" | "warning" | "error" | "secondary"} size="sm">{condition}</Badge>;
  };

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'EXCELLENT':
      case 'GOOD':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'FAIR':
        return <Clock className="h-4 w-4 text-warning-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Retention Protocol
            </CardTitle>
            <CardDescription>
              {debondDate && `Debonded ${format(new Date(debondDate), 'MMM d, yyyy')}`}
              {daysSinceDebond && ` • ${daysSinceDebond} days in retention`}
            </CardDescription>
          </div>
          <Badge variant="default">{currentPhase.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Phase Info */}
        <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Phase: {currentPhase.replace('_', ' ')}</p>
              <p className="text-sm text-muted-foreground">
                {phaseDescriptions[currentPhase]}
              </p>
            </div>
            {lastCheck && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last Check</p>
                <p className="font-medium">{format(new Date(lastCheck.checkDate), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Retainers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Active Retainers</h4>
          {activeRetainers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active retainers recorded.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeRetainers.map((retainer) => (
                <div
                  key={retainer.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" size="sm">{retainer.arch}</Badge>
                      <p className="font-medium mt-1">
                        {retainerTypes.find((t) => t.value === retainer.retainerType)?.label}
                      </p>
                    </div>
                    {getConditionBadge(retainer.condition)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {wearSchedules.find((s) => s.value === retainer.wearSchedule)?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delivered: {format(new Date(retainer.deliveredDate), 'MMM d, yyyy')}
                  </p>
                  {retainer.nextCheckDate && (
                    <p className="text-xs text-muted-foreground">
                      Next Check: {format(new Date(retainer.nextCheckDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  {!readOnly && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateRetainerStatus(retainer.id!, 'LOST')}
                      >
                        Mark Lost
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateRetainerStatus(retainer.id!, 'BROKEN')}
                      >
                        Mark Broken
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <>
              {showAddRetainer ? (
                <form
                  onSubmit={retainerForm.handleSubmit(handleAddRetainer)}
                  className="p-4 rounded-lg border border-dashed space-y-4"
                >
                  <h4 className="font-medium">Add Retainer</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Type">
                      <Select
                        value={retainerForm.watch('retainerType') || 'ESSIX'}
                        onValueChange={(v) => retainerForm.setValue('retainerType', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {retainerTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Arch">
                      <Select
                        value={retainerForm.watch('arch') || 'UPPER'}
                        onValueChange={(v) => retainerForm.setValue('arch', v as 'UPPER' | 'LOWER')}
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

                    <FormField label="Wear Schedule">
                      <Select
                        value={retainerForm.watch('wearSchedule') || 'FULL_TIME'}
                        onValueChange={(v) => retainerForm.setValue('wearSchedule', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {wearSchedules.map((schedule) => (
                            <SelectItem key={schedule.value} value={schedule.value}>
                              {schedule.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Notes">
                    <Textarea
                      {...retainerForm.register('notes')}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </FormField>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddRetainer(false);
                        retainerForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Add Retainer
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRetainer(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Retainer
                </Button>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Retention Check History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Retention Checks</h4>
            {!readOnly && !showAddCheck && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCheck(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Check
              </Button>
            )}
          </div>

          {showAddCheck && !readOnly && (
            <form
              onSubmit={checkForm.handleSubmit(handleAddCheck)}
              className="p-4 rounded-lg border border-dashed space-y-4"
            >
              <h4 className="font-medium">Record Retention Check</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Retainer Condition">
                  <Select
                    value={checkForm.watch('retainerCondition') || 'GOOD'}
                    onValueChange={(v) => checkForm.setValue('retainerCondition', v as RetentionCheckData['retainerCondition'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Fit Assessment">
                  <Select
                    value={checkForm.watch('fitAssessment') || 'GOOD_FIT'}
                    onValueChange={(v) => checkForm.setValue('fitAssessment', v as RetentionCheckData['fitAssessment'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOD_FIT">Good Fit</SelectItem>
                      <SelectItem value="TIGHT">Tight</SelectItem>
                      <SelectItem value="LOOSE">Loose</SelectItem>
                      <SelectItem value="DOES_NOT_FIT">Does Not Fit</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Wear Compliance">
                  <Select
                    value={checkForm.watch('wearCompliance') || 'GOOD'}
                    onValueChange={(v) => checkForm.setValue('wearCompliance', v as RetentionCheckData['wearCompliance'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                      <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Stability">
                  <Select
                    value={checkForm.watch('stabilityAssessment') || 'STABLE'}
                    onValueChange={(v) => checkForm.setValue('stabilityAssessment', v as RetentionCheckData['stabilityAssessment'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STABLE">Stable</SelectItem>
                      <SelectItem value="MINOR_RELAPSE">Minor Relapse</SelectItem>
                      <SelectItem value="SIGNIFICANT_RELAPSE">Significant Relapse</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Recommended Action">
                  <Input
                    {...checkForm.register('recommendedAction')}
                    placeholder="e.g., Continue current protocol"
                  />
                </FormField>

                <FormField label="Next Check (months)">
                  <Input
                    {...checkForm.register('nextCheckMonths', { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={24}
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <Textarea
                  {...checkForm.register('notes')}
                  placeholder="Additional observations..."
                  rows={2}
                />
              </FormField>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddCheck(false);
                    checkForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Check
                </Button>
              </div>
            </form>
          )}

          {sortedChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No retention checks recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(check.checkDate), 'MMM d, yyyy')}
                      </span>
                      {getComplianceIcon(check.wearCompliance)}
                    </div>
                    {getConditionBadge(check.retainerCondition)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" size="sm">
                      Fit: {check.fitAssessment.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      Compliance: {check.wearCompliance}
                    </Badge>
                    <Badge
                      variant={check.stabilityAssessment === 'STABLE' ? 'success' : check.stabilityAssessment === 'MINOR_RELAPSE' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {check.stabilityAssessment.replace('_', ' ')}
                    </Badge>
                  </div>
                  {check.recommendedAction && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Action:</strong> {check.recommendedAction}
                    </p>
                  )}
                  {check.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{check.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retention Schedule Reference */}
        <div className="p-3 rounded-lg bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Recommended Retention Schedule</h4>
          <div className="space-y-1 text-sm">
            <p><strong>0-3 months:</strong> Full-time wear (22+ hours/day)</p>
            <p><strong>3-6 months:</strong> Nights only (minimum 8 hours)</p>
            <p><strong>6-12 months:</strong> Every night</p>
            <p><strong>1-2 years:</strong> Every other night</p>
            <p><strong>2+ years:</strong> Few nights per week, indefinitely</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
