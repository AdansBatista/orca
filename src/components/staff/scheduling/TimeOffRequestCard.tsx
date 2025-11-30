'use client';

import { Calendar, Clock, MoreHorizontal, User } from 'lucide-react';
import type { TimeOffRequest, StaffProfile } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

type TimeOffWithStaff = TimeOffRequest & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title' | 'department'>;
};

interface TimeOffRequestCardProps {
  request: TimeOffWithStaff;
  onApprove?: (request: TimeOffWithStaff) => void;
  onReject?: (request: TimeOffWithStaff) => void;
  onEdit?: (request: TimeOffWithStaff) => void;
  onCancel?: (request: TimeOffWithStaff) => void;
  showStaffName?: boolean;
  isAdmin?: boolean;
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
  WITHDRAWN: 'secondary',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  WITHDRAWN: 'Withdrawn',
};

const requestTypeLabels: Record<string, string> = {
  VACATION: 'Vacation',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal',
  BEREAVEMENT: 'Bereavement',
  JURY_DUTY: 'Jury Duty',
  MILITARY: 'Military',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
  FMLA: 'FMLA',
  UNPAID: 'Unpaid Leave',
  CONTINUING_EDUCATION: 'Continuing Education',
  HOLIDAY: 'Holiday',
  OTHER: 'Other',
};

export function TimeOffRequestCard({
  request,
  onApprove,
  onReject,
  onEdit,
  onCancel,
  showStaffName = true,
  isAdmin = false,
}: TimeOffRequestCardProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {/* Staff name */}
            {showStaffName && request.staffProfile && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  <PhiProtected fakeData={getFakeName()}>
                    {request.staffProfile.firstName} {request.staffProfile.lastName}
                  </PhiProtected>
                </span>
                {request.staffProfile.title && (
                  <span className="text-sm text-muted-foreground">
                    • {request.staffProfile.title}
                  </span>
                )}
              </div>
            )}

            {/* Date range */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {isSameDay
                  ? formatDate(startDate)
                  : `${formatDate(startDate)} - ${formatDate(endDate)}`}
              </span>
              <span className="text-muted-foreground">
                ({request.totalDays} {request.totalDays === 1 ? 'day' : 'days'})
              </span>
            </div>

            {/* Partial day times */}
            {request.isPartialDay && request.partialStartTime && request.partialEndTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(request.partialStartTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(request.partialEndTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2">
              <Badge variant={statusVariants[request.status] || 'secondary'}>
                {statusLabels[request.status] || request.status}
              </Badge>
              <Badge variant="outline">
                {requestTypeLabels[request.requestType] || request.requestType}
              </Badge>
            </div>

            {/* Reason */}
            {request.reason && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Reason:</span> {request.reason}
              </p>
            )}

            {/* Rejection reason */}
            {request.status === 'REJECTED' && request.rejectionReason && (
              <p className="text-sm text-destructive">
                <span className="font-medium">Rejection reason:</span> {request.rejectionReason}
              </p>
            )}
          </div>

          {/* Actions */}
          {(onApprove || onReject || onEdit || onCancel) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Admin actions */}
                {isAdmin && request.status === 'PENDING' && (
                  <>
                    {onApprove && (
                      <DropdownMenuItem onClick={() => onApprove(request)}>
                        Approve Request
                      </DropdownMenuItem>
                    )}
                    {onReject && (
                      <DropdownMenuItem onClick={() => onReject(request)}>
                        Reject Request
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* User actions */}
                {onEdit && request.status === 'PENDING' && (
                  <DropdownMenuItem onClick={() => onEdit(request)}>
                    Edit Request
                  </DropdownMenuItem>
                )}
                {onCancel && ['PENDING', 'APPROVED'].includes(request.status) && (
                  <DropdownMenuItem
                    onClick={() => onCancel(request)}
                    className="text-destructive"
                  >
                    {request.status === 'PENDING' ? 'Withdraw Request' : 'Cancel Request'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
