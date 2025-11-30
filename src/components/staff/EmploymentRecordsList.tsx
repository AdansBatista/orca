'use client';

import { useState } from 'react';
import { Plus, Briefcase, ArrowUp, ArrowRight, UserMinus, Clock, RotateCcw, FileText } from 'lucide-react';
import type { EmploymentRecord } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmploymentRecordForm } from './EmploymentRecordForm';

interface EmploymentRecordsListProps {
  staffProfileId: string;
  records: EmploymentRecord[];
  canEdit: boolean;
  onUpdate: () => void;
}

const recordTypeConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'ghost'; icon: typeof Briefcase }> = {
  HIRE: { label: 'Hired', variant: 'success', icon: Briefcase },
  PROMOTION: { label: 'Promotion', variant: 'success', icon: ArrowUp },
  TRANSFER: { label: 'Transfer', variant: 'info', icon: ArrowRight },
  DEMOTION: { label: 'Demotion', variant: 'warning', icon: ArrowUp },
  TERMINATION: { label: 'Termination', variant: 'error', icon: UserMinus },
  RESIGNATION: { label: 'Resignation', variant: 'warning', icon: UserMinus },
  STATUS_CHANGE: { label: 'Status Change', variant: 'info', icon: FileText },
  DEPARTMENT_CHANGE: { label: 'Dept Change', variant: 'info', icon: ArrowRight },
  TITLE_CHANGE: { label: 'Title Change', variant: 'info', icon: FileText },
  EMPLOYMENT_TYPE_CHANGE: { label: 'Type Change', variant: 'info', icon: FileText },
  LEAVE_START: { label: 'Leave Started', variant: 'warning', icon: Clock },
  LEAVE_END: { label: 'Leave Ended', variant: 'success', icon: Clock },
  REHIRE: { label: 'Rehired', variant: 'success', icon: RotateCcw },
  OTHER: { label: 'Other', variant: 'ghost', icon: FileText },
};

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  PRN: 'PRN',
  TEMP: 'Temporary',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

function formatChange(previous: string | null | undefined, next: string | null | undefined, labelMap?: Record<string, string>): string | null {
  if (!previous && !next) return null;
  const prevLabel = previous ? (labelMap?.[previous] || previous) : 'None';
  const nextLabel = next ? (labelMap?.[next] || next) : 'None';
  return `${prevLabel} → ${nextLabel}`;
}

export function EmploymentRecordsList({ staffProfileId, records, canEdit, onUpdate }: EmploymentRecordsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    setDialogOpen(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle size="sm">Employment History</CardTitle>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Employment Record</DialogTitle>
              </DialogHeader>
              <EmploymentRecordForm
                staffProfileId={staffProfileId}
                onSuccess={handleSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No employment records on file
          </p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const config = recordTypeConfig[record.recordType] || recordTypeConfig.OTHER;
              const RecordIcon = config.icon;

              // Build change details
              const changes: string[] = [];
              const titleChange = formatChange(record.previousTitle, record.newTitle);
              const deptChange = formatChange(record.previousDepartment, record.newDepartment);
              const typeChange = formatChange(record.previousEmploymentType, record.newEmploymentType, employmentTypeLabels);
              const statusChange = formatChange(record.previousStatus, record.newStatus, statusLabels);

              if (titleChange) changes.push(`Title: ${titleChange}`);
              if (deptChange) changes.push(`Dept: ${deptChange}`);
              if (typeChange) changes.push(`Type: ${typeChange}`);
              if (statusChange) changes.push(`Status: ${statusChange}`);

              return (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-full bg-${config.variant === 'ghost' ? 'muted' : config.variant + '-100'}`}>
                      <RecordIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={config.variant} size="sm">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.effectiveDate).toLocaleDateString()}
                      </span>
                    </div>

                    {changes.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {changes.map((change, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {change}
                          </p>
                        ))}
                      </div>
                    )}

                    {record.reason && (
                      <p className="text-sm text-muted-foreground mt-1.5">
                        <span className="font-medium">Reason:</span> {record.reason}
                      </p>
                    )}

                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
