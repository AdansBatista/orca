'use client';

import { useState } from 'react';
import { Calendar, Edit, Trash2, Clock, Users, Briefcase } from 'lucide-react';
import type { ScheduleTemplate, EmploymentType } from '@prisma/client';

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

interface ScheduleTemplateListProps {
  templates: ScheduleTemplate[];
  onEdit: (template: ScheduleTemplate) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  CONTRACT: 'Contract',
  PRN: 'PRN',
  TEMP: 'Temporary',
};

const templateTypeLabels: Record<string, string> = {
  STANDARD: 'Standard',
  EXTENDED_HOURS: 'Extended Hours',
  HOLIDAY: 'Holiday',
  SEASONAL: 'Seasonal',
  CUSTOM: 'Custom',
};

interface TemplateShift {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

function formatShiftPattern(shifts: TemplateShift[]): string {
  // Group shifts by day
  const dayGroups: Record<number, TemplateShift[]> = {};
  shifts.forEach((shift) => {
    if (!dayGroups[shift.dayOfWeek]) {
      dayGroups[shift.dayOfWeek] = [];
    }
    dayGroups[shift.dayOfWeek].push(shift);
  });

  // Get unique days and sort them
  const days = Object.keys(dayGroups)
    .map(Number)
    .sort((a, b) => a - b);

  if (days.length === 0) return 'No shifts defined';

  // Check if all shifts have the same time
  const firstShift = shifts[0];
  const allSameTime = shifts.every(
    (s) => s.startTime === firstShift.startTime && s.endTime === firstShift.endTime
  );

  // Format days
  let daysStr: string;
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) {
    daysStr = 'Mon-Fri';
  } else if (days.length === 7) {
    daysStr = 'Every day';
  } else {
    daysStr = days.map((d) => dayLabels[d]).join(', ');
  }

  if (allSameTime) {
    return `${daysStr} ${firstShift.startTime}-${firstShift.endTime}`;
  }

  return `${daysStr} (various times)`;
}

function calculateWeeklyHours(shifts: TemplateShift[]): number {
  return shifts.reduce((total, shift) => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const durationMins = endMins - startMins - (shift.breakMinutes || 0);
    return total + durationMins / 60;
  }, 0);
}

export function ScheduleTemplateList({
  templates,
  onEdit,
  onDelete,
  isLoading,
}: ScheduleTemplateListProps) {
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

  if (templates.length === 0) {
    return (
      <Card variant="ghost">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No schedule templates configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create templates to define reusable shift patterns for staff members
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {templates.map((template) => {
          const shifts = (template.shifts as unknown as TemplateShift[]) || [];
          const weeklyHours = calculateWeeklyHours(shifts);
          const shiftPattern = formatShiftPattern(shifts);

          return (
            <Card
              key={template.id}
              className={`transition-opacity ${!template.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline">
                          {templateTypeLabels[template.templateType] || template.templateType}
                        </Badge>
                        {template.employmentType && (
                          <Badge variant="soft-primary">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {employmentTypeLabels[template.employmentType]}
                          </Badge>
                        )}
                        {template.isDefault && (
                          <Badge variant="success">Default</Badge>
                        )}
                        {!template.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {shiftPattern}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {weeklyHours.toFixed(1)}h/week
                        </span>
                      </div>

                      {template.description && (
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      )}

                      {/* Visual shift pattern */}
                      <div className="flex gap-1 mt-2">
                        {dayLabels.map((day, i) => {
                          const hasShift = shifts.some((s) => s.dayOfWeek === i);
                          return (
                            <div
                              key={day}
                              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                hasShift
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                              title={hasShift ? `${day}: Has shift` : `${day}: No shift`}
                            >
                              {day[0]}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule template? Staff members using
              this template will keep their existing shifts, but their default schedule
              assignment will be removed.
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
