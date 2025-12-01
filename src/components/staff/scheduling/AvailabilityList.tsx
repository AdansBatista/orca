'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Edit, Trash2, Calendar, Repeat, CalendarDays } from 'lucide-react';
import type { StaffAvailability } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AvailabilityListProps {
  availability: StaffAvailability[];
  onEdit: (availability: StaffAvailability) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const typeConfig = {
  AVAILABLE: {
    label: 'Available',
    variant: 'success' as const,
    bgClass: 'bg-success/10 text-success',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    variant: 'destructive' as const,
    bgClass: 'bg-destructive/10 text-destructive',
  },
  PREFERRED: {
    label: 'Preferred',
    variant: 'info' as const,
    bgClass: 'bg-info/10 text-info',
  },
  IF_NEEDED: {
    label: 'If Needed',
    variant: 'warning' as const,
    bgClass: 'bg-warning/10 text-warning',
  },
  BLOCKED: {
    label: 'Blocked',
    variant: 'destructive' as const,
    bgClass: 'bg-destructive/10 text-destructive',
  },
};

export function AvailabilityList({
  availability,
  onEdit,
  onDelete,
  isLoading,
}: AvailabilityListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
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

  if (availability.length === 0) {
    return (
      <Card variant="ghost">
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No availability set</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add availability preferences for scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separate recurring and specific date availability
  const recurringAvailability = availability.filter(a => a.isRecurring);
  const specificAvailability = availability.filter(a => !a.isRecurring);

  // Sort recurring by day of week, specific by date
  recurringAvailability.sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0));
  specificAvailability.sort((a, b) => {
    const dateA = a.specificDate ? new Date(a.specificDate).getTime() : 0;
    const dateB = b.specificDate ? new Date(b.specificDate).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Recurring Availability */}
        {recurringAvailability.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Weekly Pattern
            </h3>
            <div className="space-y-2">
              {recurringAvailability.map((avail) => {
                const config = typeConfig[avail.availabilityType];
                return (
                  <Card key={avail.id} className={!avail.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bgClass}`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {avail.dayOfWeek !== null ? dayNames[avail.dayOfWeek] : 'Every Day'}
                              </span>
                              <Badge variant={config.variant}>{config.label}</Badge>
                              {!avail.isActive && (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {avail.startTime && avail.endTime
                                ? `${avail.startTime} - ${avail.endTime}`
                                : 'All Day'}
                              {avail.reason && ` • ${avail.reason}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(avail)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(avail.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Specific Date Availability */}
        {specificAvailability.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Specific Dates
            </h3>
            <div className="space-y-2">
              {specificAvailability.map((avail) => {
                const config = typeConfig[avail.availabilityType];
                const date = avail.specificDate ? new Date(avail.specificDate) : null;
                const isPast = date && date < new Date();

                return (
                  <Card key={avail.id} className={!avail.isActive || isPast ? 'opacity-60' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bgClass}`}>
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {date ? format(date, 'EEEE, MMM d, yyyy') : 'No date'}
                              </span>
                              <Badge variant={config.variant}>{config.label}</Badge>
                              {isPast && <Badge variant="soft-secondary">Past</Badge>}
                              {!avail.isActive && <Badge variant="outline">Inactive</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {avail.allDay
                                ? 'All Day'
                                : avail.startTime && avail.endTime
                                  ? `${avail.startTime} - ${avail.endTime}`
                                  : 'Time not set'}
                              {avail.reason && ` • ${avail.reason}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(avail)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(avail.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this availability record?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
