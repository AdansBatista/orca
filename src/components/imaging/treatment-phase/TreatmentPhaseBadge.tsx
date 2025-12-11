'use client';

/**
 * Treatment Phase Badge
 *
 * Displays treatment phase information in a compact badge format.
 * Used to show which phase an image is linked to.
 */

import { X, Layers } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface TreatmentPhaseInfo {
  id: string;
  phaseNumber: number;
  phaseName: string;
  phaseType: string;
  status: string;
}

interface TreatmentPlanInfo {
  id: string;
  planName: string;
  planNumber?: number;
}

interface TreatmentPhaseBadgeProps {
  phase: TreatmentPhaseInfo;
  plan?: TreatmentPlanInfo | null;
  onRemove?: () => void;
  showPlanName?: boolean;
  size?: 'sm' | 'default';
  interactive?: boolean;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PHASE_TYPE_LABELS: Record<string, string> = {
  INITIAL_ALIGNMENT: 'Initial',
  LEVELING: 'Leveling',
  SPACE_CLOSURE: 'Space Closure',
  FINISHING: 'Finishing',
  DETAILING: 'Detailing',
  RETENTION: 'Retention',
  OBSERVATION: 'Observation',
  CUSTOM: 'Custom',
};

const PHASE_STATUS_VARIANTS: Record<
  string,
  'outline' | 'info' | 'success' | 'warning'
> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

// =============================================================================
// Component
// =============================================================================

export function TreatmentPhaseBadge({
  phase,
  plan,
  onRemove,
  showPlanName = false,
  size = 'default',
  interactive = false,
  className,
}: TreatmentPhaseBadgeProps) {
  const variant = PHASE_STATUS_VARIANTS[phase.status] || 'outline';
  const typeLabel = PHASE_TYPE_LABELS[phase.phaseType] || phase.phaseType;

  const badgeContent = (
    <Badge
      variant={variant}
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn(
        'gap-1.5',
        interactive && 'cursor-pointer hover:opacity-80',
        onRemove && 'pr-1',
        className
      )}
    >
      <Layers className={cn('flex-shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span className="truncate max-w-[150px]">
        {showPlanName && plan ? `${plan.planName} - ` : ''}
        Phase {phase.phaseNumber}
      </span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-4 w-4 p-0 hover:bg-transparent',
            size === 'sm' && 'h-3 w-3'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
          <span className="sr-only">Remove phase link</span>
        </Button>
      )}
    </Badge>
  );

  // Wrap with tooltip for full info
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="space-y-1">
            {plan && (
              <p className="font-medium text-sm">{plan.planName}</p>
            )}
            <p className="text-sm">
              Phase {phase.phaseNumber}: {phase.phaseName}
            </p>
            <p className="text-xs text-muted-foreground">
              {typeLabel} • {phase.status.replace('_', ' ')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Compact variant for image cards
// =============================================================================

interface CompactPhaseBadgeProps {
  phaseNumber: number;
  planName?: string;
  status: string;
  className?: string;
}

export function CompactPhaseBadge({
  phaseNumber,
  planName,
  status,
  className,
}: CompactPhaseBadgeProps) {
  const variant = PHASE_STATUS_VARIANTS[status] || 'outline';

  return (
    <Badge variant={variant} size="sm" className={cn('gap-1', className)}>
      <Layers className="h-3 w-3" />
      {planName ? `${planName} P${phaseNumber}` : `Phase ${phaseNumber}`}
    </Badge>
  );
}
