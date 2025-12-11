'use client';

import { Badge } from '@/components/ui/badge';

export type TreatmentPlanStatus =
  | 'DRAFT'
  | 'PRESENTED'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'DISCONTINUED'
  | 'TRANSFERRED';

export type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ACHIEVED'
  | 'MISSED'
  | 'DEFERRED'
  | 'CANCELLED';

const planStatusConfig: Record<
  TreatmentPlanStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PRESENTED: { label: 'Presented', variant: 'info' },
  ACCEPTED: { label: 'Accepted', variant: 'soft-primary' },
  ACTIVE: { label: 'Active', variant: 'default' },
  ON_HOLD: { label: 'On Hold', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  DISCONTINUED: { label: 'Discontinued', variant: 'destructive' },
  TRANSFERRED: { label: 'Transferred', variant: 'secondary' },
};

const phaseStatusConfig: Record<
  PhaseStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  SKIPPED: { label: 'Skipped', variant: 'warning' },
};

const milestoneStatusConfig: Record<
  MilestoneStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  ACHIEVED: { label: 'Achieved', variant: 'success' },
  MISSED: { label: 'Missed', variant: 'destructive' },
  DEFERRED: { label: 'Deferred', variant: 'warning' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

interface TreatmentStatusBadgeProps {
  status: string;
  type?: 'plan' | 'phase' | 'milestone';
  showDot?: boolean;
  size?: 'sm' | 'default';
}

export function TreatmentStatusBadge({
  status,
  type = 'plan',
  showDot = false,
  size = 'default',
}: TreatmentStatusBadgeProps) {
  let config: { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary' };

  switch (type) {
    case 'phase':
      config = phaseStatusConfig[status as PhaseStatus] || { label: status, variant: 'secondary' };
      break;
    case 'milestone':
      config = milestoneStatusConfig[status as MilestoneStatus] || { label: status, variant: 'secondary' };
      break;
    default:
      config = planStatusConfig[status as TreatmentPlanStatus] || { label: status, variant: 'secondary' };
  }

  return (
    <Badge variant={config.variant} dot={showDot} size={size}>
      {config.label}
    </Badge>
  );
}
