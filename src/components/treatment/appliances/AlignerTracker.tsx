'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, differenceInDays, isPast, isFuture } from 'date-fns';
import { Plus, CheckCircle, Clock, AlertTriangle, Box, Calendar, RefreshCw } from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';

export interface AlignerData {
  id?: string;
  alignerNumber: number;
  totalAligners: number;
  arch: 'UPPER' | 'LOWER' | 'BOTH';
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  wearDays: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'EXTENDED';
  trackingNotes?: string;
  attachmentsPlaced?: string[];
  iprCompleted?: boolean;
}

interface AlignerTrackerProps {
  aligners: AlignerData[];
  onChange: (aligners: AlignerData[]) => void;
  totalAligners: number;
  wearDaysPerAligner?: number;
  alignerBrand?: string;
  readOnly?: boolean;
}

const alignerBrands = [
  'Invisalign',
  'ClearCorrect',
  'SureSmile',
  'Spark',
  'uLab',
  '3M Clarity',
  'In-House',
  'Other',
];

export function AlignerTracker({
  aligners,
  onChange,
  totalAligners,
  wearDaysPerAligner = 14,
  alignerBrand = 'Invisalign',
  readOnly = false,
}: AlignerTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<AlignerData>>({
    defaultValues: {
      alignerNumber: aligners.length + 1,
      wearDays: wearDaysPerAligner,
      status: 'NOT_STARTED',
      arch: 'BOTH',
    },
  });

  // Calculate current aligner and progress
  const currentAligner = aligners.find((a) => a.status === 'IN_PROGRESS');
  const completedAligners = aligners.filter((a) => a.status === 'COMPLETED').length;
  const overallProgress = Math.round((completedAligners / totalAligners) * 100);

  // Calculate if current aligner is on track
  const getCurrentAlignerStatus = () => {
    if (!currentAligner) return null;

    const today = new Date();
    const expectedEnd = new Date(currentAligner.expectedEndDate);
    const daysRemaining = differenceInDays(expectedEnd, today);

    if (daysRemaining < 0) {
      return { status: 'overdue', message: `${Math.abs(daysRemaining)} days overdue` };
    } else if (daysRemaining <= 2) {
      return { status: 'due-soon', message: `Due in ${daysRemaining} days` };
    }
    return { status: 'on-track', message: `${daysRemaining} days remaining` };
  };

  const alignerStatus = getCurrentAlignerStatus();

  const handleAdd = (data: Partial<AlignerData>) => {
    const startDate = new Date();
    const newAligner: AlignerData = {
      id: `temp-${Date.now()}`,
      alignerNumber: data.alignerNumber || aligners.length + 1,
      totalAligners,
      arch: data.arch || 'BOTH',
      startDate,
      expectedEndDate: addDays(startDate, data.wearDays || wearDaysPerAligner),
      wearDays: data.wearDays || wearDaysPerAligner,
      status: 'IN_PROGRESS',
      trackingNotes: data.trackingNotes,
    };

    // Set previous in-progress aligner as completed
    const updated = aligners.map((a) => {
      if (a.status === 'IN_PROGRESS') {
        return {
          ...a,
          status: 'COMPLETED' as const,
          actualEndDate: new Date(),
        };
      }
      return a;
    });

    onChange([...updated, newAligner]);
    reset();
    setShowAddForm(false);
  };

  const handleMarkComplete = (alignerId: string) => {
    const updated = aligners.map((a) => {
      if (a.id === alignerId) {
        return {
          ...a,
          status: 'COMPLETED' as const,
          actualEndDate: new Date(),
        };
      }
      return a;
    });
    onChange(updated);
  };

  const handleExtend = (alignerId: string, additionalDays: number) => {
    const updated = aligners.map((a) => {
      if (a.id === alignerId) {
        return {
          ...a,
          status: 'EXTENDED' as const,
          expectedEndDate: addDays(new Date(a.expectedEndDate), additionalDays),
          wearDays: a.wearDays + additionalDays,
        };
      }
      return a;
    });
    onChange(updated);
  };

  const getStatusBadge = (status: AlignerData['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="secondary" size="sm">Not Started</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'SKIPPED':
        return <Badge variant="warning" size="sm">Skipped</Badge>;
      case 'EXTENDED':
        return <Badge variant="warning" size="sm"><RefreshCw className="h-3 w-3 mr-1" />Extended</Badge>;
    }
  };

  // Generate all aligners (for visual representation)
  const allAligners = Array.from({ length: totalAligners }, (_, i) => {
    const existing = aligners.find((a) => a.alignerNumber === i + 1);
    return existing || {
      alignerNumber: i + 1,
      status: 'NOT_STARTED' as const,
      totalAligners,
      arch: 'BOTH' as const,
      wearDays: wearDaysPerAligner,
      startDate: new Date(),
      expectedEndDate: new Date(),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Aligner Tracker
            </CardTitle>
            <CardDescription>
              {alignerBrand} • {totalAligners} aligners • {wearDaysPerAligner} days each
            </CardDescription>
          </div>
          <Badge variant="default">{overallProgress}% Complete</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completedAligners} of {totalAligners} aligners</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Current Aligner Status */}
        {currentAligner && alignerStatus && (
          <div className={`p-4 rounded-lg ${
            alignerStatus.status === 'overdue' ? 'bg-error-50 border border-error-200' :
            alignerStatus.status === 'due-soon' ? 'bg-warning-50 border border-warning-200' :
            'bg-success-50 border border-success-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Current: Aligner #{currentAligner.alignerNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started: {format(new Date(currentAligner.startDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    alignerStatus.status === 'overdue' ? 'error' :
                    alignerStatus.status === 'due-soon' ? 'warning' : 'success'
                  }
                >
                  {alignerStatus.status === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {alignerStatus.message}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {format(new Date(currentAligner.expectedEndDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleMarkComplete(currentAligner.id!)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExtend(currentAligner.id!, 7)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Extend 7 Days
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Aligner Grid Visualization */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Aligner Progress</h4>
          <div className="grid grid-cols-10 gap-1">
            {allAligners.map((aligner) => (
              <div
                key={aligner.alignerNumber}
                className={`
                  aspect-square rounded flex items-center justify-center text-xs font-medium
                  ${aligner.status === 'COMPLETED' ? 'bg-success-100 text-success-700' :
                    aligner.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' :
                    aligner.status === 'EXTENDED' ? 'bg-warning-100 text-warning-700' :
                    aligner.status === 'SKIPPED' ? 'bg-error-100 text-error-700' :
                    'bg-muted text-muted-foreground'}
                `}
                title={`Aligner ${aligner.alignerNumber} - ${aligner.status}`}
              >
                {aligner.alignerNumber}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success-100" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary-100 ring-1 ring-primary-500" /> Current
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-warning-100" /> Extended
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" /> Upcoming
            </span>
          </div>
        </div>

        {/* Aligner History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Aligner History</h4>
          {aligners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No aligners recorded yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...aligners].reverse().map((aligner) => (
                <div
                  key={aligner.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                    {aligner.alignerNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Aligner #{aligner.alignerNumber}</span>
                      {getStatusBadge(aligner.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(aligner.startDate), 'MMM d')} - {
                        aligner.actualEndDate
                          ? format(new Date(aligner.actualEndDate), 'MMM d, yyyy')
                          : format(new Date(aligner.expectedEndDate), 'MMM d, yyyy')
                      }
                      {' '}• {aligner.wearDays} days
                    </p>
                    {aligner.trackingNotes && (
                      <p className="text-xs text-muted-foreground mt-1">{aligner.trackingNotes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Next Aligner */}
        {!readOnly && (
          <>
            {showAddForm ? (
              <form
                onSubmit={handleSubmit(handleAdd)}
                className="p-4 rounded-lg border border-dashed space-y-4"
              >
                <h4 className="font-medium">Start Next Aligner</h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Aligner Number">
                    <Input
                      {...register('alignerNumber', { valueAsNumber: true })}
                      type="number"
                      min={1}
                      max={totalAligners}
                    />
                  </FormField>

                  <FormField label="Wear Days">
                    <Input
                      {...register('wearDays', { valueAsNumber: true })}
                      type="number"
                      min={7}
                      max={28}
                    />
                  </FormField>

                  <FormField label="Arch">
                    <Select
                      value={watch('arch') || 'BOTH'}
                      onValueChange={(v) => setValue('arch', v as 'UPPER' | 'LOWER' | 'BOTH')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPPER">Upper Only</SelectItem>
                        <SelectItem value="LOWER">Lower Only</SelectItem>
                        <SelectItem value="BOTH">Both Arches</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Tracking Notes">
                  <Textarea
                    {...register('trackingNotes')}
                    placeholder="Any tracking issues or notes..."
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
                    Start Aligner
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
                disabled={completedAligners >= totalAligners}
              >
                <Plus className="h-4 w-4 mr-2" />
                {currentAligner ? 'Start Next Aligner' : 'Start First Aligner'}
              </Button>
            )}
          </>
        )}

        {/* Treatment Timeline Estimate */}
        <div className="p-3 rounded-lg bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Treatment Timeline</h4>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Remaining Aligners</p>
              <p className="font-medium">{totalAligners - completedAligners}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. Time Remaining</p>
              <p className="font-medium">
                {Math.ceil((totalAligners - completedAligners) * wearDaysPerAligner / 7)} weeks
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. Completion</p>
              <p className="font-medium">
                {format(
                  addDays(new Date(), (totalAligners - completedAligners) * wearDaysPerAligner),
                  'MMM yyyy'
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
