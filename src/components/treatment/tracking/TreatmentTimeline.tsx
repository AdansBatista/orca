'use client';

import { useMemo } from 'react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  PlayCircle,
  StopCircle,
  Activity,
  FileText,
  Milestone,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TimelineEvent {
  id: string;
  type: 'milestone' | 'phase' | 'progress' | 'note' | 'appointment' | 'debond' | 'retention';
  title: string;
  description?: string;
  date: Date;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface TreatmentTimelineProps {
  events: TimelineEvent[];
  treatmentStartDate?: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  showFilters?: boolean;
}

const eventTypeConfig = {
  milestone: {
    icon: Flag,
    color: 'primary',
    label: 'Milestone',
  },
  phase: {
    icon: PlayCircle,
    color: 'info',
    label: 'Phase',
  },
  progress: {
    icon: Activity,
    color: 'success',
    label: 'Progress',
  },
  note: {
    icon: FileText,
    color: 'secondary',
    label: 'Note',
  },
  appointment: {
    icon: Calendar,
    color: 'accent',
    label: 'Appointment',
  },
  debond: {
    icon: StopCircle,
    color: 'warning',
    label: 'Debond',
  },
  retention: {
    icon: CheckCircle,
    color: 'success',
    label: 'Retention',
  },
};

const statusBadgeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  completed: 'success',
  achieved: 'success',
  active: 'info',
  in_progress: 'info',
  pending: 'secondary',
  missed: 'error',
  deferred: 'warning',
  ready: 'success',
};

export function TreatmentTimeline({
  events,
  treatmentStartDate,
  estimatedEndDate,
  actualEndDate,
  showFilters = true,
}: TreatmentTimelineProps) {
  // Group events by date (year-month)
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};

    const sortedEvents = [...events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedEvents.forEach((event) => {
      const key = format(new Date(event.date), 'yyyy-MM');
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    return groups;
  }, [events]);

  // Calculate treatment progress
  const treatmentProgress = useMemo(() => {
    if (!treatmentStartDate) return null;

    const start = new Date(treatmentStartDate);
    const end = actualEndDate ? new Date(actualEndDate) : estimatedEndDate ? new Date(estimatedEndDate) : null;
    const today = new Date();

    if (!end) return null;

    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    const progress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

    return {
      totalDays,
      elapsedDays,
      remainingDays: Math.max(0, totalDays - elapsedDays),
      progress,
      isComplete: actualEndDate !== undefined,
      isOverdue: !actualEndDate && isAfter(today, end),
    };
  }, [treatmentStartDate, estimatedEndDate, actualEndDate]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    const config = eventTypeConfig[type];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    return eventTypeConfig[type].color;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variant = statusBadgeVariants[status.toLowerCase()] || 'secondary';
    return (
      <Badge variant={variant} size="sm">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Treatment Timeline
          </CardTitle>
          <CardDescription>Track all treatment events and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No timeline events recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Treatment Timeline
        </CardTitle>
        <CardDescription>Track all treatment events and milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Treatment Progress Overview */}
        {treatmentProgress && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Treatment Progress</span>
              <Badge
                variant={
                  treatmentProgress.isComplete
                    ? 'success'
                    : treatmentProgress.isOverdue
                    ? 'error'
                    : 'info'
                }
              >
                {treatmentProgress.isComplete
                  ? 'Completed'
                  : treatmentProgress.isOverdue
                  ? 'Overdue'
                  : `${treatmentProgress.progress}%`}
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  treatmentProgress.isComplete
                    ? 'bg-success-500'
                    : treatmentProgress.isOverdue
                    ? 'bg-error-500'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${treatmentProgress.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Started: {treatmentStartDate && format(new Date(treatmentStartDate), 'MMM d, yyyy')}
              </span>
              <span>
                {treatmentProgress.isComplete
                  ? `Completed: ${actualEndDate && format(new Date(actualEndDate), 'MMM d, yyyy')}`
                  : `Est. End: ${estimatedEndDate && format(new Date(estimatedEndDate), 'MMM d, yyyy')}`}
              </span>
            </div>
            {!treatmentProgress.isComplete && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                <div>
                  <p className="text-lg font-bold">{treatmentProgress.elapsedDays}</p>
                  <p className="text-xs text-muted-foreground">Days Elapsed</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{treatmentProgress.remainingDays}</p>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{treatmentProgress.totalDays}</p>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Type Legend */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(eventTypeConfig).map(([type, config]) => (
              <Badge key={type} variant="outline" size="sm" className="gap-1">
                <config.icon className="h-3 w-3" />
                {config.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {Object.entries(groupedEvents).map(([monthKey, monthEvents], groupIndex) => (
            <div key={monthKey} className="mb-6">
              {/* Month Header */}
              <div className="sticky top-0 bg-background z-10 py-2 mb-3">
                <Badge variant="secondary" size="sm">
                  {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
                </Badge>
              </div>

              {/* Events for this month */}
              <div className="relative pl-6 border-l-2 border-muted space-y-4">
                {monthEvents.map((event, eventIndex) => {
                  const color = getEventColor(event.type);

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[25px] w-4 h-4 rounded-full bg-${color}-100 border-2 border-${color}-500 flex items-center justify-center`}
                        style={{
                          backgroundColor: `var(--${color}-100, #e0e7ff)`,
                          borderColor: `var(--${color}-500, #6366f1)`,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: `var(--${color}-500, #6366f1)` }}
                        />
                      </div>

                      {/* Event Content */}
                      <div className="ml-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex items-center justify-center w-6 h-6 rounded"
                              style={{ backgroundColor: `var(--${color}-100, #e0e7ff)` }}
                            >
                              {getEventIcon(event.type)}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.date), 'MMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2 ml-8">
                            {event.description}
                          </p>
                        )}

                        {/* Metadata Display */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 ml-8">
                            {Object.entries(event.metadata).map(([key, value]) => {
                              if (value === null || value === undefined) return null;
                              return (
                                <Badge key={key} variant="outline" size="sm">
                                  {key}: {String(value)}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
          {Object.entries(eventTypeConfig).slice(0, 4).map(([type, config]) => {
            const count = events.filter((e) => e.type === type).length;
            return (
              <div key={type} className="text-center p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <config.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}s</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
