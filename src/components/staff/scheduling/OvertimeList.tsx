'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Check, X, User } from 'lucide-react';
import type { OvertimeLog, StaffProfile } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface OvertimeLogWithStaff extends OvertimeLog {
  staffProfile: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'email' | 'title' | 'department'>;
}

interface OvertimeListProps {
  logs: OvertimeLogWithStaff[];
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    variant: 'warning' as const,
  },
  APPROVED: {
    label: 'Approved',
    variant: 'success' as const,
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'destructive' as const,
  },
  PAID: {
    label: 'Paid',
    variant: 'info' as const,
  },
};

export function OvertimeList({
  logs,
  onApprove,
  onReject,
  isLoading,
}: OvertimeListProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async () => {
    if (!actionId || !actionType) return;

    setIsSubmitting(true);
    try {
      if (actionType === 'approve') {
        await onApprove(actionId, actionNotes || undefined);
      } else {
        if (!actionNotes.trim()) {
          return; // Rejection requires reason
        }
        await onReject(actionId, actionNotes);
      }
      setActionId(null);
      setActionType(null);
      setActionNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApproveDialog = (id: string) => {
    setActionId(id);
    setActionType('approve');
    setActionNotes('');
  };

  const openRejectDialog = (id: string) => {
    setActionId(id);
    setActionType('reject');
    setActionNotes('');
  };

  const closeDialog = () => {
    setActionId(null);
    setActionType(null);
    setActionNotes('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card variant="ghost">
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No overtime logs found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Run overtime calculation to generate logs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {logs.map((log) => {
          const config = statusConfig[log.status];
          const weekStart = new Date(log.weekStartDate);
          const weekEnd = new Date(log.weekEndDate);

          return (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">
                          <PhiProtected fakeData={getFakeName()}>
                            {log.staffProfile.firstName} {log.staffProfile.lastName}
                          </PhiProtected>
                        </h3>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Regular:</span>{' '}
                          <span className="font-medium">{log.regularHours.toFixed(1)}h</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Overtime:</span>{' '}
                          <span className="font-medium text-warning">{log.overtimeHours.toFixed(1)}h</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Total:</span>{' '}
                          <span className="font-medium">{log.totalHours.toFixed(1)}h</span>
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {log.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApproveDialog(log.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRejectDialog(log.id)}
                      >
                        <X className="h-4 w-4 mr-1 text-destructive" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!actionId} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Overtime' : 'Reject Overtime'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={
                actionType === 'approve'
                  ? 'Add notes (optional)'
                  : 'Provide reason for rejection (required)'
              }
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting || (actionType === 'reject' && !actionNotes.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {isSubmitting
                ? 'Processing...'
                : actionType === 'approve'
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
