'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  Calendar,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';

export interface MilestoneData {
  id?: string;
  milestoneName: string;
  description?: string;
  targetDate?: Date;
  achievedDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED' | 'DEFERRED' | 'CANCELLED';
  milestoneType: string;
  isRequired: boolean;
  visibleToPatient: boolean;
  notes?: string;
}

interface MilestoneTrackerProps {
  milestones: MilestoneData[];
  onChange: (milestones: MilestoneData[]) => void;
  treatmentPlanId?: string;
  readOnly?: boolean;
}

const milestoneTypes = [
  { value: 'LEVELING_COMPLETE', label: 'Leveling Complete', phase: 'Initial' },
  { value: 'ALIGNMENT_COMPLETE', label: 'Alignment Complete', phase: 'Alignment' },
  { value: 'SPACE_CLOSURE_COMPLETE', label: 'Space Closure Complete', phase: 'Working' },
  { value: 'MIDLINE_CORRECTION', label: 'Midline Correction', phase: 'Working' },
  { value: 'WORKING_PHASE_COMPLETE', label: 'Working Phase Complete', phase: 'Working' },
  { value: 'DETAILING_COMPLETE', label: 'Detailing Complete', phase: 'Finishing' },
  { value: 'DEBOND_READY', label: 'Ready for Debond', phase: 'Finishing' },
  { value: 'DEBOND_COMPLETE', label: 'Debond Complete', phase: 'Completion' },
  { value: 'RETAINERS_DELIVERED', label: 'Retainers Delivered', phase: 'Retention' },
  { value: 'TREATMENT_COMPLETE', label: 'Treatment Complete', phase: 'Completion' },
  { value: 'IPR_COMPLETE', label: 'IPR Complete', phase: 'Various' },
  { value: 'EXTRACTION_COMPLETE', label: 'Extractions Complete', phase: 'Initial' },
  { value: 'SURGERY_COMPLETE', label: 'Surgery Complete', phase: 'Surgical' },
  { value: 'CUSTOM', label: 'Custom Milestone', phase: 'Various' },
];

const statusConfig = {
  PENDING: { label: 'Pending', color: 'secondary', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'info', icon: Clock },
  ACHIEVED: { label: 'Achieved', color: 'success', icon: CheckCircle },
  MISSED: { label: 'Missed', color: 'error', icon: AlertTriangle },
  DEFERRED: { label: 'Deferred', color: 'warning', icon: Clock },
  CANCELLED: { label: 'Cancelled', color: 'secondary', icon: AlertTriangle },
};

export function MilestoneTracker({
  milestones,
  onChange,
  readOnly = false,
}: MilestoneTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<MilestoneData>>({
    defaultValues: {
      milestoneName: '',
      milestoneType: '',
      status: 'PENDING',
      isRequired: false,
      visibleToPatient: true,
    },
  });

  // Calculate progress stats
  const totalMilestones = milestones.length;
  const achievedMilestones = milestones.filter((m) => m.status === 'ACHIEVED').length;
  const progressPercent = totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 0;

  // Sort milestones by status and date
  const sortedMilestones = [...milestones].sort((a, b) => {
    const statusOrder = { IN_PROGRESS: 0, PENDING: 1, ACHIEVED: 2, DEFERRED: 3, MISSED: 4, CANCELLED: 5 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by target date
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
    return 0;
  });

  // Check for upcoming/overdue milestones
  const upcomingMilestones = milestones.filter((m) => {
    if (m.status !== 'PENDING' && m.status !== 'IN_PROGRESS') return false;
    if (!m.targetDate) return false;
    const daysUntil = differenceInDays(new Date(m.targetDate), new Date());
    return daysUntil >= 0 && daysUntil <= 30;
  });

  const overdueMilestones = milestones.filter((m) => {
    if (m.status !== 'PENDING' && m.status !== 'IN_PROGRESS') return false;
    if (!m.targetDate) return false;
    return isPast(new Date(m.targetDate));
  });

  const handleAdd = (data: Partial<MilestoneData>) => {
    const typeConfig = milestoneTypes.find((t) => t.value === data.milestoneType);
    const newMilestone: MilestoneData = {
      id: `temp-${Date.now()}`,
      milestoneName: data.milestoneName || typeConfig?.label || 'New Milestone',
      description: data.description,
      targetDate: data.targetDate,
      status: 'PENDING',
      milestoneType: data.milestoneType || 'CUSTOM',
      isRequired: data.isRequired || false,
      visibleToPatient: data.visibleToPatient !== false,
      notes: data.notes,
    };
    onChange([...milestones, newMilestone]);
    reset();
    setShowAddForm(false);
  };

  const handleUpdate = (data: Partial<MilestoneData>) => {
    if (!editingId) return;
    const updated = milestones.map((m) =>
      m.id === editingId
        ? {
            ...m,
            ...data,
            achievedDate: data.status === 'ACHIEVED' && !m.achievedDate ? new Date() : m.achievedDate,
          }
        : m
    );
    onChange(updated);
    reset();
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id));
  };

  const handleStatusChange = (id: string, status: MilestoneData['status']) => {
    const updated = milestones.map((m) =>
      m.id === id
        ? {
            ...m,
            status,
            achievedDate: status === 'ACHIEVED' ? new Date() : m.achievedDate,
          }
        : m
    );
    onChange(updated);
  };

  const startEdit = (milestone: MilestoneData) => {
    setEditingId(milestone.id || null);
    setValue('milestoneName', milestone.milestoneName);
    setValue('description', milestone.description);
    setValue('targetDate', milestone.targetDate);
    setValue('milestoneType', milestone.milestoneType);
    setValue('status', milestone.status);
    setValue('isRequired', milestone.isRequired);
    setValue('visibleToPatient', milestone.visibleToPatient);
    setValue('notes', milestone.notes);
  };

  const getStatusBadge = (status: MilestoneData['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.color as "success" | "warning" | "error" | "info" | "secondary"} size="sm">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getDateStatus = (targetDate?: Date) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const daysUntil = differenceInDays(target, new Date());

    if (isPast(target)) {
      return { label: `${Math.abs(daysUntil)} days overdue`, variant: 'error' as const };
    } else if (daysUntil <= 7) {
      return { label: `Due in ${daysUntil} days`, variant: 'warning' as const };
    } else if (daysUntil <= 30) {
      return { label: `Due in ${daysUntil} days`, variant: 'info' as const };
    }
    return { label: format(target, 'MMM d, yyyy'), variant: 'secondary' as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Milestone Tracker
            </CardTitle>
            <CardDescription>Track treatment milestones and goals</CardDescription>
          </div>
          <Badge variant="default">{progressPercent}% Complete</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{achievedMilestones} of {totalMilestones} milestones</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Alerts */}
        {(overdueMilestones.length > 0 || upcomingMilestones.length > 0) && (
          <div className="space-y-2">
            {overdueMilestones.length > 0 && (
              <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{overdueMilestones.length} Overdue Milestone(s)</span>
                </div>
              </div>
            )}
            {upcomingMilestones.length > 0 && (
              <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-warning-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{upcomingMilestones.length} Upcoming Milestone(s)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Milestones List */}
        {sortedMilestones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No milestones defined yet. Add milestones to track treatment progress.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedMilestones.map((milestone) => {
              const dateStatus = getDateStatus(milestone.targetDate);
              const isEditing = editingId === milestone.id;

              if (isEditing) {
                return (
                  <form
                    key={milestone.id}
                    onSubmit={handleSubmit(handleUpdate)}
                    className="p-4 rounded-lg border border-primary-200 bg-primary-50 space-y-4"
                  >
                    <h4 className="font-medium">Edit Milestone</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Milestone Name">
                        <Input {...register('milestoneName')} />
                      </FormField>
                      <FormField label="Target Date">
                        <Input {...register('targetDate')} type="date" />
                      </FormField>
                    </div>
                    <FormField label="Description">
                      <Textarea {...register('description')} rows={2} />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Status">
                        <Select
                          value={watch('status') || 'PENDING'}
                          onValueChange={(v) => setValue('status', v as MilestoneData['status'])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={watch('visibleToPatient')}
                            onCheckedChange={(c) => setValue('visibleToPatient', c as boolean)}
                          />
                          <span className="text-sm">Visible to Patient</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={watch('isRequired')}
                            onCheckedChange={(c) => setValue('isRequired', c as boolean)}
                          />
                          <span className="text-sm">Required Milestone</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border ${
                    milestone.status === 'ACHIEVED'
                      ? 'bg-success-50 border-success-200'
                      : milestone.status === 'IN_PROGRESS'
                      ? 'bg-info-50 border-info-200'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.status === 'ACHIEVED'
                          ? 'bg-success-100 text-success-700'
                          : milestone.status === 'IN_PROGRESS'
                          ? 'bg-info-100 text-info-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {milestone.status === 'ACHIEVED' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Flag className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{milestone.milestoneName}</span>
                        {getStatusBadge(milestone.status)}
                        {milestone.isRequired && (
                          <Badge variant="outline" size="sm">Required</Badge>
                        )}
                        {!milestone.visibleToPatient && (
                          <Badge variant="secondary" size="sm">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {milestone.targetDate && dateStatus && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <Badge variant={dateStatus.variant} size="sm">
                              {dateStatus.label}
                            </Badge>
                          </span>
                        )}
                        {milestone.achievedDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-success-500" />
                            Achieved {format(new Date(milestone.achievedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        {milestone.status !== 'ACHIEVED' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(milestone.id!, 'ACHIEVED')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(milestone)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-error-500"
                          onClick={() => handleRemove(milestone.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Form */}
        {!readOnly && (
          <>
            {showAddForm ? (
              <form
                onSubmit={handleSubmit(handleAdd)}
                className="p-4 rounded-lg border border-dashed space-y-4"
              >
                <h4 className="font-medium">Add Milestone</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Milestone Type">
                    <Select
                      value={watch('milestoneType') || ''}
                      onValueChange={(v) => {
                        setValue('milestoneType', v);
                        const config = milestoneTypes.find((t) => t.value === v);
                        if (config && !watch('milestoneName')) {
                          setValue('milestoneName', config.label);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {milestoneTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Milestone Name">
                    <Input {...register('milestoneName')} placeholder="Enter name..." />
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Target Date">
                    <Input {...register('targetDate')} type="date" />
                  </FormField>
                  <div className="space-y-2 pt-6">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={watch('visibleToPatient') !== false}
                        onCheckedChange={(c) => setValue('visibleToPatient', c as boolean)}
                      />
                      <span className="text-sm">Visible to Patient</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={watch('isRequired')}
                        onCheckedChange={(c) => setValue('isRequired', c as boolean)}
                      />
                      <span className="text-sm">Required Milestone</span>
                    </label>
                  </div>
                </div>
                <FormField label="Description">
                  <Textarea {...register('description')} placeholder="Optional description..." rows={2} />
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
                    Add Milestone
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
                Add Milestone
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
