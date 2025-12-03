'use client';

import { useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ClipboardCheck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { TransferStatus } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Define the transfer status flow
const TRANSFER_STEPS = [
  {
    status: 'REQUESTED',
    label: 'Requested',
    icon: Clock,
    description: 'Transfer request submitted',
  },
  {
    status: 'APPROVED',
    label: 'Approved',
    icon: ClipboardCheck,
    description: 'Request approved by receiving clinic',
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    icon: Package,
    description: 'Items being prepared for shipment',
  },
  {
    status: 'IN_TRANSIT',
    label: 'In Transit',
    icon: Truck,
    description: 'Items shipped and on the way',
  },
  {
    status: 'RECEIVED',
    label: 'Received',
    icon: CheckCircle,
    description: 'Items received at destination',
  },
] as const;

// Status to step index mapping
const STATUS_TO_STEP: Record<TransferStatus, number> = {
  REQUESTED: 0,
  APPROVED: 1,
  REJECTED: -1,
  PREPARING: 2,
  IN_TRANSIT: 3,
  RECEIVED: 4,
  CANCELLED: -1,
};

// Status badge variants
const STATUS_VARIANTS: Record<TransferStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  PREPARING: 'info',
  IN_TRANSIT: 'info',
  RECEIVED: 'success',
  CANCELLED: 'error',
};

interface TransferTrackerProps {
  status: TransferStatus;
  transferNumber: string;
  fromClinic: string;
  toClinic: string;
  requestedDate: Date | string;
  approvedDate?: Date | string | null;
  shippedDate?: Date | string | null;
  receivedDate?: Date | string | null;
  rejectionReason?: string | null;
  isUrgent?: boolean;
  trackingNumber?: string | null;
  carrierName?: string | null;
  compact?: boolean;
}

export function TransferTracker({
  status,
  transferNumber,
  fromClinic,
  toClinic,
  requestedDate,
  approvedDate,
  shippedDate,
  receivedDate,
  rejectionReason,
  isUrgent,
  trackingNumber,
  carrierName,
  compact = false,
}: TransferTrackerProps) {
  const currentStepIndex = STATUS_TO_STEP[status];
  const isTerminal = status === 'REJECTED' || status === 'CANCELLED';

  // Format date helper
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get step dates
  const stepDates = useMemo(() => ({
    REQUESTED: formatDate(requestedDate),
    APPROVED: formatDate(approvedDate),
    PREPARING: formatDate(approvedDate), // Usually same as approved
    IN_TRANSIT: formatDate(shippedDate),
    RECEIVED: formatDate(receivedDate),
  }), [requestedDate, approvedDate, shippedDate, receivedDate]);

  if (compact) {
    return <CompactTracker status={status} currentStepIndex={currentStepIndex} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            Transfer Status
            {isUrgent && (
              <Badge variant="error" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
          </CardTitle>
          <Badge variant={STATUS_VARIANTS[status]}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transfer Route */}
        <div className="flex items-center justify-center gap-4 py-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">From</p>
            <p className="font-medium">{fromClinic}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-border" />
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="w-8 h-px bg-border" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">To</p>
            <p className="font-medium">{toClinic}</p>
          </div>
        </div>

        {/* Terminal state (Rejected/Cancelled) */}
        {isTerminal && (
          <div className={cn(
            "p-4 rounded-lg border",
            status === 'REJECTED' ? 'bg-error-50 border-error-200' : 'bg-muted border-border'
          )}>
            <div className="flex items-start gap-3">
              <XCircle className={cn(
                "h-5 w-5 mt-0.5",
                status === 'REJECTED' ? 'text-error-600' : 'text-muted-foreground'
              )} />
              <div>
                <p className="font-medium">
                  {status === 'REJECTED' ? 'Transfer Rejected' : 'Transfer Cancelled'}
                </p>
                {rejectionReason && (
                  <p className="text-sm text-muted-foreground mt-1">{rejectionReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {!isTerminal && (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
            <div
              className="absolute left-6 top-6 w-0.5 bg-primary-500 transition-all duration-500"
              style={{
                height: `${Math.max(0, (currentStepIndex / (TRANSFER_STEPS.length - 1)) * 100)}%`,
              }}
            />

            {/* Steps */}
            <div className="space-y-6">
              {TRANSFER_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                const StepIcon = step.icon;
                const stepDate = stepDates[step.status as keyof typeof stepDates];

                return (
                  <div key={step.status} className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                        isCompleted
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : isCurrent
                          ? 'bg-background border-primary-500 text-primary-500'
                          : 'bg-background border-border text-muted-foreground'
                      )}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-2">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium",
                          isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <Badge variant="soft-primary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {stepDate && isCompleted && (
                        <p className="text-xs text-muted-foreground mt-1">{stepDate}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shipping Info */}
        {(trackingNumber || carrierName) && status !== 'REJECTED' && status !== 'CANCELLED' && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Shipping Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {carrierName && (
                <div>
                  <p className="text-muted-foreground">Carrier</p>
                  <p className="font-medium">{carrierName}</p>
                </div>
              )}
              {trackingNumber && (
                <div>
                  <p className="text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{trackingNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer Number */}
        <div className="pt-4 border-t flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Transfer ID</span>
          <span className="font-mono">{transferNumber}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact horizontal tracker for list views
 */
function CompactTracker({
  status,
  currentStepIndex,
}: {
  status: TransferStatus;
  currentStepIndex: number;
}) {
  const isTerminal = status === 'REJECTED' || status === 'CANCELLED';

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2">
        <XCircle className={cn(
          "h-4 w-4",
          status === 'REJECTED' ? 'text-error-500' : 'text-muted-foreground'
        )} />
        <span className="text-sm text-muted-foreground">
          {status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {TRANSFER_STEPS.map((step, index) => {
        const isCompleted = currentStepIndex >= index;
        const isCurrent = currentStepIndex === index;
        const StepIcon = step.icon;

        return (
          <div key={step.status} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full transition-all",
                isCompleted
                  ? 'bg-primary-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
              title={step.label}
            >
              <StepIcon className="h-3 w-3" />
            </div>
            {index < TRANSFER_STEPS.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 transition-all",
                  currentStepIndex > index ? 'bg-primary-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Mini status indicator for very compact displays
 */
export function TransferStatusIndicator({ status }: { status: TransferStatus }) {
  const config = {
    REQUESTED: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-100' },
    APPROVED: { icon: ClipboardCheck, color: 'text-success-500', bg: 'bg-success-100' },
    PREPARING: { icon: Package, color: 'text-info-500', bg: 'bg-info-100' },
    IN_TRANSIT: { icon: Truck, color: 'text-info-500', bg: 'bg-info-100' },
    RECEIVED: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-100' },
    REJECTED: { icon: XCircle, color: 'text-error-500', bg: 'bg-error-100' },
    CANCELLED: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const { icon: Icon, color, bg } = config[status];

  return (
    <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full", bg)}>
      <Icon className={cn("h-4 w-4", color)} />
    </div>
  );
}
