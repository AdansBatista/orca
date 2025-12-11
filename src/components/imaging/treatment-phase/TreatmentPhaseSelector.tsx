'use client';

/**
 * Treatment Phase Selector
 *
 * Component for selecting a treatment phase to link images to.
 */

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Layers,
  Calendar,
  Check,
  X,
  Loader2,
  FileImage,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

import {
  useTreatmentPhases,
  type TreatmentPlan,
  type TreatmentPhase,
} from '@/hooks/use-treatment-phases';

// =============================================================================
// Types
// =============================================================================

interface TreatmentPhaseSelectorProps {
  patientId: string;
  selectedPhaseId?: string | null;
  selectedPlanId?: string | null;
  onSelect: (phase: TreatmentPhase | null, plan: TreatmentPlan | null) => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PHASE_TYPE_LABELS: Record<string, string> = {
  INITIAL_ALIGNMENT: 'Initial Alignment',
  LEVELING: 'Leveling',
  SPACE_CLOSURE: 'Space Closure',
  FINISHING: 'Finishing',
  DETAILING: 'Detailing',
  RETENTION: 'Retention',
  OBSERVATION: 'Observation',
  CUSTOM: 'Custom',
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

// =============================================================================
// Component
// =============================================================================

export function TreatmentPhaseSelector({
  patientId,
  selectedPhaseId,
  selectedPlanId,
  onSelect,
  onClear,
  disabled,
  placeholder = 'Select treatment phase...',
  className,
}: TreatmentPhaseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const { isLoading, error, fetchPatientPhases } = useTreatmentPhases();

  // Find selected items
  const selectedPlan = treatmentPlans.find((p) => p.id === selectedPlanId);
  const selectedPhase = selectedPlan?.phases.find((p) => p.id === selectedPhaseId);

  // Load treatment phases when patient changes
  useEffect(() => {
    if (patientId && open) {
      fetchPatientPhases(patientId).then((data) => {
        if (data) {
          setTreatmentPlans(data.treatmentPlans);
        }
      });
    }
  }, [patientId, open, fetchPatientPhases]);

  const handleSelect = (phase: TreatmentPhase, plan: TreatmentPlan) => {
    onSelect(phase, plan);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null, null);
    onClear?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !patientId}
          className={cn('justify-between', className)}
        >
          {selectedPhase && selectedPlan ? (
            <div className="flex items-center gap-2 truncate">
              <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {selectedPlan.planName} - Phase {selectedPhase.phaseNumber}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search phases..." />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : treatmentPlans.length === 0 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No treatment plans found
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {selectedPhaseId && (
                  <>
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleClear}
                        className="text-muted-foreground"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear selection
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {treatmentPlans.map((plan) => (
                  <CommandGroup
                    key={plan.id}
                    heading={
                      <div className="flex items-center justify-between">
                        <span>{plan.planName}</span>
                        <Badge
                          variant="outline"
                          size="sm"
                        >
                          {PLAN_STATUS_LABELS[plan.status] || plan.status}
                        </Badge>
                      </div>
                    }
                  >
                    {plan.phases.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        No phases defined
                      </div>
                    ) : (
                      plan.phases.map((phase) => (
                        <CommandItem
                          key={phase.id}
                          value={`${plan.planName} ${phase.phaseName}`}
                          onSelect={() => handleSelect(phase, plan)}
                          className="flex items-center gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {selectedPhaseId === phase.id && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                              <span className="font-medium">
                                Phase {phase.phaseNumber}:
                              </span>
                              <span className="truncate">{phase.phaseName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>
                                {PHASE_TYPE_LABELS[phase.phaseType] || phase.phaseType}
                              </span>
                              {phase.imageCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileImage className="h-3 w-3" />
                                  {phase.imageCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              PHASE_STATUS_COLORS[phase.status] as
                                | 'outline'
                                | 'info'
                                | 'success'
                                | 'warning'
                            }
                            size="sm"
                          >
                            {phase.status.replace('_', ' ')}
                          </Badge>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
