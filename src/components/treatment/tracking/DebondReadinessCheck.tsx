'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  Sparkles,
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export interface DebondReadinessData {
  id?: string;
  assessmentDate: Date;
  isReady: boolean;
  readinessScore: number;

  // Clinical Criteria
  alignmentComplete: boolean;
  spacesClosed: boolean;
  midlinesCorrect: boolean;
  overbiteCorrect: boolean;
  overjetCorrect: boolean;
  molarRelationship: boolean;
  canineRelationship: boolean;
  archFormsAcceptable: boolean;
  rootParallelism: boolean;

  // Additional Checks
  patientSatisfied: boolean;
  parentsSatisfied?: boolean;
  photosUpdated: boolean;
  recordsComplete: boolean;
  retainersOrdered: boolean;

  // Notes
  clinicalNotes?: string;
  outstandingIssues?: string;

  // Scheduling
  scheduledDebondDate?: Date;
  debondCompleted?: boolean;
  debondCompletedDate?: Date;
}

interface DebondReadinessCheckProps {
  assessment?: DebondReadinessData;
  onSave: (data: DebondReadinessData) => void;
  treatmentPlanId: string;
  readOnly?: boolean;
}

const clinicalCriteria = [
  { key: 'alignmentComplete', label: 'Alignment Complete', description: 'All teeth properly aligned' },
  { key: 'spacesClosed', label: 'Spaces Closed', description: 'Extraction spaces and other gaps closed' },
  { key: 'midlinesCorrect', label: 'Midlines Correct', description: 'Upper and lower midlines aligned' },
  { key: 'overbiteCorrect', label: 'Overbite Correct', description: 'Vertical overlap within normal range' },
  { key: 'overjetCorrect', label: 'Overjet Correct', description: 'Horizontal overlap within normal range' },
  { key: 'molarRelationship', label: 'Molar Relationship', description: 'Class I or acceptable relationship' },
  { key: 'canineRelationship', label: 'Canine Relationship', description: 'Class I or acceptable relationship' },
  { key: 'archFormsAcceptable', label: 'Arch Forms Acceptable', description: 'Proper arch form and coordination' },
  { key: 'rootParallelism', label: 'Root Parallelism', description: 'Roots properly positioned (if applicable)' },
];

const additionalChecks = [
  { key: 'patientSatisfied', label: 'Patient Satisfied', description: 'Patient happy with results' },
  { key: 'parentsSatisfied', label: 'Parents/Guardian Satisfied', description: 'If applicable' },
  { key: 'photosUpdated', label: 'Final Photos Taken', description: 'Pre-debond photos complete' },
  { key: 'recordsComplete', label: 'Records Complete', description: 'All treatment records updated' },
  { key: 'retainersOrdered', label: 'Retainers Ordered', description: 'Retention appliances fabricated' },
];

export function DebondReadinessCheck({
  assessment,
  onSave,
  treatmentPlanId,
  readOnly = false,
}: DebondReadinessCheckProps) {
  const [isEditing, setIsEditing] = useState(!assessment);

  const { register, handleSubmit, watch, setValue } = useForm<DebondReadinessData>({
    defaultValues: assessment || {
      assessmentDate: new Date(),
      isReady: false,
      readinessScore: 0,
      alignmentComplete: false,
      spacesClosed: false,
      midlinesCorrect: false,
      overbiteCorrect: false,
      overjetCorrect: false,
      molarRelationship: false,
      canineRelationship: false,
      archFormsAcceptable: false,
      rootParallelism: false,
      patientSatisfied: false,
      parentsSatisfied: false,
      photosUpdated: false,
      recordsComplete: false,
      retainersOrdered: false,
    },
  });

  // Calculate readiness score
  const watchedValues = watch();
  const clinicalScore = clinicalCriteria.reduce((acc, item) => {
    return acc + (watchedValues[item.key as keyof DebondReadinessData] ? 1 : 0);
  }, 0);
  const clinicalPercent = Math.round((clinicalScore / clinicalCriteria.length) * 100);

  const additionalScore = additionalChecks.reduce((acc, item) => {
    const value = watchedValues[item.key as keyof DebondReadinessData];
    // Skip parentsSatisfied if not applicable
    if (item.key === 'parentsSatisfied' && value === undefined) return acc;
    return acc + (value ? 1 : 0);
  }, 0);
  const additionalTotal = additionalChecks.filter(
    (item) => item.key !== 'parentsSatisfied' || watchedValues.parentsSatisfied !== undefined
  ).length;
  const additionalPercent = Math.round((additionalScore / additionalTotal) * 100);

  const overallScore = Math.round((clinicalPercent * 0.7 + additionalPercent * 0.3));
  const isReady = clinicalPercent === 100 && additionalPercent >= 80;

  const handleSave = (data: DebondReadinessData) => {
    onSave({
      ...data,
      assessmentDate: new Date(),
      readinessScore: overallScore,
      isReady,
    });
    setIsEditing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  if (!isEditing && assessment) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle size="sm" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Debond Readiness Assessment
              </CardTitle>
              <CardDescription>
                Last assessed: {format(new Date(assessment.assessmentDate), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
            <Badge variant={assessment.isReady ? 'success' : 'warning'} className="gap-1">
              {assessment.isReady ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Ready for Debond
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Not Ready
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Overview */}
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Readiness Score</span>
              <span className="text-2xl font-bold">{assessment.readinessScore}%</span>
            </div>
            <Progress value={assessment.readinessScore} className="h-3" />
          </div>

          {/* Clinical Criteria Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Clinical Criteria</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {clinicalCriteria.map((item) => {
                const isComplete = assessment[item.key as keyof DebondReadinessData];
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      isComplete ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outstanding Issues */}
          {assessment.outstandingIssues && (
            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
              <h4 className="text-sm font-medium text-warning-700 mb-1">Outstanding Issues</h4>
              <p className="text-sm text-warning-600">{assessment.outstandingIssues}</p>
            </div>
          )}

          {/* Scheduled Debond */}
          {assessment.scheduledDebondDate && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                <span className="font-medium text-primary-700">
                  Debond Scheduled: {format(new Date(assessment.scheduledDebondDate), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>
                Update Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Debond Readiness Assessment
        </CardTitle>
        <CardDescription>
          Evaluate if the patient is ready for appliance removal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Current Score */}
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Current Readiness Score</span>
              <Badge variant={getScoreColor(overallScore) as "success" | "warning" | "error"}>
                {overallScore}%
              </Badge>
            </div>
            <Progress value={overallScore} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Clinical: {clinicalPercent}%</span>
              <span>Administrative: {additionalPercent}%</span>
            </div>
            {isReady && (
              <div className="flex items-center gap-2 mt-3 text-success-600">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Patient is ready for debond!</span>
              </div>
            )}
          </div>

          {/* Clinical Criteria */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Clinical Criteria (Required)</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {clinicalCriteria.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox
                    checked={watchedValues[item.key as keyof DebondReadinessData] as boolean}
                    onCheckedChange={(checked) =>
                      setValue(item.key as keyof DebondReadinessData, checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Checks */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Additional Checks</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {additionalChecks.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox
                    checked={watchedValues[item.key as keyof DebondReadinessData] as boolean}
                    onCheckedChange={(checked) =>
                      setValue(item.key as keyof DebondReadinessData, checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <FormField label="Clinical Notes">
              <Textarea
                {...register('clinicalNotes')}
                placeholder="Document clinical observations and recommendations..."
                rows={3}
              />
            </FormField>

            <FormField label="Outstanding Issues">
              <Textarea
                {...register('outstandingIssues')}
                placeholder="List any issues that need to be addressed before debond..."
                rows={2}
              />
            </FormField>
          </div>

          {/* Scheduling */}
          {isReady && (
            <div className="p-4 rounded-lg bg-success-50 border border-success-200 space-y-3">
              <div className="flex items-center gap-2 text-success-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ready to Schedule Debond</span>
              </div>
              <FormField label="Schedule Debond Date">
                <Input
                  type="date"
                  onChange={(e) => setValue('scheduledDebondDate', new Date(e.target.value))}
                />
              </FormField>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {assessment && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit">
              Save Assessment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
