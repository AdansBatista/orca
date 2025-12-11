'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Award,
  Star,
  TrendingUp,
  FileCheck,
  Camera,
  MessageSquare,
  Save,
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
import { Separator } from '@/components/ui/separator';

export interface OutcomeAssessmentData {
  id?: string;
  assessmentDate: Date;
  assessedById?: string;

  // Overall Outcome
  overallOutcome: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'FAIR' | 'POOR';
  treatmentDurationMonths: number;

  // Clinical Outcomes
  alignmentScore: number;
  occlusionScore: number;
  aestheticScore: number;
  functionalScore: number;

  // Objective Measures
  finalOverjet?: number;
  finalOverbite?: number;
  finalCrowding?: string;
  molarRelationshipFinal?: string;
  canineRelationshipFinal?: string;

  // Treatment Goals
  primaryGoalsAchieved: boolean;
  secondaryGoalsAchieved: boolean;
  treatmentObjectives?: string;

  // Patient Satisfaction
  patientSatisfactionScore?: number;
  patientFeedback?: string;

  // Complications
  complications?: string;
  rootResorption: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  decalcification: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  gingivitisPresent: boolean;

  // Documentation
  finalPhotosComplete: boolean;
  finalRecordsComplete: boolean;
  retentionPlanDocumented: boolean;

  // Summary
  clinicalSummary?: string;
  lessonsLearned?: string;
  recommendations?: string;
}

interface OutcomeAssessmentFormProps {
  assessment?: OutcomeAssessmentData;
  onSave: (data: OutcomeAssessmentData) => void;
  treatmentPlanId: string;
  patientName: string;
  treatmentStartDate?: Date;
  readOnly?: boolean;
}

const outcomeLabels = {
  EXCELLENT: { label: 'Excellent', color: 'success', description: 'All goals exceeded' },
  GOOD: { label: 'Good', color: 'success', description: 'All primary goals achieved' },
  SATISFACTORY: { label: 'Satisfactory', color: 'info', description: 'Most goals achieved' },
  FAIR: { label: 'Fair', color: 'warning', description: 'Some goals achieved' },
  POOR: { label: 'Poor', color: 'error', description: 'Goals not achieved' },
};

const severityOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'MILD', label: 'Mild' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SEVERE', label: 'Severe' },
];

export function OutcomeAssessmentForm({
  assessment,
  onSave,
  treatmentPlanId,
  patientName,
  treatmentStartDate,
  readOnly = false,
}: OutcomeAssessmentFormProps) {
  const [isEditing, setIsEditing] = useState(!assessment);

  const { register, handleSubmit, watch, setValue } = useForm<OutcomeAssessmentData>({
    defaultValues: assessment || {
      assessmentDate: new Date(),
      overallOutcome: 'GOOD',
      treatmentDurationMonths: treatmentStartDate
        ? Math.round(
            (new Date().getTime() - new Date(treatmentStartDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0,
      alignmentScore: 8,
      occlusionScore: 8,
      aestheticScore: 8,
      functionalScore: 8,
      primaryGoalsAchieved: true,
      secondaryGoalsAchieved: true,
      rootResorption: 'NONE',
      decalcification: 'NONE',
      gingivitisPresent: false,
      finalPhotosComplete: false,
      finalRecordsComplete: false,
      retentionPlanDocumented: false,
    },
  });

  const watchedValues = watch();

  // Calculate average score
  const avgScore =
    (watchedValues.alignmentScore +
      watchedValues.occlusionScore +
      watchedValues.aestheticScore +
      watchedValues.functionalScore) /
    4;

  const handleSave = (data: OutcomeAssessmentData) => {
    onSave({
      ...data,
      assessmentDate: new Date(),
    });
    setIsEditing(false);
  };

  const getOutcomeBadge = (outcome: keyof typeof outcomeLabels) => {
    const config = outcomeLabels[outcome];
    return (
      <Badge variant={config.color as 'success' | 'warning' | 'error' | 'info'}>
        {config.label}
      </Badge>
    );
  };

  const renderScoreInput = (
    name: keyof OutcomeAssessmentData,
    label: string,
    description: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-lg font-bold">
          {watchedValues[name] as number}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={watchedValues[name] as number}
        onChange={(e) => setValue(name, parseInt(e.target.value) as number & string)}
        className="w-full accent-primary-600"
        disabled={readOnly && !isEditing}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  if (!isEditing && assessment) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Treatment Outcome Assessment
              </CardTitle>
              <CardDescription>
                {patientName} • Assessed {format(new Date(assessment.assessmentDate), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
            {getOutcomeBadge(assessment.overallOutcome)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">{assessment.treatmentDurationMonths}</p>
              <p className="text-xs text-muted-foreground">Months</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
            {assessment.patientSatisfactionScore && (
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold">{assessment.patientSatisfactionScore}</p>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">
                {assessment.primaryGoalsAchieved ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-muted-foreground">Goals Met</p>
            </div>
          </div>

          {/* Clinical Scores */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: 'alignmentScore', label: 'Alignment' },
              { key: 'occlusionScore', label: 'Occlusion' },
              { key: 'aestheticScore', label: 'Aesthetics' },
              { key: 'functionalScore', label: 'Function' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-4 rounded ${
                        i < (assessment[item.key as keyof OutcomeAssessmentData] as number)
                          ? 'bg-primary-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold">
                    {assessment[item.key as keyof OutcomeAssessmentData] as number}/10
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Complications */}
          <div className="p-3 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Complications</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={assessment.rootResorption === 'NONE' ? 'success' : 'warning'}>
                Root Resorption: {assessment.rootResorption}
              </Badge>
              <Badge variant={assessment.decalcification === 'NONE' ? 'success' : 'warning'}>
                Decalcification: {assessment.decalcification}
              </Badge>
              <Badge variant={assessment.gingivitisPresent ? 'warning' : 'success'}>
                Gingivitis: {assessment.gingivitisPresent ? 'Present' : 'None'}
              </Badge>
            </div>
          </div>

          {/* Clinical Summary */}
          {assessment.clinicalSummary && (
            <div>
              <h4 className="text-sm font-medium mb-1">Clinical Summary</h4>
              <p className="text-sm text-muted-foreground">{assessment.clinicalSummary}</p>
            </div>
          )}

          {/* Patient Feedback */}
          {assessment.patientFeedback && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-primary-600" />
                <h4 className="text-sm font-medium">Patient Feedback</h4>
              </div>
              <p className="text-sm">{assessment.patientFeedback}</p>
            </div>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>
                Edit Assessment
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
          <Award className="h-4 w-4" />
          Treatment Outcome Assessment
        </CardTitle>
        <CardDescription>
          Document final treatment outcomes for {patientName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Overall Outcome */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Overall Outcome" required>
              <Select
                value={watchedValues.overallOutcome}
                onValueChange={(v) => setValue('overallOutcome', v as OutcomeAssessmentData['overallOutcome'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(outcomeLabels).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {config.label}
                        <span className="text-xs text-muted-foreground">- {config.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Treatment Duration (months)">
              <Input
                {...register('treatmentDurationMonths', { valueAsNumber: true })}
                type="number"
                min={1}
              />
            </FormField>
          </div>

          <Separator />

          {/* Clinical Scores */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Clinical Scores (1-10)
            </h4>
            <div className="grid gap-6 sm:grid-cols-2">
              {renderScoreInput('alignmentScore', 'Alignment', 'Tooth positioning and leveling')}
              {renderScoreInput('occlusionScore', 'Occlusion', 'Bite relationship and function')}
              {renderScoreInput('aestheticScore', 'Aesthetics', 'Smile appearance and facial balance')}
              {renderScoreInput('functionalScore', 'Function', 'Chewing efficiency and jaw movement')}
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <span className="text-sm text-muted-foreground">Average Score: </span>
              <span className="text-lg font-bold">{avgScore.toFixed(1)}/10</span>
            </div>
          </div>

          <Separator />

          {/* Objective Measures */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Final Measurements</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Final Overjet (mm)">
                <Input
                  {...register('finalOverjet', { valueAsNumber: true })}
                  type="number"
                  step={0.5}
                />
              </FormField>
              <FormField label="Final Overbite (mm)">
                <Input
                  {...register('finalOverbite', { valueAsNumber: true })}
                  type="number"
                  step={0.5}
                />
              </FormField>
              <FormField label="Molar Relationship">
                <Select
                  value={watchedValues.molarRelationshipFinal || ''}
                  onValueChange={(v) => setValue('molarRelationshipFinal', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASS_I">Class I</SelectItem>
                    <SelectItem value="CLASS_II">Class II</SelectItem>
                    <SelectItem value="CLASS_III">Class III</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          <Separator />

          {/* Treatment Goals */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Treatment Goals
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Primary Goals Achieved?">
                <Select
                  value={watchedValues.primaryGoalsAchieved ? 'yes' : 'no'}
                  onValueChange={(v) => setValue('primaryGoalsAchieved', v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Secondary Goals Achieved?">
                <Select
                  value={watchedValues.secondaryGoalsAchieved ? 'yes' : 'no'}
                  onValueChange={(v) => setValue('secondaryGoalsAchieved', v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Treatment Objectives Summary">
              <Textarea
                {...register('treatmentObjectives')}
                placeholder="Summarize what was accomplished..."
                rows={2}
              />
            </FormField>
          </div>

          <Separator />

          {/* Patient Satisfaction */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Patient Satisfaction
            </h4>
            <FormField label="Satisfaction Score (1-10)">
              <Input
                {...register('patientSatisfactionScore', { valueAsNumber: true })}
                type="number"
                min={1}
                max={10}
              />
            </FormField>
            <FormField label="Patient Feedback">
              <Textarea
                {...register('patientFeedback')}
                placeholder="Document patient comments about their results..."
                rows={2}
              />
            </FormField>
          </div>

          <Separator />

          {/* Complications */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Complications & Side Effects</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Root Resorption">
                <Select
                  value={watchedValues.rootResorption}
                  onValueChange={(v) => setValue('rootResorption', v as OutcomeAssessmentData['rootResorption'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Decalcification">
                <Select
                  value={watchedValues.decalcification}
                  onValueChange={(v) => setValue('decalcification', v as OutcomeAssessmentData['decalcification'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Gingivitis Present">
                <Select
                  value={watchedValues.gingivitisPresent ? 'yes' : 'no'}
                  onValueChange={(v) => setValue('gingivitisPresent', v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Other Complications">
              <Textarea
                {...register('complications')}
                placeholder="Document any other complications that occurred..."
                rows={2}
              />
            </FormField>
          </div>

          <Separator />

          {/* Documentation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Documentation Checklist
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  {...register('finalPhotosComplete')}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium">Final Photos</p>
                  <p className="text-xs text-muted-foreground">All final photos taken</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  {...register('finalRecordsComplete')}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium">Final Records</p>
                  <p className="text-xs text-muted-foreground">All records updated</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  {...register('retentionPlanDocumented')}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium">Retention Plan</p>
                  <p className="text-xs text-muted-foreground">Protocol documented</p>
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Summary Notes */}
          <div className="space-y-4">
            <FormField label="Clinical Summary">
              <Textarea
                {...register('clinicalSummary')}
                placeholder="Summarize the overall treatment outcome..."
                rows={3}
              />
            </FormField>
            <FormField label="Lessons Learned">
              <Textarea
                {...register('lessonsLearned')}
                placeholder="Document any insights or learnings from this case..."
                rows={2}
              />
            </FormField>
            <FormField label="Recommendations">
              <Textarea
                {...register('recommendations')}
                placeholder="Future recommendations for the patient..."
                rows={2}
              />
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {assessment && (
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
